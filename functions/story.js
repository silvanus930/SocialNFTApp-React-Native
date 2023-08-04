const { db, admin, functions } = require("./admin");

/** *********************************************
 *                                              *
 *               STORIES                        *
 *                                              *
 * **********************************************/

exports.createStoryCacheFromPost = functions.firestore
  .document("personas/{personaId}/posts/{postId}")
  .onCreate(async (postSnapshot, context) => {
    const personaId = context.params.personaId;
    const storyRef = db.collection("storyCache").doc(personaId);
    const newStoryData = {
      posts: {
        [postSnapshot.id]: {
          data: JSON.stringify(postSnapshot.data()),
          ref: postSnapshot.ref,
          id: postSnapshot.id,
        },
      },
    };
    try {
      await storyRef.set(newStoryData, { merge: true });
      functions.logger.log(
        "Adding post to story",
        postSnapshot.ref.path,
        `story/${personaId}`
      );
    } catch (e) {
      functions.logger.error(
        "Failed to add post to story",
        postSnapshot.ref.path,
        `story/${personaId}`
      );
    }
  });

exports.updateStoryCacheFromPost = functions
  .runWith({ minInstances: 1 })
  .firestore.document("personas/{personaId}/posts/{postId}")
  .onUpdate(async (change, context) => {
    const postSnapshot = change.after;
    const personaId = context.params.personaId;
    const storyRef = db.collection("storyCache").doc(personaId);
    const newStoryData = {
      posts: {
        [postSnapshot.id]: {
          data: JSON.stringify(postSnapshot.data()),
          ref: postSnapshot.ref,
          id: postSnapshot.id,
        },
      },
    };
    try {
      await storyRef.set(newStoryData, { merge: true });
      functions.logger.log(
        "Adding post to story",
        postSnapshot.ref.path,
        `story/${personaId}`
      );
    } catch (e) {
      functions.logger.error(
        "Failed to add post to story",
        postSnapshot.ref.path,
        `story/${personaId}`
      );
    }
  });

exports.createStoryCacheFromPersona = functions.firestore
  .document("personas/{personaId}")
  .onCreate(async (personaSnapshot, context) => {
    const personaId = context.params.personaId;
    const newStoryData = {
      persona: {
        data: JSON.stringify(personaSnapshot.data()),
        authors: personaSnapshot.get("authors") || [],
        communityMembers: personaSnapshot.get("communityMembers") || [],
        deleted: personaSnapshot.get("deleted") || false,
        ref: personaSnapshot.ref,
        id: personaSnapshot.id,
      },
    };
    try {
      await db
        .collection("storyCache")
        .doc(personaId)
        .set(newStoryData, { merge: true });
      functions.logger.log(
        "Adding persona to story",
        personaSnapshot.ref.path,
        `story/${personaId}`
      );
    } catch (e) {
      functions.logger.error(
        "Failed to add persona to story",
        personaSnapshot.ref.path,
        `story/${personaId}`
      );
    }
  });

exports.updateStoryCacheFromPersona = functions.firestore
  .document("personas/{personaId}")
  .onUpdate(async (change, context) => {
    const personaSnapshot = change.after;
    const personaId = context.params.personaId;
    const newStoryData = {
      persona: {
        data: JSON.stringify(personaSnapshot.data()),
        authors: personaSnapshot.get("authors") || [],
        communityMembers: personaSnapshot.get("communityMembers") || [],
        deleted: false,
        ref: personaSnapshot.ref,
        id: personaSnapshot.id,
      },
    };
    try {
      await db
        .collection("storyCache")
        .doc(personaId)
        .set(newStoryData, { merge: true });
      functions.logger.log(
        "Adding persona to story",
        personaSnapshot.ref.path,
        `story/${personaId}`
      );
    } catch (e) {
      functions.logger.error(
        "Failed to add persona to story",
        personaSnapshot.ref.path,
        `story/${personaId}`
      );
    }
  });

exports.createStoryFromPost = functions.firestore
  .document("personas/{personaId}/posts/{postId}")
  .onCreate(async (postSnapshot, context) => {
    const personaId = context.params.personaId;
    const storyRef = db.collection("story").doc(personaId);
    const storyDoc = await storyRef.get();
    const oldPostChange = (storyDoc.get("latestPostChange") || {}).seconds || 0;
    const latestPostChange =
      oldPostChange < postSnapshot.get("editDate").seconds
        ? postSnapshot.get("editDate")
        : storyDoc.get("latestPostChange");
    const newStoryData = {
      posts: {
        [postSnapshot.id]: {
          data: postSnapshot.data(),
          ref: postSnapshot.ref,
          id: postSnapshot.id,
        },
      },
      latestPostChange,
    };
    try {
      await storyRef.set(newStoryData, { merge: true });
      functions.logger.log(
        "Adding post to story",
        postSnapshot.ref.path,
        `story/${personaId}`
      );
    } catch (e) {
      functions.logger.error(
        "Failed to add post to story",
        postSnapshot.ref.path,
        `story/${personaId}`
      );
    }
  });

exports.updateStoryFromPost = functions
  .runWith({ minInstances: 5 })
  .firestore.document("personas/{personaId}/posts/{postId}")
  .onUpdate(async (change, context) => {
    const postSnapshot = change.after;
    const personaId = context.params.personaId;
    const storyRef = db.collection("story").doc(personaId);
    const storyDoc = await storyRef.get();
    const oldPostChange = (storyDoc.get("latestPostChange") || {}).seconds || 0;
    const latestPostChange =
      oldPostChange < postSnapshot.get("editDate").seconds
        ? postSnapshot.get("editDate")
        : storyDoc.get("latestPostChange");
    const newStoryData = {
      posts: {
        [postSnapshot.id]: {
          data: postSnapshot.data(),
          ref: postSnapshot.ref,
          id: postSnapshot.id,
        },
      },
      latestPostChange,
    };
    try {
      await storyRef.set(newStoryData, { merge: true });
      functions.logger.log(
        "Adding post to story",
        postSnapshot.ref.path,
        `story/${personaId}`
      );
    } catch (e) {
      functions.logger.error(
        "Failed to add post to story",
        postSnapshot.ref.path,
        `story/${personaId}`
      );
    }
  });

exports.createStoryFromPersona = functions.firestore
  .document("personas/{personaId}")
  .onCreate(async (personaSnapshot, context) => {
    const personaId = context.params.personaId;
    const newStoryData = {
      persona: {
        data: personaSnapshot.data(),
        ref: personaSnapshot.ref,
        id: personaSnapshot.id,
      },
    };
    try {
      await db
        .collection("story")
        .doc(personaId)
        .set(newStoryData, { merge: true });
      functions.logger.log(
        "Adding persona to story",
        personaSnapshot.ref.path,
        `story/${personaId}`
      );
    } catch (e) {
      functions.logger.error(
        "Failed to add persona to story",
        personaSnapshot.ref.path,
        `story/${personaId}`
      );
    }
  });

exports.updateStoryFromPersona = functions.firestore
  .document("personas/{personaId}")
  .onUpdate(async (change, context) => {
    const personaSnapshot = change.after;
    const personaId = context.params.personaId;
    const newStoryData = {
      persona: {
        data: personaSnapshot.data(),
        ref: personaSnapshot.ref,
        id: personaSnapshot.id,
      },
    };
    try {
      await db
        .collection("story")
        .doc(personaId)
        .set(newStoryData, { merge: true });
      functions.logger.log(
        "Adding persona to story",
        personaSnapshot.ref.path,
        `story/${personaId}`
      );
    } catch (e) {
      functions.logger.error(
        "Failed to add persona to story",
        personaSnapshot.ref.path,
        `story/${personaId}`
      );
    }
  });
