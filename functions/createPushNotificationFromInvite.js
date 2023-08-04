const { db, admin, functions } = require("./admin");
const { getResizedImageUrl } = require("./activity/helpers");
const { PERSONA_DEFAULT_PROFILE_URL } = require("./activity/constants");

const getEntityProfileImgUrl = (entity) => {
  return getResizedImageUrl({
    origUrl: entity.get("profileImgUrl") || PERSONA_DEFAULT_PROFILE_URL,
    width: 400,
    height: 400,
    // roundCrop: true,
  });
};

exports.createPushNotificationFromInvite = functions.firestore
  .document("invites/{inviteID}")
  .onCreate(async (inviteSnapshot, context) => {
    if (
      inviteSnapshot.get("isNewUserInvite") ||
      inviteSnapshot.get("deleted") ||
      inviteSnapshot.get("accepted") ||
      inviteSnapshot.get("declined")
    ) {
      return;
    }

    const invitedByUserID = inviteSnapshot.get("invitedByUserID");
    const userToNotifyID = inviteSnapshot.get("invitedUserID");
    const destination = inviteSnapshot.get("destination");
    const entityRef = destination?.ref;

    const userToNotify = await db.collection("users").doc(userToNotifyID).get();
    const deviceTokensDoc = await userToNotify.ref
      .collection("tokens")
      .doc(userToNotifyID)
      .get();
    let deviceTokens;
    if (
      deviceTokensDoc.exists &&
      (deviceTokensDoc.get("deviceTokens") || []).length > 0
    ) {
      deviceTokens = [...deviceTokensDoc.get("deviceTokens")];
    } else {
      deviceTokens = [...(invitedByUser.get("deviceTokens") || [])];
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      functions.logger.log(
        `No device tokens found for ${userToNotifyID}, returning early`,
      );
      return;
    }

    const invitedByUser = await db
      .collection("users")
      .doc(invitedByUserID)
      .get();

    const entity = await entityRef.get();
    const body = `${invitedByUser.get(
      "userName",
    )} invited you to join ${entity.get("name")}`;
    const imageUrl = getEntityProfileImgUrl(entity);

    const message = {
      tokens: deviceTokens,
      notification: {
        body: body,
      },
      data: {
        inviteId: context.params.inviteID,
        body: body,
      },
      android: {
        notification: {},
      },
      apns: {
        payload: {
          aps: {
            alert: {
              body,
            },
          },
        },
      },
    };

    if (imageUrl) {
      // TODO: Add image for Android
      message.apns.payload.aps.mutableContent = true;
      message.apns.fcmOptions = {
        imageUrl,
      };
      message.android.notification.imageUrl = imageUrl;
    }

    try {
      const response = await admin.messaging().sendMulticast(message);
      if (response.successCount > 0) {
        functions.logger.log(
          `Push notification successfully sent for user ${userToNotifyID} and invite ${inviteSnapshot.id}`,
        );
        await inviteSnapshot.ref.update({
          pushNotificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        functions.logger.warn(
          `FCM call successful but push notification did not send for user ${userToNotifyID} and event ${inviteSnapshot.id}`,
        );
        const firstErrorMessage = response.responses[0].error;
        functions.logger.warn(
          `Here is the first error message: ${firstErrorMessage}`,
        );
      }
    } catch (err) {
      functions.logger.error(
        `Error sending push notification for user ${userToNotifyID} and event ${inviteSnapshot.id}: `,
        err,
      );
      functions.logger.error("Message data: ", message);
    }
  });
