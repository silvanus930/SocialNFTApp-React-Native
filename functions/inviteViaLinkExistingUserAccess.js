const { admin, db, functions, rtdb } = require("./admin");


exports.addAccessToExistingUser = functions.https.onCall(async (data, context) => {

  try {
    const userID = data.userID;
    const inviteCode = data.inviteCode;

    if(!userID){
      return {
        result: "no-user-id",
      };
    }

    const userDoc = await db
      .collection("users")
      .doc(userID)
      .get();

    if (!userDoc.exists) {
      return {
        result: "no-user-id",
      };
    }

    if (!inviteCode) {
      return {
        result: "invite-code-missing",
      };
    }

    const inviteLinkCodeDoc = await db
      .collection("linkCodes")
      .doc(inviteCode)
      .get();


    if (inviteLinkCodeDoc.exists) {
      const date1 = new Date(inviteLinkCodeDoc.get("expiryData"));
      const date2 = new Date().toISOString().split('T')[0];

      if (!inviteLinkCodeDoc.get("isValid")){
        return {
          result: "invite-code-is-not-valid",
        };
      }
      if(date1 < date2) {
          return {
            result: "invite-code-is-expired",
          };
      }
      await db.collection("linkCodes").doc(inviteCode).update(
        {
          usedBy: admin.firestore.FieldValue.arrayUnion(userID),
        }
      );

      const existingInvite = inviteLinkCodeDoc
      const batch = admin.firestore().batch();
      await Promise.all(
        existingInvite.get("destinations")?.map(async (destination, idx) => {
          const entityRef = (typeof destination.ref === 'string') ?
              db.doc(destination.ref)
              : destination.ref;
          const updateObj = {};
          const userRef = db.collection("users").doc(userID);
          const role = destination?.role || {};
          if (destination.type === "project") {
            // Add user to the persona (old system)
            updateObj.authors = admin.firestore.FieldValue.arrayUnion(userID);

            // new system, add role to memberRoles list
            // if(role) {
            //   updateObj.memberRoles = {
            //     [userID]: admin.firestore.FieldValue.arrayUnion( { ...role} ),
            //   }
            // }

            // then add user also to parent community
            const project = await entityRef.get();
            const communityID = project.get("communityID");
            const communityRef = db
              .collection("communities")
              .doc(communityID);

            // old system:
            batch.update(communityRef, {
              members: admin.firestore.FieldValue.arrayUnion(userID),
            });

            // new system:
            // to do. either here or when generating invite,
            // need to use base/lowest level community role
            // if(role) {
            //     batch.update(communityRef, {
            //         memberRoles: {
            //           [userID]: admin.firestore.FieldValue.arrayUnion( {...role} ),
            //         }
            //     });
            // }

            // Add roles to user
            if(role) {
              // add persona role
              batch.update(userRef, {
                  roles: admin.firestore.FieldValue.arrayUnion({ref: entityRef, ...role}),
              });

              // add community role
              batch.update(userRef, {
                  roles: admin.firestore.FieldValue.arrayUnion({ref: communityRef, ...role}),
              });
            }

            // Set the first community the user is added to as the default
            // community that the app opens to.
            if (idx === 0) {
              batch.update(userRef, { defaultCommunityID: communityID });
            }
          } else {
            if (idx === 0) {
              batch.update(userRef, { defaultCommunityID: destination.id });
            }

            // old system, add to community
            updateObj.members = admin.firestore.FieldValue.arrayUnion(userID);

            if(role) {
              // add persona role
              batch.update(userRef, {
                  roles: admin.firestore.FieldValue.arrayUnion({ref: entityRef, ...role}),
              });
            }
            // new system
            // if(role) {
            //   updateObj.memberRoles = {
            //     [userID]: admin.firestore.FieldValue.arrayUnion( {...role} ),
            //   }
            // }
          }
          batch.update(entityRef, updateObj);
        }),
      );
      await batch.commit();

      return {
        result: "success",
      };

    }else{
      return  {
        result: "invite-code-missing",
      };
    }
  } catch (err) {
    functions.logger.error("ERROR: ", err.toString());
    return {
      result: "error",
      data: err.toString(),
    };
  }
});
