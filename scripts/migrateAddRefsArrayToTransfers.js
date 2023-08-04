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
  const transferDocs = await db.collection("transfers").get();

  transferDocs.docs.map(async (transferDoc, index) => {
    const data = transferDoc.data();

    // Firebase/firestore doesn't support OR queries
    //
    // Copy sourceRef and targetRef into an array such that
    // we can use a single query to identify all wallet transfers
    // for a given user:

    // await firestore()
    //     .collection('transfers')
    //     .where('refs', 'array-contains', userRef)

    const refs = [data.sourceRef, data.targetRef];
    transferDoc.ref.update({ refs: refs });
    console.log(
      `Updated transfers:${transferDoc.id}:refs[], sourceRef:`,
      data?.sourceRef?.path,
      "targetRef: ",
      data?.targetRef?.path
    );
  });
}
