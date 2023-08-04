const { db, admin, functions } = require("./admin");

exports.createOnboardingPersonaForNewUser = functions.firestore
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

    const ONBOARDING_TEMPLATE_PERSONA_ID = "mU96UmUlGUJgUwxta8I8";
    const onboardingPersona = await db
      .collection("personas")
      .doc(ONBOARDING_TEMPLATE_PERSONA_ID)
      .get();

    const onboardingPersonaData = onboardingPersona.data();
    const now = admin.firestore.Timestamp.now();
    const userName = userSnapshot.get("userName");
    const onboardingPersonaName = `${userName}'s First Persona`;

    const persona = await db.collection("personas").add({
      ...onboardingPersonaData,
      isSubPersona: false,
      parentPersonaID: "",
      publishDate: now,
      editDate: now,
      cacheDate: now,
      authors: [userSnapshot.id],
      name: onboardingPersonaName,
      isOnboarding: true,
      invitedUsers: {},
      communityMembers: [
        "94hKmQP9DEhZICfZEebFq5rl8VZ2",
        "PHobeplJLROyFlWhXPINseFVkK32",
      ], // will and raeez
    });

    // Fetch all posts
    const posts = await db
      .collection("personas")
      .doc(ONBOARDING_TEMPLATE_PERSONA_ID)
      .collection("posts")
      .where("published", "==", true)
      .where("deleted", "==", false)
      .orderBy("publishDate", "desc")
      .get();

    posts.docs.forEach(async (doc, idx) => {
      const data = doc.data();
      const creationDateSeconds = now._seconds + idx;
      const creationDate = new admin.firestore.Timestamp(
        creationDateSeconds,
        0,
      );
      await db
        .collection("personas")
        .doc(persona.id)
        .collection("posts")
        .add({
          ...data,
          editDate: creationDate,
          publishDate: creationDate,
          seen: {},
          userID: userSnapshot.id,
          userName: userName,
          isOnboardingPost: true,
          userProfileImgUrl: userSnapshot.get("profileImgUrl") || "",
          identityID: persona.id,
        });
    });
  });
