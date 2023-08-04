const { db, functions, admin } = require("./admin");

/** *********************************************
 *                                              *
 *               REAL TIME FEED                 *
 *                                              *
 * **********************************************/

exports.addUserPostsUnSeen = functions.firestore
  .document("personas/{personaId}/posts/{postId}")
  .onCreate(async (postSnapshot, context) => {
    const { personaId, postId } = context.params;
    try {
      const userDocs = await db.collection("users").get();
      const personaDoc = await db.collection("personas").doc(personaId).get();
      for (const userDoc of userDocs.docs) {
        const isAuthor = (personaDoc.get("authors") || []).includes(userDoc.id);
        const inCommunity = (personaDoc.get("communityMembers") || []).includes(
          userDoc.id
        );
        const viewable =
          isAuthor ||
          inCommunity ||
          (!personaDoc.get("private") && postSnapshot.get("published"));
        if (viewable && userDoc.id !== postSnapshot.get("userID")) {
          let update;
          if (isAuthor || inCommunity) {
            update = {
              [personaId]: admin.firestore.FieldValue.arrayUnion(postId),
              follow: admin.firestore.FieldValue.arrayUnion(postId),
            };
          } else {
            update = { animus: admin.firestore.FieldValue.arrayUnion(postId) };
          }
          await db
            .collection("users")
            .doc(userDoc.id)
            .collection("live")
            .doc("personasUnseen")
            .set(update, { merge: true });
        }
      }
    } catch (e) {
      functions.logger.error(
        "Failed to create user post unseen update",
        postSnapshot.ref.path
      );
    }
  });

exports.updateUserPostsUnSeen = functions
  .runWith({ minInstances: 2 })
  .firestore.document("personas/{personaId}/posts/{postId}")
  .onUpdate(async (change, context) => {
    const postSnapshot = change.after;
    const { personaId, postId } = context.params;
    try {
      const userDocs = await db.collection("users").get();
      const personaDoc = await db.collection("personas").doc(personaId).get();
      for (const userDoc of userDocs.docs) {
        const isAuthor = (personaDoc.get("authors") || []).includes(userDoc.id);
        const inCommunity = (personaDoc.get("communityMembers") || []).includes(
          userDoc.id
        );
        const viewable =
          (isAuthor ||
            inCommunity ||
            (!personaDoc.get("private") && postSnapshot.get("published"))) &&
          !postSnapshot.get("deleted");
        if (!viewable) {
          const update = {
            [personaId]: admin.firestore.FieldValue.arrayRemove(postId),
            animus: admin.firestore.FieldValue.arrayRemove(postId),
          };
          await db
            .collection("users")
            .doc(userDoc.id)
            .collection("live")
            .doc("personasUnseen")
            .set(update, { merge: true });
        }
      }
    } catch (e) {
      functions.logger.error(
        "Failed to remove user post unseen update",
        postSnapshot.ref.path
      );
    }
  });

exports.updateUserPostsUnSeenFromCuration = functions
  .runWith({ minInstances: 5 })
  .firestore.document("feed/{feedId}")
  .onUpdate(async (change, context) => {
    const feedSnapshot = change.after;
    if (feedSnapshot.get("curated") === change.before.get("curated")) {
      return;
    }
    try {
      const userDocs = await db.collection("users").get();
      for (const userDoc of userDocs.docs) {
        if (
          userDoc.id !== feedSnapshot.get("post.data.userID") &&
          feedSnapshot.get("curated")
        ) {
          let update;
          if (feedSnapshot.get("curated")) {
            update = {
              gallery: admin.firestore.FieldValue.arrayUnion(
                feedSnapshot.get("post.id")
              ),
            };
          } else {
            update = {
              gallery: admin.firestore.FieldValue.arrayRemove(
                feedSnapshot.get("post.id")
              ),
            };
          }
          await db
            .collection("users")
            .doc(userDoc.id)
            .collection("live")
            .doc("personasUnseen")
            .set(update, { merge: true });
        }
      }
    } catch (e) {
      functions.logger.error(
        "Failed to update postsunseen from curation",
        feedSnapshot.ref.path
      );
    }
  });

exports.createGlobalFeedEventFromCommunityPost = functions.firestore
  .document("communities/{communityId}/posts/{postId}")
  .onCreate(async (postSnapshot, context) => {
    const { communityId, postId } = context.params;
    const communityDoc = await postSnapshot.ref.parent.parent.get();

    const userID = postSnapshot.get("userID");
    if (!userID) {
      functions.logger.error("Post missing userID", postSnapshot.ref.path);
      return;
    }

    const feedData = {
      post: {
        data: postSnapshot.data(),
        ref: postSnapshot.ref,
        id: postSnapshot.id,
      },
      community: {
        data: communityDoc.data(),
        ref: communityDoc.ref,
        id: communityDoc.id,
      },
      postType: "community",
      following: [],
      hook: "createGlobalFeedEventFromCommunityPost",
      community_and_persona_ids: [communityId],
    };

    try {
      const createdRef = await db.collection("feed").add(feedData);
      functions.logger.log(
        "Creating feed event",
        postSnapshot.ref.path,
        createdRef.path
      );
    } catch (e) {
      functions.logger.error(
        "Failed to create feed event",
        postSnapshot.ref.path,
        e
      );
    }
  });

exports.updateGlobalFeedEventFromCommunityPost = functions.firestore
  .document("communities/{communityId}/posts/{postId}")
  .onUpdate(async (change, context) => {
    const postSnapshot = change.after;
    const feedCol = await db
      .collection("feed")
      .where("post.ref", "==", postSnapshot.ref)
      .get();
    for (const feedDoc of feedCol.docs) {
      try {
        feedDoc.ref.update({
          post: {
            data: postSnapshot.data(),
            ref: postSnapshot.ref,
            id: postSnapshot.id,
          },
        });
        functions.logger.log(
          "Updating feed event",
          postSnapshot.ref.path,
          feedDoc.ref.path
        );
      } catch (e) {
        functions.logger.error(
          "Failed to update feed event",
          feedDoc.ref.path,
          postSnapshot.ref.path
        );
      }
    }
  });

exports.createGlobalFeedEventFromPost = functions.firestore
  .document("personas/{personaId}/posts/{postId}")
  .onCreate(async (postSnapshot, context) => {
    const { personaId, postId } = context.params;
    const personaDoc = await postSnapshot.ref.parent.parent.get();
    const userID = postSnapshot.get("userID");
    if (!userID) {
      functions.logger.error("Post missing userID", postSnapshot.ref.path);
      return;
    }
    const followingDoc = await db.collection("caching").doc("following").get();
    const profileFollowing =
      followingDoc.get(`usersByFollowed.${userID}`) || [];
    let personaFollowing = (personaDoc.get("authors") || []).concat(
      personaDoc.get("communityMembers") || []
    );
    personaFollowing = personaFollowing.concat(
      profileFollowing.filter((id) => !personaFollowing.includes(id))
    );
    const feedData = {
      post: {
        data: postSnapshot.data(),
        ref: postSnapshot.ref,
        id: postSnapshot.id,
      },
      persona: {
        data: personaDoc.data(),
        ref: personaDoc.ref,
        id: personaDoc.id,
      },
      following: personaFollowing,
      community_and_persona_ids: [personaDoc?.data()?.communityID, personaId],
    };
    try {
      const createdRef = await db.collection("feed").add(feedData);
      functions.logger.log(
        "Creating feed event",
        postSnapshot.ref.path,
        createdRef.path
      );
    } catch (e) {
      functions.logger.error(
        "Failed to create feed event",
        postSnapshot.ref.path,
        e
      );
    }
  });

exports.updateGlobalFeedEventFromPost = functions.firestore
  .document("personas/{personaId}/posts/{postId}")
  .onUpdate(async (change, context) => {
    const postSnapshot = change.after;
    const feedCol = await db
      .collection("feed")
      .where("post.ref", "==", postSnapshot.ref)
      .get();
    for (const feedDoc of feedCol.docs) {
      try {
        feedDoc.ref.update({
          post: {
            data: postSnapshot.data(),
            ref: postSnapshot.ref,
            id: postSnapshot.id,
          },
        });
        functions.logger.log(
          "Updating feed event",
          postSnapshot.ref.path,
          feedDoc.ref.path
        );
      } catch (e) {
        functions.logger.error(
          "Failed to update feed event",
          feedDoc.ref.path,
          postSnapshot.ref.path
        );
      }
    }
  });

exports.updateGlobalFeedEventFromPersona = functions.firestore
  .document("personas/{personaId}")
  .onUpdate(async (change, context) => {
    const personaSnapshot = change.after;
    const feedCol = await db
      .collection("feed")
      .where("persona.ref", "==", personaSnapshot.ref)
      .get();
    const personaData = personaSnapshot.data();
    const personaFollowing = (personaSnapshot.get("authors") || []).concat(
      personaSnapshot.get("communityMembers") || []
    );
    for (const feedDoc of feedCol.docs) {
      try {
        feedDoc.ref.update({
          persona: {
            data: personaData,
            ref: personaSnapshot.ref,
            id: personaSnapshot.id,
          },
          following: personaFollowing,
        });
        functions.logger.log(
          "Updating feed event",
          personaSnapshot.ref.path,
          feedDoc.ref.path
        );
      } catch (e) {
        functions.logger.error(
          "Failed to update feed event",
          feedDoc.ref.path,
          personaSnapshot.ref.path
        );
      }
    }
  });

// exports.updateGlobalFeedEventFromPersona = functions.firestore
//   .document("caching/following")
//   .onUpdate(async (change, context) => {
//     const after = change.after;
//     const before = change.before;
//
//
//
//     const feedCol = await db.collection("feed")
//       .where("persona.data.authors", "array-contains", ).get();
//     const personaData = personaSnapshot.data();
//     const personaFollowing = (
//       personaSnapshot.get("authors") || []
//     ).concat(personaSnapshot.get("communityMembers") || []);
//     for (const feedDoc of feedCol.docs) {
//       try {
//         feedDoc.ref.update({
//           persona: {
//             data: personaData,
//             ref: personaSnapshot.ref,
//             id: personaSnapshot.id,
//           },
//           following: personaFollowing,
//         });
//         functions.logger.log(
//           "Updating feed event",
//           personaSnapshot.ref.path,
//           feedDoc.ref.path,
//         );
//       } catch (e) {
//         functions.logger.error(
//           "Failed to update feed event", feedDoc.ref.path, personaSnapshot.ref.path,
//         );
//       }
//     }
//   });
