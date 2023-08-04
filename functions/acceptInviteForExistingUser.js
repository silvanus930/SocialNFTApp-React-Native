const { admin, db, functions } = require("./admin");

exports.acceptInviteForExistingUser = functions.https.onCall(async (data, context) => {

  try {

    const userID = data.userID;
    const inviteID = data.inviteID;

    functions.logger.log(
      "Attempting accept invite for user:",
      "userID: " + userID,
      "inviteID: " + inviteID,
    );

    const MEMBER_ROLE = (await db
        .collection("roles")
        .doc('each')
        .collection('role')
        .doc('member')
        .get())?.data();

    const inviteRef = db
        .collection("invites")
        .doc(inviteID);

    const invite = (await 
        inviteRef
        .get())?.data();

    if(!MEMBER_ROLE) {
      return {
        result: "db-connection-error",
      }
    }

    if(!inviteID) {
      return {
        result: "invite-missing",
      }
    }

    if(!invite) {
      return {
        result: "invite-missing",
      }
    }

    const batch = admin.firestore().batch();

    // Add all users as a member to the persona test community
    const personaTestCommunityRef = db.collection("communities").doc("persona");
    const userRef = db.collection("users").doc(userID);

    batch.update(personaTestCommunityRef, {
      members: admin.firestore.FieldValue.arrayUnion(userID),
      ['userRoles.member']: admin.firestore.FieldValue.arrayUnion(userID),
    });
    batch.update(userRef, {
      roles: admin.firestore.FieldValue.arrayUnion({ref: personaTestCommunityRef, ...MEMBER_ROLE}),
    });

    
    const destination = invite.destination;

    const entityRef = (typeof destination.ref === 'string') ?
        db.doc(destination.ref)
        : destination.ref;
    const updateObj = {};            
    const role = destination?.role || {};
    const isMember = role?.title === 'member';

    functions.logger.log(
      "entityRef:" + entityRef,
    );

    // PERSONA CHANNEL FLOW:
    if (destination.type === "project") {
      // Add user to the persona (TODO: phase out)
      updateObj.authors = admin.firestore.FieldValue.arrayUnion(userID);
      
      // Add user to parent community
      const project = await entityRef.get();
      const communityID = project.get("communityID");
      const communityRef = db
        .collection("communities")
        .doc(communityID);

      // (TODO: phase out):
      batch.update(communityRef, {
        members: admin.firestore.FieldValue.arrayUnion(userID),
      });

      // Add roles
      if(role) {
        // add persona role
        batch.update(userRef, {
            roles: admin.firestore.FieldValue.arrayUnion({ref: entityRef, ...role}),
        });
        batch.update(entityRef, 
          {['userRoles.' + role.title]: admin.firestore.FieldValue.arrayUnion(userID)
        });

        // add default member role
        if(!isMember) {
          batch.update(userRef, {roles: admin.firestore.FieldValue.arrayUnion({ref: entityRef, ...MEMBER_ROLE})});
          batch.update(entityRef, {['userRoles.member']: admin.firestore.FieldValue.arrayUnion(userID)});
        }

        // add parent community role AS MEMBER
        batch.update(userRef, {
            roles: admin.firestore.FieldValue.arrayUnion({ref: communityRef, ...MEMBER_ROLE}),
        });
        batch.update(communityRef, {['userRoles.member']: admin.firestore.FieldValue.arrayUnion(userID)}); 
      }
     
    // COMMUNITY FLOW:
    } else {         
      if(role) {
        // add community role
        batch.update(userRef, {
            roles: admin.firestore.FieldValue.arrayUnion({ref: entityRef, ...role}),
        });
        batch.update(entityRef, {['userRoles.' + role.title]: admin.firestore.FieldValue.arrayUnion(userID)});

        // add default member role
        if(!isMember) {
          batch.update(userRef, {
            roles: admin.firestore.FieldValue.arrayUnion({ref: entityRef, ...MEMBER_ROLE}),
          });
          batch.update(entityRef, {
            ['userRoles.member']: admin.firestore.FieldValue.arrayUnion(userID),
          });
        }
      }

      // (TODO: phase out):
      updateObj.members = admin.firestore.FieldValue.arrayUnion(userID);
    }
    batch.update(entityRef, updateObj);
    batch.update(inviteRef, {
      accepted: true,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    
    return {
      result: "success",
    };
  } catch (err) {
    functions.logger.error("ERROR: ", err.toString());
    return {
      result: "error",
      data: err.toString(),
    };
  }
});
