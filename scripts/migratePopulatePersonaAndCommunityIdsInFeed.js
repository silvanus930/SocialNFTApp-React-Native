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
  const feedDocs = await db.collection("feed").get();

  feedDocs.docs.map(async (feedDoc, index) => {
    const data = feedDoc.data();

    let personaId;
    let communityId;
    let flag;

    if (data.persona) {
      flag = "pers-post";
      personaId = data.persona.id;
      communityId = data.persona.communityID;
    }

    if (data.community) {
      flag = "comm-post";
      communityId = data.community.id;
    }

    if (!communityId && personaId) {
      const communities = await db
        .collection("communities")
        .where("projects", "array-contains", personaId)
        .get();

      const docs = communities.docs;
      if (docs.length) {
        communityId = docs[0].id;
      }
    }

    let ids = [];
    if (communityId) {
      ids.push(communityId);
    }

    if (personaId) {
      ids.push(personaId);
    }

    feedDoc.ref.update({ community_and_persona_ids: ids });

    console.log(
      index,
      flag,
      feedDoc.id,
      "community_and_persona_ids",
      ids,
      feedDoc.ref.path
    );
  });
}
