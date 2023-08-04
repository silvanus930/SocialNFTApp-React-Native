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

    const description = {
      readChatPost: 'Read all chats and posts',
      writePost: 'Write posts',
      writeChat: 'Write chat messages',
      withdrawal: 'Withdraw funds from treasuries',
      createProposal: 'Make new proposals',
      voteProposal: 'Vote on proposals',
      invite: 'Invite new members',
      createChannel: 'Create a new channel',
      editChannel: 'Edit an existing channel',
      createFundraisingPost: 'Create a post with fundraising rights',
      canPinPost: 'Pin posts to top of channel',
      canCreateEvent: 'Create an event',
      removeUser: 'Remove a user from a channel or community',
    }

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
      canCreateEvent: true,
      removeUser: false,
    }

    const adminRights = {
      ...rights,
      withdrawal: true,
      removeUser: true,
    }

    const memberRole = {
      title: 'member',
      price: 0,
      rights,
      tier: 3,
    }

    const engineerRole = {
      title: 'engineer',
      price: 0,
      rights,
      tier: 2,
    }

    const adminRole = {
      title: 'admin',
      price: 0,
      rights: adminRights,
      tier: 1,
    }

    // test query: .where('name','==','Secret Test Partayyy 🕺')
    db.collection('communities').get().then((snap) => {
        snap.forEach((doc) => {

          console.log('Updating Community ', doc.id);
          db.collection('communities').doc(doc.id).collection('roles').doc('rights').set({...rights, description});

          const roleCollection = db.collection('communities').doc(doc.id).collection('roles').doc('each').collection('role');
          
          roleCollection.where('title','==','member').get().then((roleSnap) => {
            if(roleSnap?.docs?.[0]?.id) {
              console.log('member exists, updating');
              roleCollection.doc(roleSnap.docs[0].id).update({rights: rights});
            } else {
              console.log('no member role, creating');
              roleCollection.add(memberRole);
            }            
          });

          roleCollection.where('title','==','admin').get().then((roleSnap) => {
            if(roleSnap?.docs?.[0]?.id) {
              console.log('admin exists, updating');
              roleCollection.doc(roleSnap.docs[0].id).update({rights: adminRights});
            } else {
              console.log('no admin role, creating');
              roleCollection.add(adminRole);
            }            
          });

          roleCollection.where('title','==','engineer').get().then((roleSnap) => {
            if(roleSnap?.docs?.[0]?.id) {
              console.log('engineer exists, updating');
              roleCollection.doc(roleSnap.docs[0].id).update({rights: rights});
            } else {
              console.log('no engineer role, NOT ADDING');
            }            
          });

        });
    });
}
