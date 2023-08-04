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

async function createOrUpdateActivityEventFromUpdateThreadCommentEndorsement(
  change,
  context,
) {
  const ref = change.after.ref;
  const beforeSnapshot = change.before.data();
  const afterSnapshot = change.after.data();

  const entityType = ref.path.includes("communities") ? "community" : "persona";
  const roomType = ref.path.includes("posts") ? "post" : "chat";
  const commentType = ref.path.includes("comments") ? "comment" : "message";
  const parentCommentType =
    commentType === "comment" ? "parentComment" : "parentMessage";
  const isCommunityAllChat =
    entityType === "community" &&
    roomType === "chat" &&
    ref.path.includes("all");
  const eventType =
    roomType === "post"
      ? "post_thread_comment_endorsement"
      : "chat_thread_message_endorsement";
  const isProjectAllChat =
    entityType === "persona" && roomType === "chat" && ref.path.includes("all");

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
      const parentComment = await ref.parent.parent.get();
      const room = await parentComment.ref.parent.parent.get();
      const entityDoc = await room.ref.parent.parent.get();
      //FIXME: Endorsements only give you an identity or createdByUser, not both
      const createdByUser = await db.collection("users").doc(uid).get();
      const identity = await db.collection("personas").doc(uid).get();
      const eventData = {
        comment_id: comment.id,
        created_at: admin.firestore.Timestamp.now(),
        ref,
        event_type: eventType,
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
        [parentCommentType]: {
          id: parentComment.id,
          data: {
            ...getCommentCommonData(parentComment),
          },
          ref: parentComment.ref,
        },
        [roomType]: {
          id: room.id,
          data: {
            ...(roomType === "post" && getPostCommonData(room)),
            ...(roomType === "chat" && {
              attendees: room.get("attendees") ?? null,
            }),
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

      const entityCollectionName =
        entityType === "community" ? "communities" : "personas";
      roomType === "post";
      // If it's not a post it's a chat and the collection names are different
      const roomCollectionName =
        roomType === "post"
          ? "posts"
          : entityType === "personas"
          ? "chats"
          : "chat";
      const roomPath = `${entityCollectionName}/${entityDoc.id}/${roomCollectionName}/${room.id}`;
      const isCommentAuthorInRoom = await isUserInRoom({
        userID: commentUserId,
        roomPath,
      });
      if (isCommentAuthorInRoom) {
        functions.logger.log("User is in room, skipping activity event");
        return;
      }

      functions.logger.log(
        `Creating ${eventData.event_type} event for ${commentUserId}`,
        eventData,
      );
      return await newCreateActivityEvent({
        userID: commentUserId,
        eventData,
        entity: entityDoc,
        entityType,
        ...(roomType === "post" && { post: room }),
      });
    } else if (!afterEndorsementsByUser[uid] && beforeEndorsementsByUser[uid]) {
      // User removed all endorsements - mark event as deleted

      const existingActivitySnap = await activityCollection
        .where("ref", "==", ref)
        .where("createdByUserId", "==", uid)
        .where("event_type", "==", eventType)
        .where("deleted", "==", false)
        .get();

      if (!existingActivitySnap.empty) {
        functions.logger.log(
          `Deleting ${eventType} event for ${commentUserId}`,
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
          `Attempted to delete a ${eventType} activity event that did not exist`,
          `comment/message ref: ${ref.path}`,
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
        .where("event_type", "==", eventType)
        .where("deleted", "==", false)
        .get();

      if (!existingActivitySnap.empty) {
        functions.logger.log(
          `Updating ${eventType} event for ${commentUserId}`,
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
          `Attempted to access a ${eventType} activity event that did not exist`,
          `comment ref: ${ref.path}`,
          `endorsed by user: ${uid}`,
        );
        return;
      }
    }
  }
}

exports.createActivityEventFromPersonaPostThreadCommentEndorsement =
  functions.firestore
    .document(
      "personas/{personaId}/posts/{postId}/comments/{parentCommentId}/threads/{commentId}",
    )
    .onUpdate(createOrUpdateActivityEventFromUpdateThreadCommentEndorsement);

exports.createActivityEventFromPersonaChatThreadCommentEndorsement =
  functions.firestore
    .document(
      "personas/{personaId}/chats/{chatId}/messages/{parentMessageId}/threads/{messageId}",
    )
    .onUpdate(createOrUpdateActivityEventFromUpdateThreadCommentEndorsement);

exports.createActivityEventFromCommunityPostThreadCommentEndorsement =
  functions.firestore
    .document(
      "communities/{communityId}/posts/{postId}/comments/{parentCommentId}/threads/{commentId}",
    )
    .onUpdate(createOrUpdateActivityEventFromUpdateThreadCommentEndorsement);

exports.createActivityEventFromCommunityChatThreadMessageEndorsement =
  functions.firestore
    .document(
      "communities/{communityId}/chat/{chatId}/messages/{parentMessageId}/threads/{messageId}",
    )
    .onUpdate(createOrUpdateActivityEventFromUpdateThreadCommentEndorsement);
