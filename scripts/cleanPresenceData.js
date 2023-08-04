#!/usr/bin/env node

const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  apiKey: "AIzaSyA7Tl3uM_OpF6a_ozaBW9XkBzWqC9V8dZc",
  authDomain: "persona-test-8c340.firebaseapp.com",
  projectId: "persona-test-8c340",
  storageBucket: "persona-test-8c340.appspot.com",
  messagingSenderId: "162967164670",
  appId: "1:162967164670:web:0c74c8ab8556f7821df7af",
  databaseURL: "https://persona-srv-301611-default-rtdb.firebaseio.com/",
});
const db = admin.database();

(async () => {
  try {
    await main();
  } catch (e) {
    console.log(e);
  }
})();

async function main() {
  const usersOnlineStatusRef = db.ref("usersOnlineStatus");
  const usersOnlineStatus = await usersOnlineStatusRef.get();
  const usersOnlineStatusData = usersOnlineStatus.val();
  const activeConnections = {};
  await Promise.all(
    Object.keys(usersOnlineStatusData).map(async (userID) => {
      const connections = usersOnlineStatusData[userID].connections;
      const lastOnlineAt = usersOnlineStatusData[userID].lastOnlineAt;
      if (connections) {
        return await Promise.all(
          Object.keys(connections).map(async (connectionID) => {
            const connection = connections[connectionID];
            if (
              !{}.hasOwnProperty.call(connection, "client") &&
              !{}.hasOwnProperty.call(connection, "createdAt")
            ) {
              console.log(
                `Bad data - Removing /usersOnlineStatus/${userID}/connections/${connectionID}`,
              );
              return await db
                .ref(`/usersOnlineStatus/${userID}/connections/${connectionID}`)
                .remove();
            } else if ({}.hasOwnProperty.call(connection, "dev")) {
              console.log(
                `Dev connection - Removing /usersOnlineStatus/${userID}/connections/${connectionID}`,
              );
              return await db
                .ref(`/usersOnlineStatus/${userID}/connections/${connectionID}`)
                .remove();
            } else if (
              {}.hasOwnProperty.call(connection, "client") &&
              {}.hasOwnProperty.call(connection, "createdAt") &&
              {}.hasOwnProperty.call(connection, "active") &&
              (lastOnlineAt > connection.createdAt ||
                connection.client === "web")
            ) {
              console.log(
                `Zombie connection - Removing /usersOnlineStatus/${userID}/connections/${connectionID}`,
              );
              return await db
                .ref(`/usersOnlineStatus/${userID}/connections/${connectionID}`)
                .remove();
            } else {
              activeConnections[connectionID] = true;
            }
          }),
        );
      }
    }),
  );

  // Remove roomPresence entries that don't have an active connection
  const roomPresenceRef = db.ref("/roomPresence");
  const roomPresence = await roomPresenceRef.get();
  const roomPresenceData = roomPresence.val();

  Object.keys(roomPresenceData).map((containerCollection) => {
    Object.keys(roomPresenceData[containerCollection]).map((containerID) => {
      Object.keys(roomPresenceData[containerCollection][containerID]).map(
        (roomType) => {
          Object.keys(
            roomPresenceData[containerCollection][containerID][roomType],
          ).map((roomID) => {
            Object.keys(
              roomPresenceData[containerCollection][containerID][roomType][
                roomID
              ],
            ).map(async (userID) => {
              const userInRoom =
                roomPresenceData[containerCollection][containerID][roomType][
                  roomID
                ][userID];
              if (Object.keys(userInRoom.connections ?? []).length === 0) {
                console.log(
                  `User in room with no connections - removing user record in room /roomPresence/${containerCollection}/${containerID}/${roomType}/${roomID}/${userID}`,
                );
                return await db
                  .ref(
                    `/roomPresence/${containerCollection}/${containerID}/${roomType}/${roomID}/${userID}`,
                  )
                  .remove();
              }

              Object.keys(
                roomPresenceData[containerCollection][containerID][roomType][
                  roomID
                ][userID]["connections"] ?? [],
              ).map(async (connectionID) => {
                if (!activeConnections[connectionID]) {
                  console.log(
                    `roomPresence zombie connection - removing /roomPresence/${containerCollection}/${containerID}/${roomType}/${roomID}/${userID}/connections/${connectionID}`,
                  );
                  await db
                    .ref(
                      `/roomPresence/${containerCollection}/${containerID}/${roomType}/${roomID}/${userID}/connections/${connectionID}`,
                    )
                    .remove();
                  await db
                    .ref(
                      `/roomPresence/${containerCollection}/${containerID}/${roomType}/${roomID}/${userID}/${userID}/${connectionID}`,
                    )
                    .remove();
                }
              });
            });
          });
        },
      );
    });
  });

  // Remove usersPresence entries that don't have an active connection
  const usersPresenceRef = db.ref("/usersPresence");
  const usersPresence = await usersPresenceRef.get();
  const usersPresenceData = usersPresence.val();

  Object.keys(usersPresenceData).map((userID) => {
    const connections = usersPresenceData[userID].connections;
    if (connections) {
      Object.keys(connections).map(async (connectionID) => {
        if (!activeConnections[connectionID]) {
          console.log(
            `usersPresence zombie connection - removing /usersPresence/${userID}/connections/${connectionID}`,
          );
          await db
            .ref(`/usersPresence/${userID}/connections/${connectionID}`)
            .remove();
        }
      });
    }
  });
}
