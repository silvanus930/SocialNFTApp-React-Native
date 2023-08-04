const { db, admin, functions } = require("./admin");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.inviteNewUserByEmail = functions
  .runWith({ secrets: ["SENDGRID_API_KEY"] })
  .https.onCall(async (data, context) => {
    try {
      const { email, invitedByUserID, destination, inviterUserName, message } = data;
      // TODO: Auth against user token
      
      // Check that user doesn't already exist
      let userRecord = null;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
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

      const entityRef = await db
        .collection(collectionName)
        .doc(destination.id);

      let inviteCode;
      const testFlightBetaLink = "https://testflight.apple.com/join/XxFGOuxf";

      // If the user has already been invited to Persona add the project/community
      // they're invited to their destinations list
      const existingInvites = await db
        .collection("invites")
        .where("email", "==", email)
        .get();

      if (existingInvites.docs.length > 0) {
        const inviteDoc = existingInvites.docs[0];
        inviteCode = inviteDoc.data().inviteCode;
          await inviteDoc.ref.update({
            destinations: admin.firestore.FieldValue.arrayUnion({
              ...destination,
              ref: entityRef,
            }),
          });
      } else {
        inviteCode = Array.from(Array(5), () =>
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
          email,
          destinations: [
            {
              ...destination,
              ref: entityRef,
            },
          ],
          accepted: false,
          deleted: false,
        });
      }
        
      const htmlResponse = `        
        <div style="background-color:#1F2937;height:80px;width:500px;margin:auto;">
          <img
            src="https://persona-content-store.s3.us-east-2.amazonaws.com/J7VLnz9mBI9DN21NEwOn.png"
            style="width:140px;height:50px;"
            alt="Logo"
          />
        </div>
        <div style="width:500px;margin:auto;">
          <div style="padding:10px; font-size: 16px; line-height:24px; text-align: left; font-family:Segoe UI,Roboto,Helvetica Neue,Ubuntu,sans-serif">
            You have been invited to join <b>${destination.name}</b> on Persona!
          </div>
          <div style="padding:10px; font-size: 16px; line-height:24px; text-align: left; font-family:Segoe UI,Roboto,Helvetica Neue,Ubuntu,sans-serif">
            Get the <a href='${testFlightBetaLink}'>iOS</a> or <a href='https://play.google.com/store/apps/details?id=com.persona.personaalpha'>Android</a> app and use invite code <b>${inviteCode}</b>.
          </div>        
          <div>
            <p style="font-size:12px;padding:10px">
              Persona is a social network for communities that want to build together.
            </p>
          </div>
        </div>
      `;

      const entityName = destination.name;
      // Send email
      await sgMail.send({
        to: email,
        from: {
          name: "Persona",
          email: "notifications@persona.nyc",
        },
        subject: `You have been invited to join ${entityName} on Persona`,
        html: htmlResponse,
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
