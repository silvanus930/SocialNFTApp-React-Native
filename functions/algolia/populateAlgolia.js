const { db, functions } = require("../admin");
const { algoliaIndex } = require("./config");


// remove deleted item i.e deleted = true,
// make sure item.text exists

const saveCommunityChatToAlgolia = async () => {
  try {
    const communitiesRef = await db.collection("communities").get();
    const records = await Promise.all(
      communitiesRef.docs.map(async (doc) => {
        const communityId = doc.id;
        const messageRef = db
          .collection("communities")
          .doc(communityId)
          .collection("chat/all/messages");
        const messageShapShot = await messageRef.get();
        return messageShapShot.docs.map((messageDoc) => ({
          ...messageDoc.data(),
          type: "chat",
          objectID: messageDoc.id,
          communityId,
        }));
      }),
    ).then((results) => results.flat());
    if (records.length) {
      await algoliaIndex.saveObjects(records);
      console.log("successfully indexing algolia community chats");
    }
  } catch (error) {
    console.log("Error saving community chat to Algolia:", error);
    throw new functions.https.HttpsError("internal", "Error saving community chat to Algolia");
  }
};


const saveCommunityPostToAlgolia = async () => {
  try {
    const communitiesRef = await db.collection("communities").get();
    const records = await Promise.all(
      communitiesRef.docs.map(async (doc) => {
        const communityId = doc.id;
        const messageRef = db
          .collection("communities")
          .doc(communityId)
          .collection("posts");
        const messageShapShot = await messageRef.get();
        return messageShapShot.docs.map((messageDoc) => ({
          ...messageDoc.data(),
          type: "post",
          objectID: messageDoc.id,
          communityId,
        }));
      }),
    ).then((results) => results.flat());
    if (records.length) {
      await algoliaIndex.saveObjects(records);
      console.log("successfully indexing algolia community posts");
    }
  } catch (error) {
    console.log("Error saving community post to Algolia:", error);
    throw new functions.https.HttpsError("internal", "Error saving community post to Algolia");
  }
};


const savePersonaChatToAlgolia = async () => {
  try {
    const personaRef = await db.collection("personas").get();
    const records = await Promise.all(
      personaRef.docs.map(async (doc) => {
        const personaId = doc.id;
        const messageRef = db
          .collection("personas")
          .doc(personaId)
          .collection("chats/all/messages");
        const messageShapShot = await messageRef.get();
        return messageShapShot.docs.map((messageDoc) => ({
          ...messageDoc.data(),
          type: "chat",
          objectID: messageDoc.id,
          personaId,
        }));
      }),
    ).then((results) => results.flat());
    if (records.length) {
      await algoliaIndex.saveObjects(records);
      console.log("successfully indexing algolia persona chats");
    }
  } catch (error) {
    console.log("Error saving persona chat to Algolia:", error);
    throw new functions.https.HttpsError("internal", "Error saving persona chat to Algolia");
  }
};

const savePersonaPostToAlgolia = async () => {
  try {
    const personaRef = await db.collection("personas").get();
    const records = await Promise.all(
      personaRef.docs.map(async (doc) => {
        const personaId = doc.id;
        const messageRef = db
          .collection("personas")
          .doc(personaId)
          .collection("posts");
        const messageShapShot = await messageRef.get();
        return messageShapShot.docs.map((messageDoc) => ({
          ...messageDoc.data(),
          type: "post",
          objectID: messageDoc.id,
          personaId,
        }));
      }),
    ).then((results) => results.flat());
    if (records.length) {
      await algoliaIndex.saveObjects(records);
      console.log("successfully indexing algolia persona posts");
    }
  } catch (error) {
    console.log("Error saving persona post to Algolia:", error);
    throw new functions.https.HttpsError("internal", "Error saving persona post to Algolia");
  }
};


exports.populateAlgolia = functions.https.onRequest(async (req, res) => {
  await saveCommunityChatToAlgolia();
  await saveCommunityPostToAlgolia();
  await savePersonaChatToAlgolia();
  await savePersonaPostToAlgolia();
  res.send("Algolia population completed!");
});

