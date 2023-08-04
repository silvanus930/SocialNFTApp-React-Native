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
  const userId = 'dUh7RliICjYYPhLV6fCGVs2kVeA2';
  const userRef = db.collection('users').doc(userId);

  const MEMBER_ROLE = (await db
    .collection("roles")
    .doc('each')
    .collection('role')
    .doc('member')
    .get())?.data();

  // get array of communities and personas this user belongs to
  db.collection('communities').get().then((snap) => {
    snap.forEach((community) => {
      console.log('getting community: ', community?.id);

      if(community && community.data().members?.includes(userId)) {
        const role = {
          ...MEMBER_ROLE,
          ref: community.ref,
        }
        userRef.update({roles: admin.firestore.FieldValue.arrayUnion(role)});
      }
    });
  });

  db.collection('personas').where('deleted','!=',true).get().then((snap) => {
    snap.forEach((persona) => {
      console.log('getting persona: ', persona?.id);

      if(persona && persona.data().authors?.includes(userId)) {
        const role = {
          ...MEMBER_ROLE,
          ref: persona.ref,
        }
        userRef.update({roles: admin.firestore.FieldValue.arrayUnion(role)});
      }
    });
  });

}
