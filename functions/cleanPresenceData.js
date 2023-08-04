const { admin, functions, rtdb } = require("./admin");

exports.cleanPresenceData = functions
  .runWith({ timeoutSeconds: 60 })
  .pubsub.schedule("0 */12 * * *")
  .onRun(async (context) => {
    const usersOnlineStatusRef = rtdb.ref("usersOnlineStatus");
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
                functions.logger.log(
                  `Bad data - Removing /usersOnlineStatus/${userID}/connections/${connectionID}`,
                );
                return await rtdb
                  .ref(
                    `/usersOnlineStatus/${userID}/connections/${connectionID}`,
                  )
                  .remove();
              } else if ({}.hasOwnProperty.call(connection, "dev")) {
                functions.logger.log(
                  `Dev connection - Removing /usersOnlineStatus/${userID}/connections/${connectionID}`,
                );
                return await rtdb
                  .ref(
                    `/usersOnlineStatus/${userID}/connections/${connectionID}`,
                  )
                  .remove();
              } else if (
                {}.hasOwnProperty.call(connection, "client") &&
                {}.hasOwnProperty.call(connection, "createdAt") &&
                {}.hasOwnProperty.call(connection, "active") &&
                (lastOnlineAt > connection.createdAt ||
                  connection.client === "web")
              ) {
                functions.logger.log(
                  `Zombie connection - Removing /usersOnlineStatus/${userID}/connections/${connectionID}`,
                );
                return await rtdb
                  .ref(
                    `/usersOnlineStatus/${userID}/connections/${connectionID}`,
                  )
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
    const roomPresenceRef = rtdb.ref("/roomPresence");
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
                  functions.logger.log(
                    `User in room with no connections - removing user record in room /roomPresence/${containerCollection}/${containerID}/${roomType}/${roomID}/${userID}`,
                  );
                  return await rtdb
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
                    functions.logger.log(
                      `roomPresence zombie connection - removing /roomPresence/${containerCollection}/${containerID}/${roomType}/${roomID}/${userID}/connections/${connectionID}`,
                    );
                    await rtdb
                      .ref(
                        `/roomPresence/${containerCollection}/${containerID}/${roomType}/${roomID}/${userID}/connections/${connectionID}`,
                      )
                      .remove();
                    await rtdb
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
    const usersPresenceRef = rtdb.ref("/usersPresence");
    const usersPresence = await usersPresenceRef.get();
    const usersPresenceData = usersPresence.val();
    Object.keys(usersPresenceData).map((userID) => {
      const connections = usersPresenceData[userID].connections;
      if (connections) {
        Object.keys(connections).map(async (connectionID) => {
          if (!activeConnections[connectionID]) {
            functions.logger.log(
              `usersPresence zombie connection - removing /usersPresence/${userID}/connections/${connectionID}`,
            );
            await rtdb
              .ref(`/usersPresence/${userID}/connections/${connectionID}`)
              .remove();
          }
        });
      }
    });
  });
