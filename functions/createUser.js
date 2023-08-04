const { admin, db, functions, rtdb } = require("./admin");
const twilio = require("twilio");
const COUNTRIES_DENYLIST = ["IR", "RU", "CU", "NK", "SY"];

// deprecated
exports.finishUserSignup = functions.https.onCall(async (data, context) => {
  try {
    const userID = data.userID;
    const email = data.email;
    const password = data.password;
    const inviteCode = data.inviteCode;
    const username = data.username;

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

    if (!inviteCode) {
      return {
        result: "invite-code-missing",
      };
    }

    functions.logger.log(
      "Attempting create user:",
      "email: " + email,
      "username: " + username,
      "invitecode: " + inviteCode,
    );

    const inviteCodeDoc = await db
      .collection("invitecodes")
      .doc(inviteCode)
      .get();

    if (!inviteCodeDoc.exists) {
      return {
        result: "invite-code-not-found",
      };
    }

    if (inviteCodeDoc.get("used")) {
      return {
        result: "invite-code-used",
      };
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
        await db.collection("invitecodes").doc(inviteCode).set(
          {
            used: true,
            editDate: admin.firestore.FieldValue.serverTimestamp(),
            userName: username,
            userID,
          },
          { merge: true },
        );
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
      const existingInvites = await db
        .collection("invites")
        .where("inviteCode", "==", inviteCode)
        .get();

      if (existingInvites.docs.length > 0) {
        const existingInvite = existingInvites.docs[0];
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

              // new system, add role to userRoles
              if(role) {
                updateObj.userRoles = {
                  [role.title]: admin.firestore.FieldValue.arrayUnion(userID),
                }
              }
                            
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
              if(role) {
                  batch.update(communityRef, {
                      userRoles: {
                        [role.title]: admin.firestore.FieldValue.arrayUnion(userID),
                      }
                  });
              }

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
              if(role) {
                updateObj.userRoles = {
                  [role.title]: admin.firestore.FieldValue.arrayUnion(userID),
                }                
              }
            }
            batch.update(entityRef, updateObj);
          }),
        );
        await batch.commit();
        await existingInvite.ref.update({
          accepted: true,
          acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        result: "success",
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

// is this used?
// looks like it's deprecated
// -ken
exports.createUserWithPhoneNumber = functions
  .runWith({ secrets: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"] })
  .https.onCall(async (data, context) => {
    try {
      const email = data.email;
      const inviteCode = data.inviteCode;
      const username = data.username;
      const phoneNumber = data.phoneNumber;

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

      if (!inviteCode) {
        return {
          result: "invite-code-missing",
        };
      }

      if (!phoneNumber) {
        return {
          result: "phone-number-missing",
        };
      }

      const inviteCodeDoc = await db
        .collection("invitecodes")
        .doc(inviteCode)
        .get();

      if (!inviteCodeDoc.exists) {
        return {
          result: "invite-code-not-found",
        };
      }

      if (inviteCodeDoc.get("used")) {
        return {
          result: "invite-code-used",
        };
      }

      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );

      try {
        const twilioResponse = await twilioClient.lookups.v1
          .phoneNumbers(phoneNumber)
          .fetch();

        if (COUNTRIES_DENYLIST.includes(twilioResponse?.countryCode)) {
          return {
            result: "invalid-phone-number",
          };
        }
      } catch (err) {
        if (err.code === 20404) {
          return {
            result: "invalid-phone-number",
          };
        } else {
          return {
            result: "unknown-error",
            error: err.toString(),
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
        const user = await admin.auth().createUser({
          email,
          phoneNumber,
        });

        const testUserRegex = new RegExp("test@persona.*\\.com");
        const isHuman = !testUserRegex.test(email);

        if (isHuman) {
          await db.collection("invitecodes").doc(inviteCode).set(
            {
              used: true,
              editDate: admin.firestore.FieldValue.serverTimestamp(),
              userName: username,
              userID: user.uid,
            },
            { merge: true },
          );
        }

        const userData = {
          id: user.uid,
          userName: username,
          email,
          bio: "",
          personas: [],
          enableExtraLiveNotifications: true,
          human: isHuman,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          profileImgUrl: "",
        };
        await admin.firestore().collection("users").doc(user.uid).set(userData);

        // Check if there's an existing invite and add user to communities
        // projects
        const existingInvites = await db
          .collection("invites")
          .where("phoneNumber", "==", phoneNumber)
          .get();

        if (existingInvites.docs.length > 0) {
          const existingInvite = existingInvites.docs[0];
          const batch = admin.firestore().batch();
          await Promise.all(
            existingInvite.get("destinations")?.map(async (destination) => {
              const entityRef = destination.ref;
              const updateObj = {};
              if (destination.type === "project") {
                // Adds user to community the project is also part of
                updateObj.authors = admin.firestore.FieldValue.arrayUnion(
                  user.uid,
                );
                const project = await entityRef.get();
                const communityID = project.get("communityID");
                const communityRef = db
                  .collection("communities")
                  .doc(communityID);
                batch.update(communityRef, {
                  members: admin.firestore.FieldValue.arrayUnion(user.uid),
                });
              } else {
                updateObj.members = admin.firestore.FieldValue.arrayUnion(
                  user.uid,
                );
              }
              batch.update(entityRef, updateObj);
            }),
          );
          await batch.commit();
          await existingInvite.ref.update({
            accepted: true,
            acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        await db
          .collection("communities")
          .doc("persona")
          .update({
            members: admin.firestore.FieldValue.arrayUnion(user.uid),
          });

        functions.logger.log("User successfully created");

        return {
          result: "success",
        };
      }
    } catch (err) {
      return {
        result: "error",
        data: err.toString(),
      };
    }
  });

// is this used?
// looks like it's deprecated
// -ken
exports.createUser = functions.https.onCall(async (data, context) => {
  try {
    const email = data.email;
    const password = data.password;
    const inviteCode = data.inviteCode;
    const username = data.username;

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

    if (!inviteCode) {
      return {
        result: "invite-code-missing",
      };
    }

    if (!password) {
      return {
        result: "password-missing",
      };
    }

    functions.logger.log(
      "Attempting create user:",
      "email: " + email,
      "username: " + username,
      "invitecode: " + inviteCode,
    );

    const inviteCodeDoc = await db
      .collection("invitecodes")
      .doc(inviteCode)
      .get();

    if (!inviteCodeDoc.exists) {
      return {
        result: "invite-code-not-found",
      };
    }

    if (inviteCodeDoc.get("used")) {
      return {
        result: "invite-code-used",
      };
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
      const user = await admin.auth().createUser({
        email: email,
        password: password,
      });

      const testUserRegex = new RegExp("test@persona.*\\.com");
      const isHuman = !testUserRegex.test(email);

      if (isHuman) {
        await db.collection("invitecodes").doc(inviteCode).set(
          {
            used: true,
            editDate: admin.firestore.FieldValue.serverTimestamp(),
            userName: username,
            userID: user.uid,
          },
          { merge: true },
        );
      }

      const userData = {
        id: user.uid,
        userName: username,
        email,
        bio: "",
        personas: [],
        enableExtraLiveNotifications: true,
        human: isHuman,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await admin.firestore().collection("users").doc(user.uid).set(userData);

      functions.logger.log("User successfully created");

      await db
        .collection("communities")
        .doc("persona")
        .update({
          members: admin.firestore.FieldValue.arrayUnion(user.uid),
        });

      return {
        result: "success",
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
