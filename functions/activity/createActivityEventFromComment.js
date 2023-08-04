const { db, functions, admin } = require("../admin");
const _ = require("lodash");
const {
  findMentions,
  getCommentCommonData,
  getPostCommonData,
  getPersonaCommonData,
  getCreatedByUserCommonData,
  newCreateActivityEvent,
  isUserInRoom,
} = require("./helpers");
const {
  createPushNotificationFromActivityEventRef,
} = require("./createPushNotificationFromActivityEvent");

exports.createActivityEventFromComment = functions
  .runWith({ minInstances: 2 })
  .firestore.document("{entity}/{entityId}/posts/{postId}/comments/{commentId}")
  .onWrite(async (change, context) => {
    const before = change.before;
    const after = change.after;
    const ref = after.ref;
    const entityType =
      context.params.entity === "communities" ? "community" : "persona";

    if (!before.exists && after.exists) {
      // New comment
      const snapshot = after;
      const comment = await ref.get();
      const commentUserId = comment.get("userID");
      const post = await ref.parent.parent.get();
      const entityDoc = await post.ref.parent.parent.get();
      const postUserId = post.get("userID");
      const isAnonymous =
        !!comment.get("anonymous") && !!comment.get("identityID");

      if (!commentUserId) {
        console.log('Undedifined User:');
        console.log('postUserId: ', postUserId);
        console.log('entity: ', context.params.entity);
        console.log('entityId: ', context.params.entityId);
        console.log('postId: ', context.params.postId);
        console.log('commentId: ', context.params.commentId);
        return;
      }

      const createdByUser = await db
        .collection("users")
        .doc(comment.get("userID"))
        .get();

      // A mention can be any user on the platform so we need to account for
      // them separately from post creator, comment creator and other users
      // who have commented on the post
      const mentions = [...findMentions(snapshot.get("text"))];

      const mentionIdsTmp = await Promise.all(
        mentions.map(async (userName) => {
          const userQuerySnapshot = await db
            .collection("users")
            .where("userName", "==", userName)
            .get();
          if (userQuerySnapshot.empty) {
            functions.logger.warn("Username does not exist:", userName);
            return null;
          }
          const doc = userQuerySnapshot.docs[0];
          // No self-mentions
          if (doc.id === createdByUser.id) {
            return null;
          }
          return doc.id;
        }),
      );

      const mentionIds = mentionIdsTmp.filter((mid) => !_.isNil(mid));

      const activityCollection = db
        .collection("users")
        .doc(postUserId)
        .collection("activity");

      const existingActivitySnap = await activityCollection
        .where("ref", "==", ref)
        .where("event_type", "==", "post_comment")
        .get();

      if (!existingActivitySnap.empty) {
        functions.logger.error(
          "Found existing activity",
          existingActivitySnap.docs.map((d) => d.ref.path),
          "for comment ref",
          ref,
        );
      }

      const relatedPostCommentsSnap = await post.ref
        .collection("comments")
        .get();
      const commentUserIDs = relatedPostCommentsSnap.docs.map((doc) =>
        doc.get("userID"),
      );
      const communityMemberUserIDs = entityDoc.get("communityMembers") || [];
      const uniqueRelatedUsers = new Set([
        ...commentUserIDs,
        ...(entityDoc.get("authors") ?? []),
        ...(entityDoc.get("members") ?? []),
        ...mentionIds,
        ...communityMemberUserIDs,
        postUserId,
      ]);
      uniqueRelatedUsers.delete(commentUserId);
      const additionalUsersToNotify = [...uniqueRelatedUsers];

      let identity;
      if (comment.get("identityID")) {
        identity = await db
          .collection("personas")
          .doc(comment.get("identityID"))
          .get();
      }

      const eventData = {
        created_at: snapshot.get("timestamp"),
        originalCreatedAt: snapshot.get("timestamp"),
        ref,
        seen: false,
        deleted: snapshot.get("deleted") || false,
        ...(entityType === "persona" && {
          persona_id: context.params.entityId,
        }),
        ...(entityType === "community" && {
          communityID: context.params.entityId,
        }),
        isAnonymous,
        comment: {
          id: comment.id,
          data: {
            ...getCommentCommonData(comment),
          },
          ref: comment.ref,
        },
        post: {
          id: post.id,
          data: {
            ...getPostCommonData(post),
          },
          ref: post.ref,
        },
        [entityType]: {
          id: entityDoc.id,
          data: {
            ...getPersonaCommonData(entityDoc),
          },
          ref: entityDoc.ref,
        },
        createdByUser: {
          id: createdByUser.id,
          data: {
            ...getCreatedByUserCommonData(createdByUser),
          },
          ref: createdByUser.ref,
        },
        ...(identity &&
          identity.exists && {
            identity: {
              id: comment.get("identityID") || "",
              name: identity.get("name") || "",
              profileImgUrl: identity.get("profileImgUrl") || "",
            },
          }),
      };

      await Promise.all(
        additionalUsersToNotify.map(async (userID) => {
          // Only create a mention event for users that were mentioned.
          // Everyone else gets a comment event.
          const eventDataCopy = Object.assign({}, eventData);
          if (mentionIds.includes(userID)) {
            eventDataCopy.event_type = "comment_mention";
          } else {
            eventDataCopy.event_type = "post_comment";
          }

          // Don't send a post_comment notification if we're in the room
          const isEventPostComment =
            eventDataCopy.event_type === "post_comment";
          const isUserInRoomBool = await isUserInRoom({
            userID,
            roomPath: `${context.params.entity}/${context.params.entityId}/posts/${context.params.postId}`,
          });
          if (isEventPostComment && isUserInRoomBool) {
            functions.logger.log(
              " User is in room, skipping post_comment notification",
            );
            return;
          }

          if (eventDataCopy.event_type === "post_comment") {
            const existingPostCommentEvent = await db
              .collection("users")
              .doc(userID)
              .collection("activity")
              .where("post.ref", "==", post.ref)
              .where("event_type", "==", "post_comment")
              .orderBy("created_at", "desc")
              .get();
            if (existingPostCommentEvent.docs.length > 0) {
              const latestEvent = existingPostCommentEvent.docs[0];
              await latestEvent.ref.update({
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                comment: {
                  id: comment.id,
                  data: {
                    ...getCommentCommonData(comment),
                  },
                  ref: comment.ref,
                },
                createdByUser: {
                  id: createdByUser.id,
                  data: {
                    ...getCreatedByUserCommonData(createdByUser),
                  },
                  ref: createdByUser.ref,
                },
                deleted: false,
              });
              const updatedLatestEventSnapshot = await latestEvent.ref.get();
              await createPushNotificationFromActivityEventRef({
                eventSnapshot: updatedLatestEventSnapshot,
                userID,
              });
            } else {
              await newCreateActivityEvent({
                userID,
                eventData: eventDataCopy,
                entity: entityDoc,
                entityType,
                post,
              });
            }
          } else {
            await newCreateActivityEvent({
              userID,
              eventData: eventDataCopy,
              entity: entityDoc,
              entityType,
              post,
            });
          }
        }),
      );
    } else {
      // Edited comment: Only create mention events for users that were mentioned
      // Don't bother if the text hasn't changed or we have no text
      if (
        (after.exists && before.get("text") === after.get("text")) ||
        after.get("text") === ""
      ) {
        return;
      }

      const beforeMentions = findMentions(before.get("text"));
      const afterMentions = findMentions(after.get("text"));

      if (
        _.isEqual(beforeMentions, afterMentions) ||
        afterMentions.length === 0
      ) {
        return;
      }

      const newMentions = [...afterMentions].filter(
        (x) => !beforeMentions.has(x),
      );

      if (newMentions.length === 0) {
        return;
      }

      const comment = after;
      const ref = comment.ref;
      const post = await ref.parent.parent.get();
      const entityDoc = await post.ref.parent.parent.get();
      const isAnonymous = !!comment.get("anonymous");
      const createdByUser = await db
        .collection("users")
        .doc(comment.get("userID"))
        .get();

      let identity;
      if (comment.get("identityID")) {
        identity = await db
          .collection("personas")
          .doc(comment.get("identityID"))
          .get();
      }

      newMentions.forEach(async (userName) => {
        const userQuerySnapshot = await db
          .collection("users")
          .where("userName", "==", userName)
          .get();

        if (userQuerySnapshot.empty) {
          functions.logger.warn("Username does not exist:", userName);
          return;
        }

        // FIXME: As of right now usernames are not unique and we have no way
        // to disambiguate between two users with the same username. So we
        // just pick the first one.
        const doc = userQuerySnapshot.docs[0];

        // No self-mentions
        if (doc.id === createdByUser.id) {
          return;
        }

        const eventData = {
          created_at: after.get("editTimestamp"),
          ref,
          event_type: "comment_mention",
          seen: false,
          deleted: after.get("deleted") || false,
          ...(entityType === "persona" && {
            persona_id: context.params.entityId,
          }),
          ...(entityType === "community" && {
            communityID: context.params.entityId,
          }),
          isAnonymous,
          comment: {
            id: comment.id,
            data: {
              ...getCommentCommonData(comment),
            },
            ref: comment.ref,
          },
          post: {
            id: post.id,
            data: {
              ...getPostCommonData(post),
            },
            ref: post.ref,
          },
          [entityType]: {
            id: entityDoc.id,
            data: {
              ...getPersonaCommonData(entityDoc),
            },
            ref: entityDoc.ref,
          },
          createdByUser: {
            id: createdByUser.id,
            data: {
              ...getCreatedByUserCommonData(createdByUser),
            },
            ref: createdByUser.ref,
          },
          ...(identity &&
            identity.exists && {
              identity: {
                id: comment.get("identityID") || "",
                name: identity.get("name") || "",
                profileImgUrl: identity.get("profileImgUrl") || "",
              },
            }),
        };

        functions.logger.log(
          `Comment edited: creating comment_mention event for ${doc.id} on comment ${comment.id}`,
        );

        await newCreateActivityEvent({
          userID: doc.id,
          eventData,
          entity: entityDoc,
          entityType,
          post,
        });
      });
    }
  });
