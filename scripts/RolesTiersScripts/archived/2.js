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
  console.log('running Step 2 of 3');

  // 2. Update community roles

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

          const rightsDoc = db
            .collection('communities')
            .doc(communityDoc.id)
            .collection('roles')
            .doc('rights');

          await rolePath.get().then((roleSnap) => {    
            // delete existing roles (will add back later)...
            roleSnap.forEach((roleDoc)=> {
              console.log('roleDoc ???', roleDoc.id);
              rolePath.doc(roleDoc.id).delete().then(()=>{
                console.log('deleted ', roleDoc.id);
              });
            });
          });

          // Now add admin role
          await rolePath.add(adminRole);

          // add member role and store ref
          let memberRef = rolePath.doc();
          await memberRef.set(memberRole);

          // Add canPinPost to rights document + description
          await rightsDoc.get().then((doc) => {
            rightsDoc.update({canPinPost: true, description: {...doc.data().description, canPinPost: 'Pin posts to top of channel'}});
          });

          // iterate over members array
          const members = communityDoc.data().members;
          if(members) {
                members.forEach(memberID => {

                // Add user + role to memberRoles                                                     
                db.collection('users').doc(memberID).get().then((userDoc)=> {
                  if(userDoc.exists) {

                    console.log(`adding to user collection ${memberID} roles`);                                

                    // Add new role with updated rights
                    db.collection('users').doc(memberID).update({roles: admin.firestore.FieldValue.arrayUnion({...memberRole, roleRef: memberRef, ref: db.collection('communities').doc(communityDoc.id)})});  

                    // Housekeeping. remove memberRoles from communities
                    // if needed.
                    // db.collection('communities').doc(communityDoc.id).update({
                    //   ['memberRoles']: admin.firestore.FieldValue.delete()
                    // });                                
                  }                        
                });
            });  
          }

          // For william: Adding engineer role to test. Adding engineer role to his user
          if(communityDoc.data().name === 'Secret Test Partayyy 🕺') {
            let engineerRef = rolePath.doc();
            await engineerRef.set(engineerRole);

            db.collection('users').doc('NROA3oGvn9PlSf5Eh4FnTh4c93m2').update({roles: admin.firestore.FieldValue.arrayUnion({...engineerRole, roleRef: engineerRef, ref: db.collection('communities').doc(communityDoc.id)})})
          }
        }
      });
    });
  });

  // 3. Update Persona roles to include canPinPost right, tier

//   db.collection('personas').where('deleted','==',false).where('name','==','Just a Ken underneath this 10').get().then((snap) => {
//     snap.forEach((persona) => {
//       console.log('getting persona: ', persona.id);
//       db.collection('personas').doc(String(persona.id)).get().then((personaDoc) => {
//         if(personaDoc.exists) {
//           if(Boolean(personaDoc.data().communityID)) {
//             console.log('community ID exists');
//             const rolePath = db
//               .collection('communities')
//               .doc(personaDoc.data().communityID)
//               .collection('roles')
//               .doc('each')
//               .collection('role');
// 
//             rolePath.where('title','==','member').get().then((roleSnap) => {
//               const roleRef = rolePath.doc(roleSnap.docs[0].id);
// 
//               console.log('roleRef is: ', roleRef);
//               console.log('iterating over authors');
// 
//               // iterate over AUTHORS array (authors is to personas as members is to communities)
//               const members = personaDoc.data().authors;
//               if(members) {
//                   members.forEach((memberID) => {
//                   
//                   // Now add this role to the roles array in users collection
//                   db.collection('users').doc(memberID).get().then((userDoc) => {
//                     console.log(`adding to user collection ${memberID} roles`);
//                     if(userDoc.exists) {
//                       // Add new member role (with updated rights + tiers) to the array
//                       db.collection('users').doc(memberID).update({roles: admin.firestore.FieldValue.arrayUnion({...memberRole, roleRef, ref: db.collection('personas').doc(personaDoc.id)})});  
// 
//                       // Delete memberRoles from Persona (for now...decide later if we want to pull from here)
//                       db.collection('personas').doc(personaDoc.id).update({
//                         ['memberRoles']: admin.firestore.FieldValue.delete()
//                       });
//                     } 
//                   });
//                 });
//               }
//             }); 
//           }
//         }        
//       });          
//     });
//   });
}
