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
  // Add the removeUser right based on role type

  db.collection('users').get().then((snap) => {
    snap.forEach((userDoc) => {
      console.log('updating ' + userDoc.id + ' -- ' + userDoc.data().userName);

      let updatedRoles = userDoc.data().roles;

      if(updatedRoles?.length > 0) {
        for(let i=0; i < updatedRoles.length; i++) {
          if(updatedRoles[i]?.rights) {
            if(updatedRoles[i]?.title === 'member') {
              updatedRoles[i].rights.removeUser = false;
            } else if(updatedRoles[i]?.title === 'admin') {
              updatedRoles[i].rights.removeUser = true;
            } else if(updatedRoles[i]?.title === 'engineer') {
              updatedRoles[i].rights.removeUser = false;
            }
          }          
        }

        userDoc.ref.update({roles: updatedRoles}).then(()=>{
          // success
          console.log('success updating ', userDoc.data().userName)
        }).catch((e)=> {
          console.log('error writing ' + e);
        });        
      }
    });
  });
}