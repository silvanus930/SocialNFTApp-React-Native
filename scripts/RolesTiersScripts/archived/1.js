#!/usr/bin/env node

const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");
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
  console.log('running Step 1 of 3');

  // Step 1. Clear ALL user roles. These will get re-generated from scratch.
  await db.collection('users').get().then((userSnap) => {
    userSnap.forEach((user) => {
      db.collection('users').doc(user.id).update({roles: []});
    });
  });
}
