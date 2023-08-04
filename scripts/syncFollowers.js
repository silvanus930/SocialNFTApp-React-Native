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
  const userCollection = await db.collection("users").get();
  const profileFollows = {};
  await Promise.all(
    userCollection.docs.map(async (user) => {
      const followingDoc = await user.ref
        .collection("live")
        .doc("following")
        .get();
      const userProfileFollows = followingDoc.get("profileFollow");
      if (userProfileFollows && userProfileFollows?.length > 0) {
        userProfileFollows.forEach((followingID) => {
          if (followingID in profileFollows) {
            profileFollows[followingID].push(user.id);
          } else {
            profileFollows[followingID] = [user.id];
          }
        });
      }
    }),
  );

  console.log(profileFollows);

  await Promise.all(
    Object.entries(profileFollows).map(async ([userID, followers]) => {
      await db
        .collection("users")
        .doc(userID)
        .collection("live")
        .doc("followers")
        .set(
          {
            profileFollow: followers,
          },
          { merge: true },
        );
    }),
  );
}
