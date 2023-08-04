const { db, admin, functions } = require("./admin");
const { createActivityEvent } = require("./activity/helpers");
const _ = require("lodash");
const { firestore } = require("firebase-admin");
const {
  createPushNotificationFromActivityEventRef,
} = require("./activity/createPushNotificationFromActivityEvent");

// FIXME: Create constants file that all of Persona can use.
// These constants are duplicated.
const POST_TYPE_ARTIST = "artist";
const SYSTEM_DM_PERSONA_ID = "NKDmMFWHDIRP4IMjOw5y";
const STAFF_USERS = {
  will: "94hKmQP9DEhZICfZEebFq5rl8VZ2",
  raeez: "PHobeplJLROyFlWhXPINseFVkK32",
  kafischer: "3Ednpc8IKwgweGdoyhY8M8WeOJj2",
};
const MONITORING_USERS = {
  willmonitor: "TGQsid3LzQbHTts4IaNuKT4J31v2",
};
const DEV_USERS = {
  willdev: "zGYZvbB1HxcZH5rb6C4fymRc0yp2",
};
const PERSONAS_PERSONAS = [
  "W0Ar0PQgV56ECc03dgZa", // Persona
  "nQ3LnKHFIHvWD8wZIsHj", // Studio
  "i4T4evv2YWkaTtyj2pHJ", // Presence
  "0AcRALqCNA4FQrn8tCER", // Home
  "gWDEpBb76tgp3Pb5VNW7", // Visual Patterns
  "OCtMKlmXA6zHiXyFnrLd", // Feed
];

/** *********************************************
 *                                              *
 *                  HELPERS                     *
 *                                              *
 * **********************************************/

/**
 * Truncates a string
 * @param {string} str The string to truncate
 * @param {object} options Set maximum length to truncate and whether or not
 * to truncate on a word boundary.
 * @return {string} Truncated string
 */
function truncate(str, options = { maxLength: 60, useWordBoundary: true }) {
  const { maxLength, useWordBoundary } = options;
  if (str.length <= maxLength) {
    return str;
  }
  const subString = str.substr(0, maxLength - 1); // the original check
  return (
    (useWordBoundary
      ? subString.substr(0, subString.lastIndexOf(" "))
      : subString) + "…"
  );
}

/**
 * Mark activity entries deleted that reference a given object
 * @param {admin.firestore.DocumentReference} document
 * @return {Promise<void>}
 */
async function markActivityEntriesDeleted(document) {
  const activitySnap = await db
    .collectionGroup("activity")
    .where("ref", "==", document.ref)
    .get();
  await Promise.all(
    activitySnap.docs.map(async (doc) => {
      functions.logger.log(
        "Update activity status",
        document.ref.path,
        doc.ref.path,
      );
      await doc.ref.set(
        {
          deleted: document.get("deleted") || false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }),
  );
}

const getPersonaCommonData = (persona) => {
  return {
    id: persona.id,
    name: persona.get("name"),
    profileImgUrl: persona.get("profileImgUrl") || "",
    communityID: persona.get("communityID") || "",
  };
};

const getCreatedByUserCommonData = (createdByUser) => {
  return {
    id: createdByUser.id,
    userName: createdByUser.get("userName"),
    profileImgUrl: createdByUser.get("profileImgUrl") || "",
  };
};

const getPostCommonData = (post) => {
  const remixPersonaID = post.get("remixPersonaID");
  const remixPostID = post.get("remixPostID");
  return {
    id: post.id,
    title: post.get("title"),
    ...(remixPersonaID &&
      remixPostID && {
        remixPersonaID,
        remixPostID,
      }),
  };
};

const getPostPreviewData = (post) => {
  return {
    id: post.id,
    type: post.get("type"),
    mediaType: post.get("mediaType"),
    mediaUrl: post.get("mediaUrl"),
    galleryUris: post.get("galleryUris"),
    text: post.get("text"),
    userID: post.get("userID"),
    published: post.get("published") || false,
    ...(post.get("subPersonaID") && { subPersonaID: post.get("subPersonaID") }),
    ...(post.get("subpersona") && { subpersona: post.get("subpersona") }),
  };
};

const getMessageCommonData = (message) => {
  return {
    id: message.id,
    userID: message.get("userID"),
    isThread: message.get("isThread") || false,
    text: message.get("text") || "",
    mediaUrl: message.get("mediaUrl") || "",
  };
};

const getIdentity = async (identityID) => {
  const identityPersona = await db.collection("personas").doc(identityID).get();
  if (identityPersona.exists) {
    return {
      id: identityID,
      name: identityPersona.get("name") || "",
      profileImgUrl: identityPersona.get("profileImgUrl") || "",
    };
  } else {
    return null;
  }
};

/** *********************************************
 *                                              *
 *               INVITES                        *
 *                                              *
 * **********************************************/

exports.createOrUpdateActivityEventFromAuthorInvite = functions.firestore
  .document("personas/{personaID}")
  .onUpdate(async (change, context) => {
    const personaID = context.params.personaID;
    const invitedUsersBefore = Object.keys(
      change.before.get("invitedUsers") || {},
    );
    const invitedUsersAfter = Object.keys(
      change.after.get("invitedUsers") || {},
    );
    const deletedInvitedUsers = invitedUsersBefore.filter(
      (id) => !invitedUsersAfter.includes(id),
    );

    for (const memberId of deletedInvitedUsers) {
      const activitySnap = await db
        .collection("users")
        .doc(memberId)
        .collection("activity")
        .where("event_type", "==", "authorInvitation")
        .where("persona.id", "==", personaID)
        .get();
      await Promise.all(
        activitySnap.docs.map(async (doc) => {
          functions.logger.log(
            "Update activity status, delete author invite",
            doc.ref.path,
          );
          await doc.ref.set(
            {
              deleted: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }),
      );
    }

    const addedInvitedUsers = invitedUsersAfter.filter(
      (id) => !invitedUsersBefore.includes(id),
    );

    for (const memberId of addedInvitedUsers) {
      const inviterId = change.after.get("invitedUsers")[memberId].inviter;
      const createdByUser = await db.collection("users").doc(inviterId).get();

      const eventData = {
        created_at: admin.firestore.Timestamp.now(),
        event_type: "authorInvitation",
        personaRef: change.after.ref,
        persona: {
          id: change.after.id,
          data: change.after.data(),
          ref: change.after.ref,
        },
        createdByUser: {
          id: createdByUser.id,
          data: createdByUser.data(),
          ref: createdByUser.ref,
        },
        seen: false,
        deleted: false,
      };
      const newEventRef = await db
        .collection("users")
        .doc(memberId)
        .collection("activity")
        .add(eventData);
      functions.logger.log(
        "Update activity status, add author invite",
        newEventRef.path,
      );
    }
  });

exports.updateActivityEventFromInvitation = functions.firestore
  .document("personas/{personaID}")
  .onUpdate(async (change, context) => {
    const personaID = context.params.personaID;
    const invitedUsersBefore = Object.keys(
      change.before.get("invitedUsers") || {},
    );
    const invitedUsersAfter = Object.keys(
      change.after.get("invitedUsers") || {},
    );
    const deletedInvitedUsers = invitedUsersBefore.filter(
      (id) => !invitedUsersAfter.includes(id),
    );

    for (const memberId of deletedInvitedUsers) {
      const activitySnap = await db
        .collection("users")
        .doc(memberId)
        .collection("activity")
        .where("event_type", "==", "invitation")
        .where("persona.id", "==", personaID)
        .get();
      await Promise.all(
        activitySnap.docs.map(async (doc) => {
          functions.logger.log(
            "Update activity status, delete author invite",
            doc.ref.path,
          );
          await doc.ref.set(
            {
              deleted: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }),
      );
    }
  });

exports.createOrUpdateActivityEventFromCommunityInvite = functions.firestore
  .document("personas/{personaID}")
  .onUpdate(async (change, context) => {
    const personaID = context.params.personaID;
    const invitedUsersBefore = Object.keys(
      change.before.get("invitedCommunityMembers") || {},
    );
    const invitedUsersAfter = Object.keys(
      change.after.get("invitedCommunityMembers") || {},
    );
    const deletedInvitedUsers = invitedUsersBefore.filter(
      (id) => !invitedUsersAfter.includes(id),
    );

    for (const memberId of deletedInvitedUsers) {
      const activitySnap = await db
        .collection("users")
        .doc(memberId)
        .collection("activity")
        .where("event_type", "==", "communityInvitation")
        .where("persona.id", "==", personaID)
        .get();
      await Promise.all(
        activitySnap.docs.map(async (doc) => {
          functions.logger.log(
            "Update activity status, delete community invite",
            doc.ref.path,
          );
          await doc.ref.set(
            {
              deleted: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }),
      );
    }

    const addedInvitedUsers = invitedUsersAfter.filter(
      (id) => !invitedUsersBefore.includes(id),
    );

    for (const memberId of addedInvitedUsers) {
      const inviterId = change.after.get("invitedCommunityMembers")[memberId]
        .inviter;
      const createdByUser = await db.collection("users").doc(inviterId).get();

      const eventData = {
        created_at: admin.firestore.Timestamp.now(),
        event_type: "communityInvitation",
        personaRef: change.after.ref,
        persona: {
          id: change.after.id,
          data: change.after.data(),
          ref: change.after.ref,
        },
        createdByUser: {
          id: createdByUser.id,
          data: createdByUser.data(),
          ref: createdByUser.ref,
        },
        seen: false,
        deleted: false,
      };
      const newEventRef = await db
        .collection("users")
        .doc(memberId)
        .collection("activity")
        .add(eventData);
      functions.logger.log(
        "Update activity status, add community invite",
        newEventRef.path,
      );
    }
  });

exports.createActivityEventFromAuthorChange = functions.firestore
  .document("personas/{personaID}")
  .onUpdate(async (change, context) => {
    const authorsBefore = change.before.get("authors") || [];
    const authorsAfter = change.after.get("authors") || [];

    const addedAuthors = authorsAfter.filter(
      (id) => !authorsBefore.includes(id),
    );

    for (const authorId of addedAuthors) {
      const author = await db.collection("users").doc(authorId).get();

      const eventData = {
        created_at: admin.firestore.Timestamp.now(),
        event_type: "authorChange",
        personaRef: change.after.ref,
        persona: {
          id: change.after.id,
          data: change.after.data(),
          ref: change.after.ref,
        },
        author: {
          id: author.id,
          data: author.data(),
          ref: author.ref,
        },
        isAuthor: true,
        seen: false,
        deleted: false,
      };
      const authors = change.after.get("authors") || [];
      for (const id of authors.filter((aid) => aid !== authorId)) {
        const newEventRef = await db
          .collection("users")
          .doc(id)
          .collection("activity")
          .add(eventData);
        functions.logger.log(
          "Update activity status, author change event",
          newEventRef.path,
        );
      }
    }
  });

exports.createActivityEventFromCommunityChange = functions.firestore
  .document("personas/{personaID}")
  .onUpdate(async (change, context) => {
    const communityMembersBefore = change.before.get("communityMembers") || [];
    const communityMembersAfter = change.after.get("communityMembers") || [];

    const addedInvitedUsers = communityMembersAfter.filter(
      (id) => !communityMembersBefore.includes(id),
    );

    const authors = change.after.get("authors") || [];

    for (const memberId of addedInvitedUsers) {
      const member = await db.collection("users").doc(memberId).get();

      const eventData = {
        created_at: admin.firestore.Timestamp.now(),
        event_type: "communityChange",
        personaRef: change.after.ref,
        persona: {
          id: change.after.id,
          data: change.after.data(),
          ref: change.after.ref,
        },
        member: {
          id: member.id,
          data: member.data(),
          ref: member.ref,
        },
        inCommunity: addedInvitedUsers.includes(memberId),
        seen: false,
        deleted: false,
      };
      for (const id of authors.filter((aid) => aid !== memberId)) {
        const newEventRef = await db
          .collection("users")
          .doc(id)
          .collection("activity")
          .add(eventData);
        functions.logger.log(
          "Update activity status, community change event",
          newEventRef.path,
        );
      }
    }
  });

/** *********************************************
 *                                              *
 *               POST COMMENTS                  *
 *                                              *
 * **********************************************/

// TODO: Consolidate this logic with object updates
exports.updateActivityEventFromComment = functions
  .runWith({ minInstances: 1 })
  .firestore.document(
    "personas/{personaId}/posts/{postId}/comments/{commentId}",
  )
  .onUpdate(async (change, context) => {
    await markActivityEntriesDeleted(change.after);
  });

// TODO: Consolidate this logic with object updates
exports.updateActivityEventFromCommentThread = functions.firestore
  .document(
    "personas/{personaId}/posts/{postId}/comments/{parentCommentId}/threads/{commentId}",
  )
  .onUpdate(async (change, context) => {
    await markActivityEntriesDeleted(change.after);
  });

/** *********************************************
 *                                              *
 *               POST ENDORSEMENTS              *
 *                                              *
 * **********************************************/

exports.newCreateActivityEventFromCreatePostEndorsement = functions.firestore
  .document("personas/{personaId}/posts/{postId}/live/endorsements")
  .onCreate(async (snapshot, context) => {
    const ref = snapshot.ref;

    // TODO: Check if endorsements field exists

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

    const post = await ref.parent.parent.get();
    const postUserID = post.get("userID");

    const endorsementsByUser = getEndorsementsByUser(
      snapshot.get("endorsements"),
    );
    const endorsedUserID = Object.keys(endorsementsByUser)[0];

    // No self-endorsements
    if (endorsedUserID === postUserID) {
      return;
    }

    const persona = await post.ref.parent.parent.get();
    const usersToNotifySet = new Set(persona.get("authors"));
    Object.values(MONITORING_USERS).forEach((uid) => usersToNotifySet.add(uid));
    usersToNotifySet.delete(endorsedUserID);
    const usersToNotify = [...usersToNotifySet];

    const createdByUser = await db
      .collection("users")
      .doc(endorsedUserID)
      .get();

    let identity = null;
    if (!createdByUser.exists) {
      identity = await db.collection("personas").doc(endorsedUserID).get();
    }

    const doesIdentityExist = identity !== null && identity.exists;

    if (!createdByUser.exists && !doesIdentityExist) {
      throw new Error(
        `Expected createdByUser or identity but didn't get either. Post ID: ${post.id}`,
      );
    }

    const eventData = {
      created_at: admin.firestore.Timestamp.now(),
      ref,
      event_type: "post_endorsement",
      seen: false,
      deleted: false,
      endorsements: endorsementsByUser[endorsedUserID],
      createdByUserId: endorsedUserID,
      ...(createdByUser.exists && {
        createdByUser: {
          id: createdByUser.id,
          data: {
            ...getCreatedByUserCommonData(createdByUser),
          },
          ref: createdByUser.ref,
        },
      }),
      post: {
        id: post.id,
        data: {
          ...getPostCommonData(post),
          ...getPostPreviewData(post),
        },
        ref: post.ref,
      },
      persona: {
        id: persona.id,
        data: {
          ...getPersonaCommonData(persona),
        },
        ref: persona.ref,
      },
      ...(identity &&
        identity.exists && {
          isAnonymous: true,
          identity: {
            id: identity.id,
            name: identity.get("name") || "",
            profileImgUrl: identity.get("profileImgUrl") || "",
          },
        }),
    };

    await Promise.all(
      usersToNotify.map(async (userID) => {
        functions.logger.log(
          `Creating post_endorsement event for ${userID}`,
          post.id,
        );
        return await createActivityEvent({
          userID,
          eventData,
          persona,
          post,
        });
      }),
    );
  });

exports.newCreateOrUpdateActivityEventFromUpdatePostEndorsement =
  functions.firestore
    .document("personas/{personaId}/posts/{postId}/live/endorsements")
    .onUpdate(async (change, context) => {
      const ref = change.after.ref;
      const beforeSnapshot = change.before.data();
      const afterSnapshot = change.after.data();
      const isDeleted = afterSnapshot.deleted;

      // Don't bother if endorsements didn't change
      if ((_.isEqual(beforeSnapshot.endorsements, afterSnapshot.endorsements)) && !isDeleted) {
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

      const post = await ref.parent.parent.get();
      const postUserID = post.get("userID");

      const activityCollection = db
        .collection("users")
        .doc(postUserID)
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

      functions.logger.log(`changed result! all: ${allEndorsedUsers}, before: ${afterEndorsementsByUser}, after: ${beforeEndorsementsByUser}`, );

      // Only create one event per user who endorsed regardless of # of
      // reactions the user makes to prevent too much noise. Show additional
      // reactions in event updates.

      for (const uid of allEndorsedUsers) {
        // No self-endorsements
        if (uid === postUserID) {
          continue;
        }

        functions.logger.log(`changed result! uid: ${uid}, before: ${afterEndorsementsByUser[uid]}, after: ${beforeEndorsementsByUser[uid]}`, );

        if (afterEndorsementsByUser[uid] && !beforeEndorsementsByUser[uid]) {
          // User added an endorsement for the first time - create an event
          const persona = await post.ref.parent.parent.get();
          const createdByUser = await db.collection("users").doc(uid).get();

          let identity = null;
          if (!createdByUser.exists) {
            identity = await db.collection("personas").doc(uid).get();
          }

          const doesIdentityExist = identity !== null && identity.exists;

          if (!createdByUser.exists && !doesIdentityExist) {
            throw new Error(
              `Expected createdByUser or identity but didn't get either. Post ID: ${post.id}`,
            );
          }

          const eventData = {
            created_at: admin.firestore.Timestamp.now(),
            ref,
            event_type: "post_endorsement",
            seen: false,
            deleted: false,
            createdByUserId: uid,
            endorsements: afterEndorsementsByUser[uid],
            ...(createdByUser.exists && {
              createdByUser: {
                id: createdByUser.id,
                data: {
                  ...getCreatedByUserCommonData(createdByUser),
                },
                ref: createdByUser.ref,
              },
            }),
            post: {
              id: post.id,
              data: {
                ...getPostCommonData(post),
                ...getPostPreviewData(post),
              },
              ref: post.ref,
            },
            persona: {
              id: persona.id,
              data: {
                ...getPersonaCommonData(persona),
              },
              ref: persona.ref,
            },
            ...(identity &&
              identity.exists && {
                isAnonymous: true,
                identity: {
                  id: identity.id,
                  name: identity.get("name") || "",
                  profileImgUrl: identity.get("profileImgUrl") || "",
                },
              }),
          };

          functions.logger.log(
            `Creating post_endorsement event for ${postUserID}`,
            eventData,
          );

          return activityCollection.add(eventData);
        } else if (
          (!afterEndorsementsByUser[uid] &&
          beforeEndorsementsByUser[uid]) || isDeleted
        ) {
          // User removed all endorsements - mark event as deleted
          const existingActivitySnap = await activityCollection
            .where("ref", "==", ref)
            .where("createdByUserId", "==", uid)
            .where("event_type", "==", "post_endorsement")
            .where("deleted", "==", false)
            .get();

          if (!existingActivitySnap.empty) {
            functions.logger.log(
              `Deleting post_endorsement event for ${postUserID}`,
              `comment ref: ${ref.path}`,
              `endorsed by user/identity: ${uid}`,
            );
            return Promise.all(
              existingActivitySnap.docs.map(async (doc) => {
                await doc.ref.delete();
              }),
            );
          } else {
            functions.logger.error(
              "Attempted to access a post_endorsement activity event that did not exist while trying to delete event",
              `ref: ${ref.path}`,
              `endorsed by user/identity: ${uid}`,
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
            .where("event_type", "==", "post_endorsement")
            .where("deleted", "==", false)
            .get();

          if (!existingActivitySnap.empty) {
            functions.logger.log(
              `Updating post_endorsement event for ${postUserID}`,
              `ref: ${ref.path}`,
              `endorsed by user/identity: ${uid}`,
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
              "Attempted to access a post_endorsement activity event that did not exist while trying to update event",
              `ref: ${ref.path}`,
              `endorsed by user/identity: ${uid}`,
            );
            return;
          }
        }
      }
    });

/** *********************************************
 *                                              *
 *               COLLABS                        *
 *                                              *
 * **********************************************/

exports.createActivityEventFromRemix = functions.firestore
  .document("personas/{personaId}/posts/{postId}")
  .onCreate(async (targetPost, context) => {
    // The rule: Only send a remix notification when you can see the remixed post.
    // It's effectively a special new_post notification

    // Source: The post being remixed
    // Target: The new post resulting from the remix

    //FIXME: Distinguish between post and comment remixes once the data is there
    //FIXME: Handle DM remix notifications

    const isRemix =
      targetPost.get("remixPersonaID") && targetPost.get("remixPostID");
    const isSamePersona =
      targetPost.get("remixPersonaID") === targetPost.get("personaID");
    const isSourcePersonaDM =
      targetPost.get("remixPersonaID") === SYSTEM_DM_PERSONA_ID;

    // We send a new_post notification for the target persona so if the persona
    // is private or the post is unpublished any mutual coauthors / followers
    // will still get a notification about the post.
    if (
      !isRemix ||
      isSamePersona ||
      !targetPost.get("published") ||
      isSourcePersonaDM
    ) {
      return;
    }

    const ref = targetPost.ref;
    const targetPersona = await ref.parent.parent.get();

    if (targetPersona.get("private")) {
      functions.logger.log("Returning early: private");
      return;
    }

    // createdByUser - creator of original post = person who did the remix

    const createdByUserID = targetPost.get("userID");
    const sourcePersona = await db
      .collection("personas")
      .doc(targetPost.get("remixPersonaID"))
      .get();
    const sourcePost = await sourcePersona.ref
      .collection("posts")
      .doc(targetPost.get("remixPostID"))
      .get();
    const sourcePostUserID = sourcePost.get("userID");

    const createdByUser = await db
      .collection("users")
      .doc(createdByUserID)
      .get();

    const isAnonymous = !!targetPost.get("anonymous");

    let targetIdentity = null;
    const targetIdentityID = targetPost.get("identityID");
    if (targetIdentityID) {
      targetIdentity = await getIdentity(targetIdentityID);
    }

    let sourceIdentity = null;
    const sourceIdentityID = sourcePost.get("identityID");
    if (sourceIdentityID) {
      sourceIdentity = await getIdentity(sourceIdentityID);
    }

    const eventData = {
      created_at: targetPost.get("publishDate"),
      ref,
      event_type: "post_remix",
      seen: false,
      deleted: targetPost.get("deleted") || false,
      isAnonymous,
      sourcePostUserID,
      remixSourcePersona: {
        id: sourcePersona.id,
        data: {
          ...getPersonaCommonData(sourcePersona),
        },
        ref: sourcePersona.ref,
      },
      remixSourcePost: {
        id: sourcePost.id,
        data: {
          ...getPostCommonData(sourcePost),
        },
        ref: sourcePost.ref,
      },
      ...(sourceIdentity !== null && {
        remixSourceIdentity: {
          ...sourceIdentity,
        },
      }),
      // The newly created post: fetching this data so we can show a preview
      post: {
        id: targetPost.id,
        data: {
          ...getPostCommonData(targetPost),
          ...getPostPreviewData(targetPost),
        },
        ref: targetPost.ref,
      },
      persona: {
        id: targetPersona.id,
        data: {
          ...getPersonaCommonData(targetPersona),
        },
        ref: targetPersona.ref,
      },
      createdByUser: {
        id: createdByUser.id,
        data: {
          ...getCreatedByUserCommonData(createdByUser),
        },
        ref: createdByUser.ref,
      },
      ...(targetIdentity !== null && {
        identity: {
          ...targetIdentity,
        },
      }),
    };

    // Notify coauthors, persona followers, post creator user followers
    // commenters, users who reacted to the post - as long as they can see
    // the target content
    const authors = sourcePersona.get("authors") || [];
    let usersToNotify = authors;
    if (sourcePost.get("published")) {
      // Persona followers
      const communityMembers = sourcePersona.get("communityMembers") || [];
      usersToNotify = usersToNotify.concat(communityMembers);

      if (!sourcePersona.get("private")) {
        // Users who commented
        const postComments = await sourcePost.ref.collection("comments").get();
        if (postComments.size) {
          const commentUserIDs =
            postComments.docs.map((doc) => doc.get("userID")) || [];
          usersToNotify = usersToNotify.concat(commentUserIDs);
        }

        // Users who reacted
        const postReactions = await sourcePost.ref
          .collection("live")
          .doc("endorsements")
          .get();
        if (postReactions.exists) {
          const postReactionUserIDs = Object.values(
            postReactions.get("endorsements") || [],
          ).flat();
          usersToNotify = usersToNotify.concat(postReactionUserIDs);
        }

        const isUnattributedAnonymous =
          sourcePost.get("anonymous") && !!sourcePersona.get("anonymous");
        if (!isUnattributedAnonymous) {
          const postCreatorUserFollowersDoc = await db
            .collection("users")
            .doc(sourcePostUserID)
            .collection("live")
            .doc("followers")
            .get();
          if (postCreatorUserFollowersDoc.exists) {
            const postCreatorUserFollowerIDs =
              postCreatorUserFollowersDoc.get("profileFollow") || [];
            usersToNotify = usersToNotify.concat(postCreatorUserFollowerIDs);
          }
        }
      }
    }

    // Dedupe users to notify
    const usersToNotifySet = new Set(usersToNotify);
    usersToNotifySet.delete(createdByUserID);

    // Favor new_post events over post_remix events.
    // Remove any users who might get a new_post notification by being a
    // coauthor on the target persona, a persona follower or a user follower
    // of the createdByUser.
    let usersToRemove = []
      .concat(targetPersona.get("authors") || [])
      .concat(targetPersona.get("communityMembers") || []);

    const isTargetPostUnattributedAnonymous =
      isAnonymous && targetPersona.get("anonymous");

    // If the target post is unattributed anonymous then we don't notify
    // any of the createdByUser's followers. In that case we don't want to
    // accidentally remove them from the remix just because they're following.
    if (!isTargetPostUnattributedAnonymous) {
      const createdByUserFollowersDoc = await createdByUser.ref
        .collection("live")
        .doc("followers")
        .get();

      if (createdByUserFollowersDoc.exists) {
        usersToRemove = usersToRemove.concat(
          createdByUserFollowersDoc.get("profileFollow") || [],
        );
      }
    }

    const usersToRemoveSet = new Set(usersToRemove);
    usersToRemoveSet.forEach((userID) => {
      usersToNotifySet.delete(userID);
    });

    functions.logger.log("Notifying users: ", usersToNotifySet);
    await Promise.all(
      Array.from(usersToNotifySet).map(async (userID) => {
        const activityCollection = db
          .collection("users")
          .doc(userID)
          .collection("activity");
        const existingActivitySnap = await activityCollection
          .where("ref", "==", ref)
          .where("event_type", "==", "post_remix")
          .get();
        if (existingActivitySnap.empty) {
          const createdRef = await db
            .collection("users")
            .doc(userID)
            .collection("activity")
            .add(eventData);
          functions.logger.log(
            `Creating post_remix event for ${userID}`,
            ref.path,
            createdRef.path,
          );
        } else {
          functions.logger.error(
            `Error creating post_remix event for ${userID}`,
            ref.path,
            "Already existing activity events",
            existingActivitySnap.docs.map((d) => d.ref.path),
          );
        }
      }),
    );
  });

/** *********************************************
 *                                              *
 *               CHAT                           *
 *                                              *
 * **********************************************/

exports.updateActivityEventFromCommunityChat = functions.firestore
  .document("communities/{communityId}/chat/{chatId}/messages/{messageId}")
  .onUpdate(async (change, context) => {
    await markActivityEntriesDeleted(change.after);
  });

exports.updateActivityEventFromChat = functions
  .runWith({ minInstances: 1 })
  .firestore.document(
    "personas/{personaId}/chats/{chatId}/messages/{messageId}",
  )
  .onUpdate(async (change, context) => {
    await markActivityEntriesDeleted(change.after);
  });

exports.createActivityEventFromChatThread = functions.firestore
  .document(
    "personas/{personaId}/chats/{chatId}/messages/{messageId}/threads/{threadMessageId}",
  )
  .onCreate(async (snapshot, context) => {
    const ref = snapshot.ref;
    const threadMessageUserID = snapshot.get("userID");
    const parentMessage = await ref.parent.parent.get();
    const chat = await parentMessage.ref.parent.parent.get();
    const persona = await chat.ref.parent.parent.get();

    let attendees;
    let usersToNotify;

    const isDM = context.params.personaId === SYSTEM_DM_PERSONA_ID;
    const isProjectAllChat = context.params.chatId === "all";

    if (isDM) {
      attendees = chat.get("attendees").map((u) => u.uid);
      usersToNotify = new Set(attendees);
    } else if (isProjectAllChat) {
      const authors = persona.get("authors");
      const communityMembers = persona.get("communityMembers") || [];
      attendees = authors.concat(communityMembers);
      usersToNotify = new Set(attendees);
    } else {
      throw new Error("Chat is neither a DM nor all chat");
    }

    usersToNotify.delete(threadMessageUserID);
    const createdByUser = await db
      .collection("users")
      .doc(threadMessageUserID)
      .get();
    const identityID = snapshot.get("identityID");
    const isAnonymous = !!snapshot.get("anonymous") && !!identityID;

    let identity = null;
    if (identityID) {
      identity = await getIdentity(identityID);
    }

    const eventData = {
      created_at: snapshot.get("timestamp"),
      originalCreatedAt: snapshot.get("timestamp"),
      ref,
      event_type: "chat_thread_message",
      seen: false,
      deleted: snapshot.get("deleted") || false,
      persona_id: context.params.personaId,
      isAnonymous,
      isDM,
      isProjectAllChat,
      parentMessage: {
        id: parentMessage.id,
        data: {
          ...getMessageCommonData(parentMessage),
        },
        ref: parentMessage.ref,
      },
      message: {
        id: snapshot.id,
        data: {
          ...getMessageCommonData(snapshot),
        },
        ref: ref,
      },
      chat: {
        id: chat.id,
        data: {
          attendees,
        },
        ref: chat.ref,
      },
      persona: {
        id: persona.id,
        data: {
          ...getPersonaCommonData(persona),
        },
        ref: persona.ref,
      },
      createdByUser: {
        id: createdByUser.id,
        data: {
          ...getCreatedByUserCommonData(createdByUser),
        },
        ref: createdByUser.ref,
      },
      ...(identity !== null && {
        identity: {
          ...identity,
        },
      }),
    };

    if (chat.get("postID")) {
      const post = await db
        .collection("personas")
        .doc(persona.id)
        .collection("posts")
        .doc(chat.get("postID"))
        .get();

      if (post.exists) {
        eventData["post"] = {
          id: post.id,
          data: {
            ...getPostCommonData(post),
          },
          ref: post.ref,
        };
      }
    }

    await Promise.all(
      [...usersToNotify].map(async (userID) => {
        const existingChatMessageActivityEvent = await db
          .collection("users")
          .doc(userID)
          .collection("activity")
          .where("parentMessage.ref", "==", parentMessage.ref)
          .where("event_type", "==", "chat_thread_message")
          .orderBy("created_at", "desc")
          .get();

        if (existingChatMessageActivityEvent.docs.length > 0) {
          const latestEvent = existingChatMessageActivityEvent.docs[0];
          await latestEvent.ref.update({
            // HACK: Firestore can't order by fields that don't exist and
            // udpatedAt is already being used for other updates to activity
            // that we don't want to surface to users by reordering the
            // activity stream. So we write over created_at and record
            // the original timestamp in a separate field instead so that
            // these events can appear at the top.
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            message: {
              id: snapshot.id,
              data: {
                ...getMessageCommonData(snapshot),
              },
              ref: ref,
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
          functions.logger.log(
            `Updated chat_thread_message event for ${userID} with new message`,
            ref.path,
          );
          const updatedLatestEventSnapshot = await latestEvent.ref.get();
          await createPushNotificationFromActivityEventRef({
            eventSnapshot: updatedLatestEventSnapshot,
            userID,
          });
        } else {
          const newRef = await db
            .collection("users")
            .doc(userID)
            .collection("activity")
            .add(eventData);

          functions.logger.log(
            `Created chat_thread_message event for ${userID}`,
            ref.path,
            newRef.path,
          );
        }
      }),
    );
  });

exports.createActivityEventFromCommunityChatThread = functions.firestore
  .document(
    "communities/{communityId}/chat/{chatId}/messages/{messageId}/threads/{threadMessageId}",
  )
  .onCreate(async (snapshot, context) => {
    const isCommunityAllChat = context.params.chatId === "all";

    if (!isCommunityAllChat) {
      throw new Error("Unrecognized chat");
    }

    const ref = snapshot.ref;
    const threadMessageUserID = snapshot.get("userID");
    const parentMessage = await ref.parent.parent.get();
    const chat = await parentMessage.ref.parent.parent.get();
    const notificationsMutedUsers = chat.get("notificationsMutedUsers") || [];
    const community = await chat.ref.parent.parent.get();
    const members = community.get("members") || [];

    if (members.length === 0) {
      throw new Error("Community has no members");
    }

    const usersToNotify = new Set(
      members.filter((member) => !notificationsMutedUsers.includes(member)),
    );
    usersToNotify.delete(threadMessageUserID);
    const createdByUser = await db
      .collection("users")
      .doc(threadMessageUserID)
      .get();
    const identityID = snapshot.get("identityID");
    const isAnonymous = !!snapshot.get("anonymous") && !!identityID;

    let identity = null;
    if (identityID) {
      identity = await getIdentity(identityID);
    }

    const eventData = {
      created_at: snapshot.get("timestamp"),
      originalCreatedAt: snapshot.get("timestamp"),
      ref,
      event_type: "chat_thread_message",
      seen: false,
      deleted: snapshot.get("deleted") || false,
      communityID: context.params.communityId,
      isAnonymous,
      isDM: false,
      isProjectAllChat: false,
      isCommunityAllChat,
      parentMessage: {
        id: parentMessage.id,
        data: {
          ...getMessageCommonData(parentMessage),
        },
        ref: parentMessage.ref,
      },
      message: {
        id: snapshot.id,
        data: {
          ...getMessageCommonData(snapshot),
        },
        ref: ref,
      },
      chat: {
        id: chat.id,
        data: {
          attendees: [...usersToNotify],
        },
        ref: chat.ref,
      },
      community: {
        id: community.id,
        data: {
          name: community.get("name") || "",
          profileImgUrl: community.get("profileImgUrl") || "",
        },
        ref: community.ref,
      },
      createdByUser: {
        id: createdByUser.id,
        data: {
          ...getCreatedByUserCommonData(createdByUser),
        },
        ref: createdByUser.ref,
      },
      ...(identity !== null && {
        identity: {
          ...identity,
        },
      }),
    };

    await Promise.all(
      [...usersToNotify].map(async (userID) => {
        const existingChatMessageActivityEvent = await db
          .collection("users")
          .doc(userID)
          .collection("activity")
          .where("parentMessage.ref", "==", parentMessage.ref)
          .where("event_type", "==", "chat_thread_message")
          .orderBy("created_at", "desc")
          .get();

        if (existingChatMessageActivityEvent.docs.length > 0) {
          const latestEvent = existingChatMessageActivityEvent.docs[0];
          await latestEvent.ref.update({
            // HACK: Firestore can't order by fields that don't exist and
            // udpatedAt is already being used for other updates to activity
            // that we don't want to surface to users by reordering the
            // activity stream. So we write over created_at and record
            // the original timestamp in a separate field instead so that
            // these events can appear at the top.
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            message: {
              id: snapshot.id,
              data: {
                ...getMessageCommonData(snapshot),
              },
              ref: ref,
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
          functions.logger.log(
            `Updated chat_thread_message event for ${userID} with new message`,
            ref.path,
          );
          const updatedLatestEventSnapshot = await latestEvent.ref.get();
          await createPushNotificationFromActivityEventRef({
            eventSnapshot: updatedLatestEventSnapshot,
            userID,
          });
        } else {
          const newRef = await db
            .collection("users")
            .doc(userID)
            .collection("activity")
            .add(eventData);

          functions.logger.log(
            `Created chat_thread_message event for ${userID}`,
            ref.path,
            newRef.path,
          );
        }
      }),
    );
  });

exports.updateActivityEventFromChatThreadMessage = functions.firestore
  .document(
    "communities/{communityId}/chats/{chatId}/messages/{messageId}/threads/{threadMessageId}",
  )
  .onUpdate(async (change, context) => {
    await markActivityEntriesDeleted(change.after);
  });

// TODO: Consolidate this with object updates
exports.updateActivityEventFromChatThreadMessage = functions.firestore
  .document(
    "personas/{personaId}/chats/{chatId}/messages/{messageId}/threads/{threadMessageId}",
  )
  .onUpdate(async (change, context) => {
    await markActivityEntriesDeleted(change.after);
  });

/** *********************************************
 *                                              *
 *               MENTIONS                       *
 *                                              *
 * **********************************************/

// NOTE: Comment / thread mentions are in the normal comment / thread listeners

/** *********************************************
 *                                              *
 *                    ROOMS                     *
 *                                              *
 * **********************************************/

exports.createActivityEventFromRoomPing = functions.firestore
  .document("pings/{pingId}")
  .onCreate(async (snapshot, context) => {
    const {
      cancelled,
      replied,
      roomPersonaID,
      roomPostID,
      requesterID,
      pingID: userID,
    } = snapshot.data();
    if (cancelled || replied) {
      return;
    }
    const persona = await db.collection("personas").doc(roomPersonaID).get();
    const post = await db
      .collection("personas")
      .doc(roomPersonaID)
      .collection("posts")
      .doc(roomPostID)
      .get();
    const createdByUser = await db.collection("users").doc(requesterID).get();
    const eventData = {
      created_at: admin.firestore.Timestamp.now(),
      event_type: "room_ping",
      ref: snapshot.ref,
      pingID: snapshot.id,
      deleted: post.get("deleted") || false,
      persona_id: roomPersonaID,
      post: {
        id: post.id,
        data: {
          title: post.get("title"),
        },
        ref: post.ref,
      },
      persona: {
        id: persona.id,
        data: {
          name: persona.get("name"),
          profileImgUrl: persona.get("profileImgUrl"),
        },
        ref: persona.ref,
      },
      createdByUser: {
        id: createdByUser.id,
        data: { userName: createdByUser.get("userName") },
        ref: createdByUser.ref,
      },
    };
    await db
      .collection("users")
      .doc(userID)
      .collection("activity")
      .add(eventData);
  });

/** *********************************************
 *                                              *
 *                FOLLOWING                     *
 *                                              *
 * **********************************************/

exports.updateUserFollowers = functions.firestore
  .document("users/{userId}/live/following")
  .onWrite(async (change, context) => {
    const beforeFollowing = change.before.get("profileFollow") || [];
    const afterFollowing = change.after.get("profileFollow") || [];

    // Don't both if there's no change in following since this document
    // also handles persona and non-profile follows.
    const numFollowingBefore = beforeFollowing.length;
    const numFollowingAfter = afterFollowing.length;
    if (
      numFollowingAfter === numFollowingBefore ||
      _.isEqual(beforeFollowing, afterFollowing)
    ) {
      return;
    }

    const userID = context.params.userId;

    if (numFollowingBefore < numFollowingAfter) {
      // Follower added
      const beforeFollowingSet = new Set(beforeFollowing);
      const newFollowingID = afterFollowing
        .filter((uid) => !beforeFollowingSet.has(uid))
        .pop();
      await db
        .collection("users")
        .doc(newFollowingID)
        .collection("live")
        .doc("followers")
        .set(
          {
            profileFollow: admin.firestore.FieldValue.arrayUnion(userID),
          },
          { merge: true },
        );
    } else {
      // Follower removed
      const afterFollowingSet = new Set(afterFollowing);
      const removedFollowingID = beforeFollowing
        .filter((uid) => !afterFollowingSet.has(uid))
        .pop();
      await db
        .collection("users")
        .doc(removedFollowingID)
        .collection("live")
        .doc("followers")
        .set(
          {
            profileFollow: admin.firestore.FieldValue.arrayRemove(userID),
          },
          { merge: true },
        );
    }
  });

exports.createActivityEventFromFollowerChange = functions.firestore
  .document("users/{userId}/live/followers")
  .onWrite(async (change, context) => {
    // NOTE: Only handles profileFollow changes, for now
    const beforeFollowers = change.before.get("profileFollow") || [];
    const afterFollowers = change.after.get("profileFollow") || [];

    const numFollowersBefore = beforeFollowers.length;
    const numFollowersAfter = afterFollowers.length;
    if (
      numFollowersAfter === numFollowersBefore ||
      _.isEqual(beforeFollowers, afterFollowers)
    ) {
      return;
    }

    const userID = context.params.userId;

    if (numFollowersBefore < numFollowersAfter) {
      // Follower added
      const beforeFollowersSet = new Set(beforeFollowers);
      const newFollowerID = afterFollowers
        .filter((uid) => !beforeFollowersSet.has(uid))
        .pop();

      const createdByUser = await db
        .collection("users")
        .doc(newFollowerID)
        .get();

      const eventData = {
        event_type: "user_profile_follow",
        created_at: admin.firestore.Timestamp.now(),
        ref: change.after.ref,
        deleted: false,
        followerID: newFollowerID,
        createdByUser: {
          id: createdByUser.id,
          data: {
            ...getCreatedByUserCommonData(createdByUser),
          },
          ref: createdByUser.ref,
        },
      };

      functions.logger.log(
        `${createdByUser.id} is now following ${userID} - adding user_profile_follow event for ${userID}`,
      );

      await db
        .collection("users")
        .doc(userID)
        .collection("activity")
        .add(eventData);
    } else {
      // Delete follow event
      const afterFollowersSet = new Set(afterFollowers);
      const removedFollowerID = beforeFollowers
        .filter((uid) => !afterFollowersSet.has(uid))
        .pop();
      const activityQuerySnap = await db
        .collection("users")
        .doc(userID)
        .collection("activity")
        .where("event_type", "==", "user_profile_follow")
        .where("followerID", "==", removedFollowerID)
        .get();

      if (!activityQuerySnap.empty) {
        functions.logger.log(
          `${removedFollowerID} is no longer following ${userID} - removing user_profile_follow event for ${userID}`,
        );
        const activitySnap = activityQuerySnap.docs[0];
        await activitySnap.ref.delete();
      }
    }
  });

/** *********************************************
 *                                              *
 *              OBJECT UPDATES                  *
 *                                              *
 * **********************************************/

const updateActivityEventFromRecordUpdate = async ({
  recordType,
  ref,
  data,
  changedValue = null,
}) => {
  const activityCollectionGroup = await db
    .collectionGroup("activity")
    .where(`${recordType}.ref`, "==", ref)
    .get();

  await Promise.all(
    activityCollectionGroup.docs.map(async (eventDoc) => {
      try {
        functions.logger.log(
          `Updating activity event data for ${recordType}`,
          ref.path,
          eventDoc.ref.path,
        );
        const updateObj = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          [`${recordType}.data`]: data,
        };

        if (
          changedValue &&
          changedValue[0] === "identityID" &&
          recordType !== "parentComment" &&
          recordType !== "parentMessage"
        ) {
          const [__, beforeIdentityID, afterIdentityID] = changedValue;
          if (afterIdentityID) {
            const identity = await getIdentity(afterIdentityID);
            if (identity) {
              updateObj.isAnonymous = true;
              updateObj.identity = {
                ...identity,
              };
            } else {
              throw new Error(
                "Attempted to fetch identity and failed: ",
                afterIdentityID,
              );
            }
          } else if (beforeIdentityID && !afterIdentityID) {
            updateObj.isAnonymous = false;
            updateObj.identity = admin.firestore.FieldValue.delete();
          }
        }
        await eventDoc.ref.update(updateObj);
      } catch (e) {
        functions.logger.error(
          "Failed to update activity event",
          eventDoc.ref.path,
          ref.path,
          e.toString(),
        );
      }
    }),
  );
};

const getDocumentChanges = ({ before, after, trackedFields }) => {
  for (let i = 0; i < trackedFields.length; i++) {
    let beforeVal = before.get(trackedFields[i]);
    let afterVal = after.get(trackedFields[i]);
    if (!_.isEqual(beforeVal, afterVal)) {
      return [trackedFields[i], beforeVal, afterVal];
    }
  }
  return null;
};

exports.updateActivityEventFromPersonaUpdate = functions.firestore
  .document("personas/{personaId}")
  .onUpdate(async (change, context) => {
    const trackedFields = ["name", "profileImgUrl"];
    const changedValue = getDocumentChanges({
      before: change.before,
      after: change.after,
      trackedFields,
    });
    if (changedValue) {
      functions.logger.log("Updating changed value", changedValue);
      await updateActivityEventFromRecordUpdate({
        recordType: "persona",
        data: getPersonaCommonData(change.after),
        ref: change.after.ref,
      });
      await updateActivityEventFromRecordUpdate({
        recordType: "subPersona",
        data: getPersonaCommonData(change.after),
        ref: change.after.ref,
      });
    }
  });

exports.updateActivityEventFromCommunityUpdate = functions.firestore
  .document("communities/{communityId}")
  .onUpdate(async (change, context) => {
    const trackedFields = ["name", "profileImgUrl"];
    const changedValue = getDocumentChanges({
      before: change.before,
      after: change.after,
      trackedFields,
    });
    if (changedValue) {
      functions.logger.log("Updating changed value", changedValue);
      await updateActivityEventFromRecordUpdate({
        recordType: "community",
        data: getPersonaCommonData(change.after),
        ref: change.after.ref,
      });
    }
  });

exports.updateActivityEventFromPostUpdate = functions.firestore
  .document("personas/{personaId}/posts/{postId}")
  .onUpdate(async (change, context) => {
    const trackedFields = [
      "title",
      "text",
      "mediaUrl",
      "imgUrl",
      "galleryUris",
    ];
    const changedValue = getDocumentChanges({
      before: change.before,
      after: change.after,
      trackedFields,
    });
    if (changedValue) {
      functions.logger.log("Updating changed value", changedValue);
      await updateActivityEventFromRecordUpdate({
        recordType: "post",
        afterSnapshot: change.after,
      });
    }
  });

exports.updateActivityEventFromCommentUpdate = functions.firestore
  .document("personas/{personaId}/posts/{postId}/comments/{commentId}")
  .onUpdate(async (change, context) => {
    const trackedFields = ["text", "identityID"];
    const changedValue = getDocumentChanges({
      before: change.before,
      after: change.after,
      trackedFields,
    });
    if (changedValue) {
      await updateActivityEventFromRecordUpdate({
        recordType: "comment",
        afterSnapshot: change.after,
        changedValue,
      });
      await updateActivityEventFromRecordUpdate({
        recordType: "parentComment",
        afterSnapshot: change.after,
        changedValue,
      });
    }
  });

exports.updateActivityEventFromMessageUpdate = functions
  .runWith({ minInstances: 2 })
  .firestore.document(
    "personas/{personaId}/chats/{chatId}/messages/{messageId}",
  )
  .onUpdate(async (change, context) => {
    const trackedFields = ["text"];
    const changedValue = getDocumentChanges({
      before: change.before,
      after: change.after,
      trackedFields,
    });
    if (changedValue) {
      await updateActivityEventFromRecordUpdate({
        recordType: "message",
        afterSnapshot: change.after,
      });
      await updateActivityEventFromRecordUpdate({
        recordType: "parentMessage",
        afterSnapshot: change.after,
      });
    }
  });

exports.updateActivityEventFromThreadMessageUpdate = functions.firestore
  .document(
    "personas/{personaId}/chats/{chatId}/messages/{messageId}/threads/{threadMessageId}",
  )
  .onUpdate(async (change, context) => {
    const trackedFields = ["text"];
    const changedValue = getDocumentChanges({
      before: change.before,
      after: change.after,
      trackedFields,
    });
    if (changedValue) {
      await updateActivityEventFromRecordUpdate({
        recordType: "message",
        afterSnapshot: change.after,
      });
    }
  });

exports.updateActivityEventFromThreadCommentUpdate = functions.firestore
  .document(
    "personas/{personaId}/posts/{postId}/comments/{parentCommentId}/threads/{commentId}",
  )
  .onUpdate(async (change, context) => {
    const trackedFields = ["text", "identityID"];
    const changedValue = getDocumentChanges({
      before: change.before,
      after: change.after,
      trackedFields,
    });
    if (changedValue) {
      await updateActivityEventFromRecordUpdate({
        recordType: "comment",
        afterSnapshot: change.after,
        changedValue,
      });
    }
  });

exports.createOrUpdateActivityEventFromPersonaVisibilityOrACLChange =
  functions.firestore
    .document("personas/{personaId}")
    .onUpdate(async (change, context) => {
      const before = change.before;
      const after = change.after;
      const isPrivacyChange = before.get("private") !== after.get("private");
      const isDeleted = !before.get("deleted") && after.get("deleted");
      const isAuthorRemoved =
        before.get("authors").length > after.get("authors").length;
      const isFollowerRemoved =
        (before.get("communityMembers") || []).length >
        (after.get("communityMembers") || []).length;

      if (
        !isPrivacyChange &&
        !isAuthorRemoved &&
        !isFollowerRemoved &&
        !isDeleted
      ) {
        return;
      }

      const authors = after.get("authors");
      const personaFollowers = after.get("communityMembers") || [];
      const pendingInvitedAuthorIDs = Object.keys(
        after.get("invitedUsers") || {},
      ).filter((invitedUser) => !invitedUser.accepted);
      const pendingInvitedCommunityMemberIDs = Object.keys(
        after.get("invitedCommunityMembers") || {},
      ).filter((invitedCommunityMember) => !invitedCommunityMember.accepted);
      const activityEventCollectionGroup = await db
        .collectionGroup("activity")
        .where("persona.ref", "==", after.ref)
        .get();

      const remixActivityEventCollectionGroup = await db
        .collectionGroup("activity")
        .where("remixSourcePersona.ref", "==", after.ref)
        .get();

      const activityEvents = []
        .concat(activityEventCollectionGroup.docs || [])
        .concat(remixActivityEventCollectionGroup.docs || []);

      const usersToNotifySet = new Set();
      await Promise.all(
        activityEvents.map(async (doc) => {
          const [__, userID] = doc.ref.path.split("/");
          if (isDeleted) {
            // Delete activity events for all users of a deleted persona
            await doc.ref.set(
              {
                deleted: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );

            if (
              personaFollowers.includes(userID) ||
              pendingInvitedAuthorIDs.includes(userID) ||
              pendingInvitedCommunityMemberIDs.includes(userID)
            ) {
              usersToNotifySet.add(userID);
            }
          } else if (
            !authors.includes(userID) &&
            !personaFollowers.includes(userID)
          ) {
            if (after.get("private")) {
              // Persona is now private or an author or follower was removed
              // on a private persona: delete activity events
              await doc.ref.set(
                {
                  deleted: true,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true },
              );
            }
          }
        }),
      );

      // Notify users of a deleted persona if we need to
      if (isDeleted) {
        // By the time a persona is being deleted there should only be
        // one author left
        const createdByUserID = after.get("authors").pop();
        const createdByUser = await db
          .collection("users")
          .doc(createdByUserID)
          .get();

        await Promise.all(
          Array.from(usersToNotifySet).map(async (userID) => {
            const eventData = {
              created_at: admin.firestore.FieldValue.serverTimestamp(),
              event_type: "persona_delete",
              deleted: false,
              persona_id: after.id,
              persona: {
                id: after.id,
                data: {
                  ...getPersonaCommonData(after),
                },
                ref: after.ref,
              },
              createdByUser: {
                id: createdByUser.id,
                data: {
                  ...getCreatedByUserCommonData(createdByUser),
                },
                ref: createdByUser.ref,
              },
            };

            await db
              .collection("users")
              .doc(userID)
              .collection("activity")
              .add(eventData);
          }),
        );
      }
    });
