const firebaseTools = require("firebase-tools");
const {
  admin, db, functions,
} = require("./admin");

/**
 * Initiate a recursive delete of documents at a given path.
 *
 * The calling user must be authenticated.
 *
 * This delete is NOT an atomic operation and it's possible
 * that it may fail after only deleting some documents.
 *
 * @param {string} data.path the document or collection path to delete.
 */
exports.recursiveDelete = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "2GB",
  })
  .https.onCall(async (data, context) => {
    if (!(context.auth && context.auth.token)) {
      throw new functions.https.HttpsError("permission-denied");
    }

    const path = data.path;
    console.log(
      `User ${context.auth.uid} has requested to delete path ${path}`,
    );

    // Run a recursive delete on the given document or collection path.
    await firebaseTools.firestore.delete(path, {
      project: process.env.GCLOUD_PROJECT,
      recursive: true,
      yes: true,
      token: functions.config().fb.token,
    });

    return {
      path: path,
    };
  });

exports.recursiveMarkDelete = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "2GB",
  })
  .https.onCall(async (data, context) => {
    if (!(context.auth && context.auth.token)) {
      throw new functions.https.HttpsError("permission-denied");
    }

    const docPath = data.docPath;
    functions.logger.log(
      `User ${context.auth.uid} has requested to mark delete path ${docPath}`,
    );

    const rootDeleteDoc = await db.doc(docPath).get();

    /**
     * Recursively mark a document deleted, and timestamp for its children
     * @param {DocumentSnapshot} doc
     */
    async function markDeleteRecursive(doc) {
      if (doc.exists) {
        await doc.ref.set(
          {deleted: true, deletedAt: admin.firestore.Timestamp.now()},
          {merge: true},
        );
      }
      const collectionRefs = await doc.ref.listCollections();
      for (const collectionRef of collectionRefs) {
        const collection = await collectionRef.get();
        for (const childDoc of collection.docs) {
          await markDeleteRecursive(childDoc);
        }
      }
    }
    await markDeleteRecursive(rootDeleteDoc);

    return {docPath};
  });
