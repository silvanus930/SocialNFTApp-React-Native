const { admin, db, functions } = require("./admin");
const _ = require("lodash");

exports.updateFollowingCache = functions.firestore
  .document("users/{userId}/live/following")
  .onUpdate(async (change, context) => {
    const { userId } = context.params;
    try {
      const newUsersFollowing = change.after.get("profileFollow") || [];
      const oldUsersFollowing = change.before.get("profileFollow") || [];
      const usersToAdd = newUsersFollowing.filter(
        (p) => !oldUsersFollowing.includes(p)
      );
      const usersToRemove = oldUsersFollowing.filter(
        (p) => !newUsersFollowing.includes(p)
      );
      const updatedData = {};
      for (const personaId of usersToAdd) {
        updatedData[personaId] = admin.firestore.FieldValue.arrayUnion(userId);
      }
      for (const personaId of usersToRemove) {
        updatedData[personaId] = admin.firestore.FieldValue.arrayRemove(userId);
      }
      await db.collection("caching").doc("following").set(
        {
          usersByFollowed: updatedData,
        },
        { merge: true }
      );
    } catch (e) {
      functions.logger.error(
        "Failed to update following cache",
        change.after.ref.path
      );
    }
  });

exports.updatePersonaMemberOnCreate = functions.firestore
  .document("users/{userId}/live/homePersonaState")
  .onCreate(async (snap, context) => {
    const { userId } = context.params;

    let usersFollowed = [];
    let personasFollowed = [];
    for (const [key, after] of Object.entries(snap.data())) {
      const personaDoc = await db.collection("personas").doc(key).get();
      if (!personaDoc.exists) {
        functions.logger.warn(
          `${userId} requested to modify persona ${key}, which doesn't seem to exist`
        );
        continue;
      }
      let desireBeInCommunity;
      if (after["communityMember"] !== undefined) {
        desireBeInCommunity = after.communityMember;
      } else {
        desireBeInCommunity = false;
      }
      if (desireBeInCommunity) {
        usersFollowed = [
          ...new Set([...usersFollowed, ...personaDoc.get("authors")]),
        ];
        personasFollowed = [...new Set([...personasFollowed, key])];
      }
    }
    await db
      .collection("users")
      .doc(userId)
      .collection("live")
      .doc("following")
      .set(
        { users: usersFollowed, personas: personasFollowed },
        { merge: true }
      );
    functions.logger.log(
      `${userId} updating users followed ${usersFollowed} and personas followed ${personasFollowed}`
    );
  });

exports.updatePersonaMember = functions.firestore
  .document("users/{userId}/live/homePersonaState")
  .onUpdate(async (change, context) => {
    const { userId } = context.params;
    let usersFollowed = [];
    let personasFollowed = [];
    const homePersonaStateAfter = change.after.data();
    for (const [key, after] of Object.entries(homePersonaStateAfter)) {
      const personaDoc = await db.collection("personas").doc(key).get();
      if (!personaDoc.exists) {
        functions.logger.warn(
          `${userId} requested to modify persona ${key}, which doesn't seem to exist`
        );
        continue;
      }
      let desireBeInCommunity;
      if (after["communityMember"] !== undefined) {
        desireBeInCommunity = after.communityMember;
      } else {
        desireBeInCommunity = false;
      }
      if (desireBeInCommunity) {
        usersFollowed = [
          ...new Set([...usersFollowed, ...personaDoc.get("authors")]),
        ];
        personasFollowed = [...new Set([...personasFollowed, key])];
      }
    }
    await db
      .collection("users")
      .doc(userId)
      .collection("live")
      .doc("following")
      .set(
        { users: usersFollowed, personas: personasFollowed },
        { merge: true }
      );
    functions.logger.log(
      `${userId} updating users followed ${usersFollowed} and personas followed ${personasFollowed}`
    );
  });

exports.cachePersonaStatsOnPersonaCreate = functions.firestore
  .document("personas/{personaId}")
  .onCreate(async (snapshot, context) => {
    const personaId = context.params.personaId;
    await db
      .collection("personaCaching")
      .doc(personaId)
      .set({
        authors: snapshot.get("authors") || [],
        communityMembers: snapshot.get("communityMembers") || [],
      });
  });

exports.cachePersonaStatsOnPersonaUpdate = functions.firestore
  .document("personas/{personaId}")
  .onUpdate(async (change, context) => {
    const afterAuthors = change.after.get("authors") || [];
    const beforeAuthors = change.before.get("authors") || [];
    const afterCommunity = change.after.get("communityMembers") || [];
    const beforeCommunity = change.before.get("communityMembers") || [];
    const personaId = context.params.personaId;
    if (
      !_.isEqual(afterAuthors, beforeAuthors) ||
      !_.isEqual(afterCommunity, beforeCommunity)
    ) {
      await db.collection("personaCaching").doc(personaId).set(
        {
          authors: afterAuthors,
          communityMembers: afterCommunity,
        },
        { merge: true }
      );
    }
  });

exports.cachePersonaStatsOnPostCreate = functions.firestore
  .document("personas/{personaId}/posts/{postId}")
  .onCreate(async (snapshot, context) => {
    const personaId = context.params.personaId;
    await db
      .collection("personaCaching")
      .doc(personaId)
      .set(
        {
          latestPostPublishDate:
            snapshot.get("publishDate") ||
            admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  });

exports.cachePersonaStatsOnPostUpdate = functions.firestore
  .document("personas/{personaId}/posts/{postId}")
  .onUpdate(async (change, context) => {
    const personaId = context.params.personaId;
    let afterEditTime = change.after.get("editDate");
    if (afterEditTime !== undefined && afterEditTime.seconds !== undefined) {
      afterEditTime = afterEditTime.seconds;
    }
    let beforeEditTime = change.before.get("editDate");
    if (beforeEditTime !== undefined && beforeEditTime.seconds !== undefined) {
      beforeEditTime = beforeEditTime.seconds;
    }
    if (afterEditTime !== beforeEditTime) {
      await db
        .collection("personaCaching")
        .doc(personaId)
        .set(
          {
            latestPostEditDate: change.after.get("editDate"),
          },
          { merge: true }
        );
    }
  });

// const SYSTEM_DM_PERSONA_ID = 'NKDmMFWHDIRP4IMjOw5y';

exports.cacheLatestChatOnMessageCreate = functions.firestore
  .document("personas/NKDmMFWHDIRP4IMjOw5y/chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const { chatId } = context.params;
    const chat = await snapshot.ref.parent.parent.get();
    const involved = (chat.get("attendees") || []).map(
      (attendee) => attendee.id
    );
    const chatCachingDocRef = db.collection("draftchatCaching").doc(chatId);
    const newChatCachingData = {
      chatId,
      involved,
      type: "chat",
      latestMessage: {
        timestamp: snapshot.get("timestamp") || admin.firestore.Timestamp.now(),
        data: snapshot.data(),
        id: snapshot.id,
      },
    };
    await db.runTransaction((transaction) => {
      return transaction.get(chatCachingDocRef).then((chatCachingDoc) => {
        if (chatCachingDoc.exists) {
          const existingTimestamp = chatCachingDoc.get(
            "latestMessage.timestamp"
          );
          if (
            existingTimestamp.seconds <
            newChatCachingData.latestMessage.timestamp.seconds
          ) {
            transaction.set(chatCachingDocRef, newChatCachingData);
            functions.logger.log(
              `Updating message cache for ${chatCachingDocRef.path} from ${snapshot.ref.path}`
            );
          } else {
            functions.logger.log(
              `Skip updating message cache, not latest, for ${chatCachingDocRef.path} from ${snapshot.ref.path}`
            );
          }
        } else {
          transaction.set(chatCachingDocRef, newChatCachingData);
          functions.logger.log(
            `Updating message cache for ${chatCachingDocRef.path} from ${snapshot.ref.path}`
          );
        }
      });
    });
  });

exports.cacheLatestChatOnMessageUpdate = functions.firestore
  .document("personas/NKDmMFWHDIRP4IMjOw5y/chats/{chatId}/messages/{messageId}")
  .onUpdate(async (change, context) => {
    const { chatId, messageId } = context.params;
    const snapshot = change.after;
    const chat = await snapshot.ref.parent.parent.get();
    const involved = (chat.get("attendees") || []).map(
      (attendee) => attendee.id
    );

    if (messageId === "LastSeen") {
      return;
    }

    const chatCachingDocRef = db.collection("draftchatCaching").doc(chatId);
    const newChatCachingData = {
      chatId,
      involved,
      type: "chat",
      latestMessage: {
        timestamp: snapshot.get("timestamp") || admin.firestore.Timestamp.now(),
        data: snapshot.data(),
        id: snapshot.id,
      },
    };

    const newSeen = newChatCachingData?.latestMessage?.data?.seen || {};
    const newSeenKeys = Object.keys(newSeen);

    // todo - deleted edge case
    await db.runTransaction((transaction) => {
      return transaction.get(chatCachingDocRef).then((chatCachingDoc) => {
        if (chatCachingDoc.exists) {
          const prevSeen = chatCachingDoc.get("latestMessage.data.seen") || {};
          const prevSeenKeys = Object.keys(prevSeen);

          const seenHasChanged =
            JSON.stringify(newSeenKeys.sort()) !==
            JSON.stringify(prevSeenKeys.sort());

          const existingTimestamp = chatCachingDoc.get(
            "latestMessage.timestamp"
          );
          if (
            existingTimestamp.seconds <
              newChatCachingData.latestMessage.timestamp.seconds ||
            (seenHasChanged &&
              snapshot?.id === chatCachingDoc?.get("latestMessage.id"))
          ) {
            transaction.set(chatCachingDocRef, newChatCachingData);
            functions.logger.log(
              `Updating message cache for ${chatCachingDocRef.path} from ${snapshot.ref.path}`
            );
          } else {
            functions.logger.log(
              `Skip updating message cache, not latest, for ${chatCachingDocRef.path} from ${snapshot.ref.path}`
            );
          }
        } else {
          transaction.set(chatCachingDocRef, newChatCachingData);
          functions.logger.log(
            `Updating message cache for ${chatCachingDocRef.path} from ${snapshot.ref.path}`
          );
        }
      });
    });
  });

exports.cacheDraftCreate = functions.firestore
  .document("drafts/{draftID}")
  .onCreate(async (draftSnapshot, context) => {
    const { draftID } = context.params;
    const involved = draftSnapshot.get("authors") || [];
    const draftCachingDocRef = db.collection("draftchatCaching").doc(draftID);
    const newDraftCachingData = {
      draftID,
      involved,
      type: "draft",
      ...draftSnapshot.data(),
    };

    await draftCachingDocRef.set(newDraftCachingData);
  });

exports.cacheDraftUpdate = functions.firestore
  .document("drafts/{draftID}")
  .onUpdate(async (change, context) => {
    const { draftID } = context.params;
    const draft = change.after;
    const involved = draft.get("authors") || [];
    const draftCachingDocRef = db.collection("draftchatCaching").doc(draftID);
    const newDraftCachingData = {
      draftID,
      involved,
      type: "draft",
      ...draft.data(),
    };

    await draftCachingDocRef.set(newDraftCachingData);
  });
