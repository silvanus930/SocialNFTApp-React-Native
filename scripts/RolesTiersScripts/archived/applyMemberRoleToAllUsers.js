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

  // Then for each of those users, add to the users roles array with member role, roleRef to the community, and rights
  
  // Iterate over each persona, and iterate over authors array and add each user to memberRoles map
  // Then for each of those users, add to the users roles array

    const old_rights = {
      readChatPost: true,
      writePost: true,
      writeChat: true,
      withdrawal: false,
      createProposal: true,
      voteProposal: true,
      invite: true,      
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
    }

    const memberRole = {
      title: 'member',
      price: 0,
      rights,
    }

    const oldMemberRole = {
      title: 'member',
      price: 0,
      rights: old_rights,
    }

    // Iterate over each community

    console.log('iterating over each community');
    db.collection('communities').get().then((snap) => {
        snap.forEach((community) => {

          console.log('getting community: ', community.id);
          db.collection('communities').doc(community.id).get().then((communityDoc) => {

            if(communityDoc.exists) {
                  const rolePath = db
                    .collection('communities')
                    .doc(communityDoc.id)
                    .collection('roles')
                    .doc('each')
                    .collection('role');

                    rolePath.get().then((roleSnap) => {
                      const roleRef = rolePath.doc(roleSnap.docs[0].id);

                      console.log('roleRef is: ', roleRef);
                      console.log('iterating over members');

                      // iterate over members array
                      const members = communityDoc.data().members;
                      if(members) {
                            members.forEach(memberID => {

                            // Add user + role to memberRoles                         
                            // console.log('with data: ', {...memberRole, roleRef});
                            db.collection('users').doc(memberID).get().then((userDoc)=> {
                              if(userDoc.exists) {

                                console.log(`adding to user collection ${memberID} roles`);

                                // first remove
                                db.collection('users').doc(memberID).update({roles: admin.firestore.FieldValue.arrayRemove({...oldMemberRole, roleRef, ref: db.collection('communities').doc(communityDoc.id)})});  

                                // then add (with updated rights)
                                db.collection('users').doc(memberID).update({roles: admin.firestore.FieldValue.arrayUnion({...memberRole, roleRef, ref: db.collection('communities').doc(communityDoc.id)})});  


                                // console.log(`adding to community/persona collection memberRoles for ${memberID}`);   
                                // for now, remove memberRoles from communities
                                db.collection('communities').doc(communityDoc.id).update({
                                  ['memberRoles']: admin.firestore.FieldValue.delete()
                                });
                                
                                // db.collection('communities').doc(communityDoc.id).update({
                                //   [`memberRoles.${memberID}`]: admin.firestore.FieldValue.arrayUnion({...memberRole, roleRef}),
                                // });
                              }                        
                            });
                        });  
                      }
                                
              });
            }              
        });
      });
    });

    // NOW THE SAME FOR PERSONAS:
    // Iterate over each persona
    console.log('iterating over each persona');
    db.collection('personas').where('deleted','==',false).get().then((snap) => {
        snap.forEach((persona) => {
          console.log('getting persona: ', persona.id);
          db.collection('personas').doc(String(persona.id)).get().then((personaDoc) => {

            if(personaDoc.exists) {
              if(Boolean(personaDoc.data().communityID)) {
                console.log('community ID exists');
                const rolePath = db
                  .collection('communities')
                  .doc(personaDoc.data().communityID)
                  .collection('roles')
                  .doc('each')
                  .collection('role');

                  rolePath.get().then((roleSnap) => {
                    const roleRef = rolePath.doc(roleSnap.docs[0].id);

                    console.log('roleRef is: ', roleRef);
                    console.log('iterating over members');

                    // iterate over AUTHORS array (authors is to personas as members is to communities)
                    const members = personaDoc.data().authors
                    if(members) {
                        members.forEach(memberID => {
                        // console.log(`user role data`, {...memberRole, roleRef, ref: db.collection('personas').doc(personaDoc.id)});
                        // Now add this role to the roles array in users collection
                        db.collection('users').doc(memberID).get().then((userDoc) => {
                          console.log(`adding to user collection ${memberID} roles`);
                          if(userDoc.exists) {
                            
                            // Remove the old member role doc from the array
                            db.collection('users').doc(memberID).update({roles: admin.firestore.FieldValue.arrayRemove({...oldMemberRole, roleRef, ref: db.collection('personas').doc(personaDoc.id)})});  

                            // Add new member role (with updated rights) to the array
                            db.collection('users').doc(memberID).update({roles: admin.firestore.FieldValue.arrayUnion({...memberRole, roleRef, ref: db.collection('personas').doc(personaDoc.id)})});  

                            // Add user + role to memberRoles
                            // console.log(`adding to memberRoles for ${memberID}`);               
                            // console.log('with data: ', {...memberRole, roleRef});

                            // Delete memberRoles from Persona (for now...decide later if we want to pull from here)
                            db.collection('personas').doc(personaDoc.id).update({
                              ['memberRoles']: admin.firestore.FieldValue.delete()
                            });
                          } 
                        });
                      });
                    }
                    
                  }); 
              }
              
            }
                       
          });          
        });
      });
}
