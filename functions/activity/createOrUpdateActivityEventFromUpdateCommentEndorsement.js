const { db, admin, functions } = require("../admin");
const _ = require("lodash");
const {
  newCreateActivityEvent,
  getCommentCommonData,
  getPostCommonData,
  getPersonaCommonData,
  isUserInRoom,
  getCreatedByUserCommonData,
} = require("./helpers");

// Handles post comments and chat messages
exports.createOrUpdateActivityEventFromUpdateCommentEndorsement = functions
  .runWith({ minInstances: 1 })
  .firestore.document(
    "{entity}/{entityId}/{roomCollectionName}/{roomId}/{commentCollectionName}/{commentId}",
  )
  .onUpdate(async (change, context) => {
    functions.logger.log(
      `Starting: ${context.params.entity}/${context.params.entityId}/${context.params.roomCollectionName}/${context.params.roomId}/${context.params.commentCollectionName}/${context.params.commentId}`,
    );

    const afterSnapshot = change.after.data();

    if (
      context.params.entity !== "personas" &&
      context.params.entity !== "communities"
    ) {
      functions.logger.log("Not a persona or community: returning early");
      return;
    }

    if (
      !["chat", "chats", "posts"].includes(context.params.roomCollectionName)
    ) {
      functions.logger.log("Not a chat or a post: returning early");
      return;
    }

    if (
      !["messages", "comments"].includes(context.params.commentCollectionName)
    ) {
      functions.logger.log("Not a comment or message: returning early");
      return;
    }

    functions.logger.log(
      `Making comment_endorsement event for ${context.params.entity}/${context.params.entityId}/${context.params.roomCollectionName}/${context.params.roomId}`,
    );

    const ref = change.after.ref;
    const beforeSnapshot = change.before.data();
    const entityType =
      context.params.entity === "communities" ? "community" : "persona";
    const roomType =
      context.params.roomCollectionName === "posts" ? "post" : "chat";
    const commentType =
      context.params.commentCollectionName === "comments"
        ? "comment"
        : "message";
    const isCommunityAllChat =
      context.params.roomId === "all" && entityType === "community";
    const isProjectAllChat =
      context.params.roomId === "all" && entityType === "persona";

    // Don't bother if endorsements didn't change
    if (_.isEqual(beforeSnapshot.endorsements, afterSnapshot.endorsements)) {
      return;
    }

    const getEndorsementsByUser = (endorsements) => {
      const endorsementsByUser = {};
      if (endorsements) {
        for (const endorsement in endorsements) {
          if ({}.hasOwnProperty.call(endorsements, endorsement)) {
            for (const uid of endorsements[endorsement]) {
              if (endorsementsByUser[uid]) {
                endorsementsByUser[uid].push(endorsement);
              } else {
                endorsementsByUser[uid] = [endorsement];
              }
            }
          }
        }
      }
      return endorsementsByUser;
    };

    const commentUserId = afterSnapshot.userID;
    const activityCollection = db
      .collection("users")
      .doc(commentUserId)
      .collection("activity");

    const afterEndorsementsByUser = getEndorsementsByUser(
      afterSnapshot.endorsements,
    );
    const beforeEndorsementsByUser = getEndorsementsByUser(
      beforeSnapshot.endorsements,
    );
    const allEndorsedUsers = new Set(
      Object.keys(afterEndorsementsByUser).concat(
        Object.keys(beforeEndorsementsByUser),
      ),
    );

    // Only create one event per user who endorsed regardless of # of
    // reactions the user makes to prevent too much noise. Show additional
    // reactions in event updates.

    for (const uid of allEndorsedUsers) {
      // No self-endorsements
      if (uid === commentUserId) {
        continue;
      }

      if (afterEndorsementsByUser[uid] && !beforeEndorsementsByUser[uid]) {
        // User added an endorsement for the first time - create an event
        const comment = await ref.get();
        const room = await ref.parent.parent.get();
        const entityDoc = await room.ref.parent.parent.get();
        //FIXME: Endorsements only give you an identity or createdByUser, not both
        const createdByUser = await db.collection("users").doc(uid).get();
        const identity = await db.collection("personas").doc(uid).get();
        const eventData = {
          comment_id: context.params.commentId,
          created_at: admin.firestore.Timestamp.now(),
          ref,
          event_type:
            commentType === "comment"
              ? "comment_endorsement"
              : "chat_endorsement",
          seen: false,
          deleted: false,
          createdByUserId: uid,
          isProjectAllChat,
          isCommunityAllChat,
          endorsements: afterEndorsementsByUser[uid],
          ...(createdByUser.exists && {
            createdByUser: {
              id: uid,
              data: getCreatedByUserCommonData(createdByUser),
              ref: createdByUser.ref,
            },
          }),
          [commentType]: {
            id: comment.id,
            data: {
              ...getCommentCommonData(comment),
            },
            ref,
          },
          [roomType]: {
            id: room.id,
            data: {
              ...(roomType === "post" && getPostCommonData(room)),
              ...(roomType === "chat" ||
                (roomType === "chats" && {
                  attendees: room.get("attendees") ?? null,
                })),
            },
            ref: room.ref,
          },
          [entityType]: {
            id: entityDoc.id,
            data: {
              ...getPersonaCommonData(entityDoc),
            },
            ref: entityDoc.ref,
          },
          ...(identity.exists && {
            isAnonymous: true,
            identity: {
              id: identity.id,
              name: identity.get("name"),
              profileImgUrl: identity.get("profileImgUrl") || "",
            },
          }),
        };

        const isCommentAuthorInRoom = await isUserInRoom({
          userID: commentUserId,
          roomPath: `${context.params.entity}/${context.params.entityId}/${context.params.roomCollectionName}/${context.params.roomId}`,
        });
        if (isCommentAuthorInRoom) {
          functions.logger.log("User is in room, skipping activity event");
          return;
        }

        functions.logger.log(
          `Creating comment_endorsement event for ${commentUserId}`,
          eventData,
        );
        return await newCreateActivityEvent({
          userID: commentUserId,
          eventData,
          entity: entityDoc,
          entityType,
          ...(roomType === "post" && { post: room }),
        });
      } else if (
        !afterEndorsementsByUser[uid] &&
        beforeEndorsementsByUser[uid]
      ) {
        // User removed all endorsements - mark event as deleted
        const existingActivitySnap = await activityCollection
          .where("ref", "==", ref)
          .where("createdByUserId", "==", uid)
          .where("event_type", "==", "comment_endorsement")
          .where("deleted", "==", false)
          .get();

        if (!existingActivitySnap.empty) {
          functions.logger.log(
            `Deleting comment_endorsement event for ${commentUserId}`,
            `comment ref: ${ref}`,
            `endorsed by user: ${uid}`,
          );
          return Promise.all(
            existingActivitySnap.docs.map(async (doc) => {
              await doc.ref.delete();
            }),
          );
        } else {
          functions.logger.error(
            "Attempted to delete a comment_endorsement activity event that did not exist",
            `comment ref: ${ref.path}`,
            `endorsed by user: ${uid}`,
          );
          return;
        }
      } else if (
        afterEndorsementsByUser[uid].length !==
        beforeEndorsementsByUser[uid].length
      ) {
        // User added or removed an endorsement but still has other
        // endorsements - update event with new endorsements
        const existingActivitySnap = await activityCollection
          .where("ref", "==", ref)
          .where("createdByUserId", "==", uid)
          .where("event_type", "==", "comment_endorsement")
          .where("deleted", "==", false)
          .get();

        if (!existingActivitySnap.empty) {
          functions.logger.log(
            `Updating comment_endorsement event for ${commentUserId}`,
            `comment ref: ${ref}`,
            `endorsed by user: ${uid}`,
            `endorsements: ${afterEndorsementsByUser[uid]}`,
          );
          return Promise.all(
            existingActivitySnap.docs.map(async (doc) => {
              await doc.ref.update({
                endorsements: afterEndorsementsByUser[uid],
              });
            }),
          );
        } else {
          functions.logger.error(
            "Attempted to access a comment_endorsement activity event that did not exist",
            `comment ref: ${ref.path}`,
            `endorsed by user: ${uid}`,
          );
          return;
        }
      }
    }
  });
