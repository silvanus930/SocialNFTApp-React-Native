const {
  db, functions,
} = require("./admin");


exports.simpleOnCreate = functions.firestore
  .document("test/{id}")
  .onCreate(async (snap, context) => {
    const testData = snap.get("testData");
    await db.collection("different").doc("test").set({testData});
  });
