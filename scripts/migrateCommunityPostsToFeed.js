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
  const feedDocsMigrated = await db
    .collection("feed")
    .where("migrated", "==", true)
    .where("hook", "==", "migratedViaScript_migraateCommunityPostsToFeed")
    .get();

  console.log("Migrated community post feed items: ", feedDocsMigrated.size);

  console.log("Deleting imported post feed items prior to re-import.");

  feedDocsMigrated.docs.map(async (feedDoc) => {
    console.log(
      "Deleting migrated community post, feed_id: ",
      feedDoc.id,
      feedDoc.get("migrated")
    );
    feedDoc.ref.delete();
  });

  const communitiesCollection = await db.collection("communities").get();
  communitiesCollection.docs.map(async (community) => {
    const postsCollection = await community.ref.collection("posts").get();

    postsCollection.docs.map(async (post) => {
      const feedData = {
        post: {
          data: post.data(),
          ref: post.ref,
          id: post.id,
        },
        community: {
          data: community.data(),
          ref: community.ref,
          id: community.id,
        },
        following: [],
        postType: "community",
        hook: "migratedViaScript_migraateCommunityPostsToFeed",
        migrated: true,
      };

      try {
        const existing = await db
          .collection("feed")
          .where("post.ref", "==", post.ref)
          .where("community.ref", "==", community.ref)
          .get();
        if (existing.size > 0) {
          console.log("Found duplicate, do not import!", community.id, post.id);
        } else {
          const createdRef = await db.collection("feed").add(feedData);
          console.log(
            "Creating feed event from community post",
            post.ref.path,
            createdRef.path
          );
        }
      } catch (e) {
        console.error("Failed to create feed event", e, post.ref.path);
      }
    });
    return;
  });
}
