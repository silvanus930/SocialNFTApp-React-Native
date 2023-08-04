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
  // Sweep thru all users. Sweep thru their roles array
  // grab the ref
  // That ref is used to populate userRoles.title array. Must use dot notation.

  db.collection('users').get().then((snap) => {
    snap.forEach((userDoc) => {
      console.log('updating ' + userDoc.id + ' -- ' + userDoc.data().userName);

      let roles = userDoc.data().roles;
      if(roles?.length > 0) {
        roles.forEach((role) => {
          let ref = role.ref;
          let title = role.title;
          let entityType = ref.path.split('/')[0];
          console.log('updating ' + role.title + ' in ' + entityType);
          ref.update({['userRoles.' + title]: admin.firestore.FieldValue.arrayUnion(userDoc.id)}).then(()=>{
            // success
          }).catch((e)=> {
            console.log('error writing ' + e);
          });
        });
      }
    });
  });
}