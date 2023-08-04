const { admin, db, functions, rtdb } = require("./admin");

exports.finishUserSignupInviteViaLinkSupport = functions.https.onCall(async (data, context) => {

  try {
    const userID = data.userID;
    const email = data.email;
    const password = data.password;
    const inviteCode = data.inviteCode;
    const username = data.username;
    const phoneNumber = data.phoneNumber;

    const MEMBER_RIGHTS = {
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
    };

    const MEMBER_ROLE = {
      title: 'member',
      price: 0,
      rights: MEMBER_RIGHTS,
      tier: 3,
    };

    if (!email) {
      return {
        result: "email-missing",
      };
    }

    if (!username) {
      return {
        result: "username-missing",
      };
    }

    if (!password) {
      return {
        result: "password-missing",
      };
    }

    if (!phoneNumber) {
      return {
        result: "phone-number-missing",
      };
    }

    functions.logger.log(
      "Attempting create user:",
      "email: " + email,
      "username: " + username,
      "invitecode: " + inviteCode,
    );

    // const inviteCodeDoc = await db
    //   .collection("invitecodes")
    //   .doc(inviteCode)
    //   .get();

    let inviteLinkCodeDoc;
    if(inviteCode) {
      functions.logger.log('looking for linkCodes');
      inviteLinkCodeDoc = await db
        .collection("linkCodes")
        .doc(inviteCode)
        .get();
    }

    if (inviteCode && !inviteLinkCodeDoc?.exists) {
      return {
        result: "invite-code-not-found",
      };
    }

    // if (inviteCodeDoc.exists && inviteCodeDoc.get("used")) {
    //   return {
    //     result: "invite-code-used",
    //   };
    // }

    if (inviteLinkCodeDoc?.exists) {
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
    }

    const usersQuery = await db
      .collection("users")
      .where("userName", "==", username)
      .get();


    if (usersQuery.size > 0) {
      return {
        result: "username-taken",
      };
    } else {
      const testUserRegex = new RegExp("test@persona.*\\.com");
      const isHuman = !testUserRegex.test(email);

      if (isHuman) {
        if(inviteLinkCodeDoc?.exists){
          await db.collection("linkCodes").doc(inviteCode).update(
            {
              usedBy: admin.firestore.FieldValue.arrayUnion(userID),
            }
          );
        }
      }

      const userData = {
        id: userID,
        userName: username,
        email,
        bio: "",
        personas: [],
        enableExtraLiveNotifications: true,
        human: isHuman,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        profileImgUrl: "",
        isPhoneNumberLinked: true,
        phoneNumber: phoneNumber,
      };

      await admin.firestore().collection("users").doc(userID).set(userData);
      await rtdb.ref(`/users/${userID}`).set(true);

      functions.logger.log("User successfully created");

      await db
        .collection("communities")
        .doc("persona")
        .update({
          members: admin.firestore.FieldValue.arrayUnion(userID),
        });

      // Check that user doesn't already exist
      let userRecord = null;
      try {
        userRecord = await admin.auth().getUser(userID);
      } catch (err) {
        return {
          result: "error",
          code: err?.code,
        };
      }

      await admin.auth().updateUser(userID, {
        email: email,
        password: password,
      });

      // Check if there's an existing invite and add user to communities
      // projects
      // const existingInvites = await db
      //   .collection("invites")
      //   .where("inviteCode", "==", inviteCode)
      //   .get();

      let existingEmailInvites;
      let existingPhoneInvites;

      if(email) {
        existingEmailInvites = await db
          .collection("invites")
          .where("email", "==", email.toLowerCase())
          .get();
      }

      if(phoneNumber) {
        existingPhoneInvites = await db
          .collection("invites")
          .where("phoneNumber", "==", phoneNumber)
          .get();
      }

      // or if the invite link code exist then add user to to communities
      // projects
      let existingLinkCode;
      if(inviteCode) {
        existingLinkCode = await db
          .collection("linkCodes")
          .doc(inviteCode)
          .get();  
      }
      
      if (existingEmailInvites?.docs?.length > 0 || existingPhoneInvites?.docs?.length > 0 || existingLinkCode?.exists) {

        let existingInvite;
        if (existingLinkCode?.exists) {
          existingInvite = existingLinkCode;
        } else if(existingEmailInvites?.docs?.length > 0) {
          existingInvite = existingEmailInvites.docs[0];
        } else if(existingPhoneInvites?.docs?.length > 0) {
          existingInvite = existingPhoneInvites.docs[0];
        }

        // this should never hit...
        if(!existingInvite) {
          return {
            result: "invite-code-not-found",
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

        await Promise.all(
          existingInvite.get("destinations")?.map(async (destination, idx) => {
            const entityRef = (typeof destination.ref === 'string') ?
                db.doc(destination.ref)
                : destination.ref;
            const updateObj = {};            
            const role = destination?.role || {};
            const isMember = role?.title === 'member';

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

              // Set the first community the user is added to as the default
              // community that the app opens to.
              if (idx === 0) {
                batch.update(userRef, { defaultCommunityID: communityID });
              }

            // COMMUNITY FLOW:
            } else {
              if (idx === 0) {
                batch.update(userRef, { defaultCommunityID: destination.id });
              }

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
          }),
        );
        await batch.commit();
        if(!existingLinkCode?.exists){
          await existingInvite.ref.update({
            accepted: true,
            acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        return {
          result: "success",
        };
      } else {
        // cant find invite code
        return {
          result: "invite-code-not-found",
        }
      }      
    }
  } catch (err) {
    functions.logger.error("ERROR: ", err.toString());
    return {
      result: "error",
      data: err.toString(),
    };
  }
});
