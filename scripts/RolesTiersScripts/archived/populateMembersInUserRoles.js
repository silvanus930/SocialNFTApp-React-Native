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

  // For members, we can sweep through each community and persona and add copy the members/authors array to the roles/users document

  // For admin, currently the only one is raeez in personateam and barbie in test....can manually add these later
  // or down the line sweep through each user's roles and if they have a non-member role we can add it to userRoles.

  // COMMUNITIES
  db.collection('communities').where('deleted','!=',true).get().then((snap) => {
    snap.forEach((communityDoc) => {
      let members = communityDoc.data().members;
      if(members?.length > 0) {
        // accidentally added 'members' instead of 'member'...this line removes it:
        // db.collection('communities').doc(communityDoc.id).update({userRoles: admin.firestore.FieldValue.arrayRemove('members')});
        db.collection('communities').doc(communityDoc.id).update({userRoles: {member: admin.firestore.FieldValue.arrayUnion(...members)}});
      }
      
    });
  });

  // PERSONAS
  db.collection('personas').where('deleted','!=',true).get().then((snap) => {
    snap.forEach((personaDoc) => {
      let members = personaDoc.data().authors;
      if(members?.length > 0) {
        // accidentally added 'members' instead of 'member'...this line removes it:
        // db.collection('personas').doc(personaDoc.id).update({userRoles: admin.firestore.FieldValue.arrayRemove('members')});
        db.collection('personas').doc(personaDoc.id).update({userRoles: {member: admin.firestore.FieldValue.arrayUnion(...members)}});
      }      
    });
  });
}
