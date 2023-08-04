const { admin, functions } = require("../admin");
const { createActivityEvent } = require("./helpers");
const { STAFF_USERS } = require("./constants");

exports.createStaffActivityEventForNewUser = functions.firestore
  .document("users/{userID}")
  .onCreate(async (userSnapshot, context) => {
    if (!userSnapshot.get("human")) {
      functions.logger.log(
        `User is not human, skipping onboarding: ${
          userSnapshot.id
        } ${userSnapshot.get("userName")}`,
      );
      return;
    }

    const eventData = {
      event_type: "user_signup",
      createdAt:
        userSnapshot.get("createdAt") ||
        admin.firestore.FieldValue.serverTimestamp(),
      userName: userSnapshot.get("userName"),
      userID: userSnapshot.id,
    };
    await Promise.all(
      Object.values(STAFF_USERS).map(async (userID) => {
        await createActivityEvent({ userID, eventData });
      }),
    );
  });
