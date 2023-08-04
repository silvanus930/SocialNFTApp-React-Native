#!/usr/bin/env node

const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const rights = {
    readChatPost: true,
    writePost: true,
    writeChat: true,
    withdrawal: false,
    createProposal: true,
    voteProposal: true,
    invite: true,
    createChannel: true,
    editChannel: true,
    createFundraisingPost: true,
    canPinPost: true,
  };

  const adminRights = {
    ...rights,
    withdrawal: true,
  };

  const memberRole = {
    title: 'member',
    price: 0,
    rights,
    tier: 3,
  };

  const engineerRole = {
    title: 'engineer',
    price: 0,
    rights,
    tier: 2,
  };

  const adminRole = {
    title: 'admin',
    price: 0,
    rights: adminRights,
    tier: 1,
  };

(async () => {
  try {    
    await main();
  } catch (e) {
    console.log(e);
  }
})();

async function main() {
  console.log('running script');

  db.collection('communities').get().then((snap) => {
    snap.forEach((community) => {
      console.log('getting community: ', community.id);

      // now update the community data
      db.collection('communities').doc(community.id).get().then(async (communityDoc) => {
        if(communityDoc.exists) {
          const rolePath = db
            .collection('communities')
            .doc(communityDoc.id)
            .collection('roles')
            .doc('each')
            .collection('role');
            
          if(communityDoc.data().name !== 'Secret Test Partayyy 🕺') {
            let engineerRef = rolePath.doc();
            await engineerRef.set(engineerRole);
          }
        }
      });
    });
  }); 
}
