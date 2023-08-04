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

// Convenience script. Talk to ken for instructions on how to use.
async function main() {

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

  const adminRole = {
    title: 'admin',
    price: 0,
    rights: adminRights,
    tier: 1,
  };

 const memberRole = {
    title: 'member',
    price: 0,
    rights,
    tier: 3,
  };

  // giving myself admin rights in the personateam community

  // const userId = 'PHobeplJLROyFlWhXPINseFVkK32'; // raeez
  // const userId = 'OaUVk09QmchK9c2AHJCtZcxdgQT2' //jasmine
  // const userId = 'XoZqmMzuWCVonmIBVicV4Xf6qlH3'; // barbie
  // const userId = '94hKmQP9DEhZICfZEebFq5rl8VZ2'; //will
  const userId = 'Mvofq5PBn8bHyKn3a9xKmbg0xIE2'; //michelle
  
  const communityId = 'akiya';
  const communityDocRef = await db.collection('communities').doc(communityId);
  
  // const personaId = 'WfFKZIHD4Esw3cFRQIyU'; // jazz 2 for jasmine
  // const personaId = 'JuOT37g6pUXlK3IeHci0'; //Just a Ken underneath this 10
  // const personaId = 'hu3gezaTlhtnFZsVu8zr'; // events

  // const personaId = 'ihforgd6HOFmAgHX7rS6'; // jasmine's private channel

  // akiya personas:
  // const personaId = '5Lo7rjueBIl3yhqgfHkN';
  // const personaId = 'AwVp1diF871pybEdkrKu';
  // const personaId = 'B0yzICZc6Es0RW15aeLR';
  const personaId = 'I3MVf8pRPGXXqpyKH6kd';
  // const personaId = 'zdpI4RyoCv8j1IDLPNJu';
  
  const personaDocRef = await db.collection('personas').doc(personaId);

  const adminRef = db
    .collection('communities')
    .doc(communityId)
    .collection('roles')
    .doc('each')
    .collection('role');

  const snapshot = await adminRef.where('title','==','admin').get();
  const doc = snapshot.docs[0];

  // add to community
  // db.collection('users').doc(userId).update({roles: admin.firestore.FieldValue.arrayUnion({...adminRole, roleRef: doc.ref, ref: db.collection('communities').doc(communityId)})});
  // communityDocRef.update({ userRoles: {admin: admin.firestore.FieldValue.arrayUnion(userId) }});

  // add to persona
  db.collection('users').doc(userId).update({roles: admin.firestore.FieldValue.arrayUnion({...adminRole, roleRef: doc.ref, ref: db.collection('personas').doc(personaId)})});
  personaDocRef.update({ userRoles: {admin: admin.firestore.FieldValue.arrayUnion(userId) }});
   
}
