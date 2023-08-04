#!/usr/bin/env node

const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

(async () => {
  try {
    await main();
  } catch (e) {
    console.log(e);
  }
})();

async function main() {
  const feed = await db.collection("feed").get();
  feed.docs.forEach(async (doc) => {
    console.log("Syncing", doc.id);
    const docData = doc.data();
    const persona = await docData.persona.ref.get();
    const post = await docData.post.ref.get();
    const updateObj = {};
    if (docData.persona.data.private !== persona.get("private")) {
      updateObj["persona.data.private"] = persona.get("private");
    }
    if (docData.persona.data.deleted !== persona.get("deleted")) {
      updateObj["persona.data.deleted"] = persona.get("deleted");
    }
    if (docData.post.data.published !== post.get("published")) {
      updateObj["post.data.published"] = post.get("published");
    }
    if (docData.post.data.deleted !== post.get("deleted")) {
      updateObj["post.data.deleted"] = post.get("deleted");
    }
    if (Object.keys(updateObj).length > 0) {
      console.log("Updating", doc.id);
      await doc.ref.update(updateObj);
    } else {
      console.log("No update required", doc.id);
    }
  });

  const story = await db.collection("story").get();
  story.docs.forEach(async (doc) => {
    console.log("Syncing", doc.id);
    const docData = doc.data();
    const updateObj = {};

    const persona = await docData.persona.ref.get();
    if (docData.persona.data.private !== persona.get("private")) {
      updateObj["persona.data.private"] = persona.get("private") ?? true;
    }
    if (docData.persona.data.deleted !== persona.get("deleted")) {
      updateObj["persona.data.deleted"] = persona.get("deleted") ?? true;
    }

    const posts = doc.get("posts");
    if (posts) {
      await Promise.all(
        Object.keys(posts).map(async (postID) => {
          const post = await posts[postID].ref.get();
          const postData = posts[postID];
          if (postData.data.published !== post.get("published")) {
            updateObj[`posts.${postID}.data.published`] =
              post.get("published") ?? false;
          }
          if (postData.data.deleted !== post.get("deleted")) {
            updateObj[`posts.${postID}.data.deleted`] =
              post.get("deleted") ?? true;
          }
        }),
      );
    }
    if (Object.keys(updateObj).length > 0) {
      console.log("Updating", doc.id);
      await doc.ref.update(updateObj);
    } else {
      console.log("No update required", doc.id);
    }
  });
}
