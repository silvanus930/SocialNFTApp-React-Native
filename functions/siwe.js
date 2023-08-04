const { generateNonce, SiweMessage } = require("siwe");

const { admin, db, functions } = require("./admin");

exports.siweNonce = functions.https.onCall(async (data, context) => {
  try {
    if (!data.address) {
      return {
        result: "address-missing",
      };
    }
    data.address = data.address.toLowerCase()

    const nonce = generateNonce();

    await db
      .collection("siweNonces")
      .doc(data.address)
      .set({ nonce }, { merge: true });

    return {
      result: "success",
      data: { nonce },
    };
  } catch (err) {
    functions.logger.error("ERROR: ", err.toString());
    return {
      result: "error",
      data: err.toString(),
    };
  }
});

exports.siweVerify = functions.https.onCall(async (data, context) => {
  try {
    if (!data.address) {
      return {
        result: "address-missing",
      };
    }
    data.address = data.address.toLowerCase()

    if (!data.message) {
      return {
        result: "message-missing",
      };
    }
    if (!data.signature) {
      return {
        result: "signature-missing",
      };
    }

    let message = new SiweMessage(data.message);

    const fields = await message.validate(data.signature);

    const nonceDoc = await db.collection("siweNonces").doc(data.address).get();

    if (!nonceDoc.exists) {
      return {
        result: "nonce-not-found",
      };
    }

    const nonce = nonceDoc.get("nonce");

    if (fields.nonce !== nonce) {
      return {
        result: "nonce-invalid",
      };
    }

    // delete or overwrite with new nonce?
    await db.collection("siweNonces").doc(data.address).delete();

    // create user here or elsewhere?
    const userRef = db.collection("users").doc(data.address);
    const user = await userRef.get();
    if (!user.exists) {

      // from createUser.js
      const userData = {
        id: data.address,
        // TODO: can these fields be null?
        userName: data.address,
        email: data.address,
        bio: "",
        personas: [],
        enableExtraLiveNotifications: true,
        human: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        wallets: [data.address],
      };

      await userRef.set(userData);
    }

    const firebaseToken = await admin.auth().createCustomToken(data.address);
    return {
      result: "success",
      data: { token: firebaseToken },
    };
  } catch (err) {
    functions.logger.error("ERROR: ", err.toString());
    return {
      result: "error",
      data: err.toString(),
    };
  }
});
