const { db, admin, functions } = require("./admin");
const twilio = require("twilio");
const COUNTRIES_DENYLIST = ["IR", "RU", "CU", "NK", "SY"];

exports.inviteNewUserByPhone = functions
  .runWith({ secrets: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"] })
  .https.onCall(async (data, context) => {
    try {
      const { phoneNumber, invitedByUserID, destination } = data;
      // TODO: Auth against user token

      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );

      try {
        const twilioResponse = await twilioClient.lookups.v1
          .phoneNumbers(data.phoneNumber)
          .fetch();

        if (COUNTRIES_DENYLIST.includes(twilioResponse?.countryCode)) {
          return {
            result: "error",
            code: "invalid-phone-number",
          };
        }
      } catch (err) {
        if (err.code === 20404) {
          return {
            result: "error",
            code: "invalid-phone-number",
          };
        } else {
          return {
            result: "error",
            code: "unknown-error",
            error: err.toString(),
          };
        }
      }

      // Check that user doesn't already exist
      let userRecord = null;
      try {
        userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
      } catch (err) {
        if (err?.code !== "auth/user-not-found") {
          return {
            result: "error",
            code: err?.code,
          };
        }
      }

      if (userRecord) {
        return {
          result: "error",
          code: "user-already-exists",
        };
      }

      const collectionName =
        destination.type === "project" ? "personas" : "communities";

      const entityRef = db
        .collection(collectionName)
        .doc(destination.id);

      let inviteBody;
      const testFlightBetaLink = "https://testflight.apple.com/join/XxFGOuxf";

      // If the user has already been invited to Persona add the project/community
      // they're invited to their destinations list
      const existingInvites = await db
        .collection("invites")
        .where("phoneNumber", "==", phoneNumber)
        .get();

      if (existingInvites.docs.length > 0) {
        const inviteDoc = existingInvites.docs[0];
        // if (
        //   !inviteDoc
        //     .get("destinations")
        //     .map((dest) => dest.id)
        //     .includes(destination.id)
        // ) {
          await inviteDoc.ref.update({
            destinations: admin.firestore.FieldValue.arrayUnion({
              ...destination,
              ref: entityRef,
            }),
          });
          inviteBody = `You have been invited to join ${
            destination.name
          } on Persona! Your invite code is ${inviteDoc.get("inviteCode")}.

Install the app and sign up: ${testFlightBetaLink}
        `.trim();
        } 
        // else {
        //   return {
        //     result: "error",
        //     code: "user-already-invited",
        //   };
        // }
      // } 
      else {
        const inviteCode = Array.from(Array(5), () =>
          Math.floor(Math.random() * 36).toString(36),
        )
          .join("")
          .toUpperCase();

        await db.collection("invitecodes").doc(inviteCode).set({});
        await db.collection("invites").add({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          inviteCode,
          isNewUserInvite: true,
          invitedByUserID: invitedByUserID,
          phoneNumber,
          destinations: [
            {
              ...destination,
              ref: entityRef,
            },
          ],
          accepted: false,
          deleted: false,
        });
        inviteBody =
          `You have been invited to join ${destination.name} on Persona! Your invite code is ${inviteCode}.

Install the app and sign up: ${testFlightBetaLink}
      `.trim();
      }

      await db.collection("smsMessages").add({
        to: phoneNumber,
        body: inviteBody,
      });
      return {
        result: "success",
      };
    } catch (err) {
      return {
        result: "error",
        code: "unknown-error",
        error: err.toString(),
      };
    }
  });
