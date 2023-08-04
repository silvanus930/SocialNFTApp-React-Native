const { db } = require("../admin");

const setupUsersPresentHeartbeat = async ({ data, merge = false }) => {
  await db
    .collection("intents")
    .doc("public")
    .set(
      {
        usersPresentHeartbeat: {
          ...data,
        },
      },
      { merge },
    );
};

const setupRooms = async ({ data, merge = false }) => {
  await db.doc("intents/publicrooms").set(
    {
      rooms: {
        ...data,
      },
    },
    { merge },
  );
};

const setupSessions = async ({ data, merge = false }) => {
  await db.doc("intents/sessions").set(
    {
      rooms: {
        ...data,
      },
    },
    { merge },
  );
};

const setupPersonaData = async ({ personaID, data = {}, merge = false }) => {
  await db
    .collection("personas")
    .doc(personaID)
    .set(
      {
        ...data,
      },
      { merge },
    );
};

const setupUserData = async ({ userID, data = {}, merge = false }) => {
  await db
    .collection("users")
    .doc(userID)
    .set(
      {
        ...data,
      },
      { merge },
    );
};

const setupPostData = async ({
  personaID,
  postID,
  data = {},
  merge = false,
}) => {
  await db
    .collection("personas")
    .doc(personaID)
    .collection("posts")
    .doc(postID)
    .set(
      {
        ...data,
      },
      { merge },
    );
};

const deleteActivityData = async () => {
  const activity = await db.collectionGroup("activity").get();
  for (const doc of activity.docs) {
    await doc.ref.delete();
  }
};

const deletePersonas = async () => {
  const personas = await db.collection("personas").get();
  for (const doc of personas.docs) {
    await doc.ref.delete();
  }
};

const deleteComments = async () => {
  const comments = await db.collectionGroup("comments").get();
  for (const doc of comments.docs) {
    await doc.ref.delete();
  }
};

const deleteUsers = async () => {
  const users = await db.collection("users").get();
  for (const doc of users.docs) {
    await doc.ref.delete();
  }
};

const deleteLiveUserData = async () => {
  const liveUserData = await db.collectionGroup("live").get();
  for (const doc of liveUserData.docs) {
    await doc.ref.delete();
  }
};

const deletePresenceData = async () => {
  const presence = await db.collection("intents").doc("public").get();
  await presence.ref.delete();
};

const deletePublicRoomsData = async () => {
  const publicRooms = await db.collection("intents").doc("publicrooms").get();
  await publicRooms.ref.delete();
};

const deleteRoomsSessionsData = async () => {
  const roomsSessions = await db.collection("intents").doc("sessions").get();
  await roomsSessions.ref.delete();
};

module.exports = {
  setupUsersPresentHeartbeat,
  setupPersonaData,
  setupPostData,
  setupRooms,
  setupSessions,
  deleteActivityData,
  deletePersonas,
  deleteUsers,
  deletePresenceData,
  deletePublicRoomsData,
  deleteRoomsSessionsData,
  setupUserData,
  deleteLiveUserData,
  deleteComments,
};
