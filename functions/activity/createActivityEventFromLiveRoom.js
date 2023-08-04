const { db, admin, functions } = require("../admin");
const { createActivityEvent, isUserInRoom } = require("./helpers");
const _ = require("lodash");

const NOTIFICATION_COOLDOWN_SECONDS = 30 * 60;

const getUserIDOrIdentityID = (userPresence) => {
  if (
    userPresence.identity !== userPresence.userID &&
    userPresence.identity.startsWith("PERSONA::")
  ) {
    return userPresence.identity.replace("PERSONA::", "");
  } else {
    return userPresence.userID;
  }
};

exports.createActivityEventFromLiveRoom = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const presence = await db.collection("intents").doc("public").get();
    const usersPresentHeartbeat = presence.get("usersPresentHeartbeat");
    const publicRooms = await db.collection("intents").doc("publicrooms").get();
    const rooms = publicRooms.get("rooms");
    const sessions = await db.collection("intents").doc("sessions").get();
    const roomsSessions = sessions.get("rooms");
    const sessionTimeout = 3 * 60;
    const activeSessionThreshold = 0.5 * 60;

    if (!rooms) {
      functions.logger.warn("Rooms is undefined or null - returning early");
      functions.logger.warn("rooms:", rooms);
      return;
    }

    await Promise.all(
      Object.entries(rooms).map(async ([roomPath, usersPresence]) => {
        if (
          roomPath ===
          "personas/JxGH2i0oku5b9xfu4m1F/posts/QxQhQ4w7xMKOEZhKrWLb"
        ) {
          return;
        }
        let lastActiveSessionStartTimestamp;
        let lastActiveSessionTimestamp;
        if ({}.hasOwnProperty.call(roomsSessions, roomPath)) {
          lastActiveSessionStartTimestamp =
            roomsSessions[roomPath].lastActiveSessionStartTimestamp;
          lastActiveSessionTimestamp =
            roomsSessions[roomPath].lastActiveSessionTimestamp;
        }

        const hasSessionReachedThreshold =
          !!lastActiveSessionStartTimestamp &&
          Math.abs(
            lastActiveSessionStartTimestamp.seconds -
              admin.firestore.Timestamp.now().seconds,
          ) >= activeSessionThreshold;

        const didSessionTimeout =
          !!lastActiveSessionTimestamp &&
          Math.abs(
            admin.firestore.Timestamp.now().seconds -
              lastActiveSessionTimestamp.seconds,
          ) >= sessionTimeout;

        const [__, personaID, ___, postID] = roomPath.split("/");

        // We generally need to check that the current presence status of the room
        // is accurate since we have stale entries. We should remove those
        const userIDs = Object.keys(usersPresence).filter(
          (k) => k !== "lastActiveSessionTimestamp",
        );

        const activeUsers = [];
        for (const userID of userIDs) {
          const userPresence = usersPresence[userID];
          if (
            isUserInRoom({
              usersPresentHeartbeat,
              userID,
              personaID,
              postID,
            })
          ) {
            userPresence.userID = userID;
            activeUsers.push(userPresence);
          }
        }

        // Don't update if we don't have enough users for a discussion
        if (activeUsers.length === 0) {
          if (
            (lastActiveSessionStartTimestamp && !hasSessionReachedThreshold) ||
            (lastActiveSessionTimestamp && didSessionTimeout)
          ) {
            // Remove room from sessions
            functions.logger.log(
              "removing session timestamp data from room",
              roomPath,
            );
            await db
              .collection("intents")
              .doc("sessions")
              .set(
                {
                  rooms: {
                    [roomPath]: {
                      lastActiveSessionStartTimestamp:
                        admin.firestore.FieldValue.delete(),
                      lastActiveSessionTimestamp:
                        admin.firestore.FieldValue.delete(),
                    },
                  },
                },
                { merge: true },
              );
          }
          return;
        }

        functions.logger.log("Found active room at ", roomPath);

        if (!lastActiveSessionStartTimestamp) {
          const updateObj = Object.assign({}, roomsSessions[roomPath] || {});
          updateObj.lastActiveSessionStartTimestamp =
            admin.firestore.Timestamp.now();
          await db
            .collection("intents")
            .doc("sessions")
            .set(
              {
                rooms: {
                  [roomPath]: updateObj,
                },
              },
              { merge: true },
            );
        }

        functions.logger.log("Logging live room analytics");

        const today = new Date();
        const postKey = today.toISOString().split("T").shift();
        await db
          .collection("analytics")
          .doc(postKey)
          .set(
            {
              liveRooms: {
                [roomPath]: {
                  users: admin.firestore.FieldValue.arrayUnion(
                    ...activeUsers.map((activeUser) => activeUser.userID),
                  ),
                },
              },
            },
            { merge: true },
          );

        if (!hasSessionReachedThreshold) {
          functions.logger.log("session hasn't reached threshold, returning");
          return;
        }

        functions.logger.log("session has reached threshold");

        const updateObj = Object.assign({}, roomsSessions[roomPath] || {});
        updateObj.lastActiveSessionTimestamp = admin.firestore.Timestamp.now();

        // Don't start setting lastActiveSessionTimestamp until the session
        // duration has exceeded the threshold. That way if it exists we know
        // there's an active session.
        await db
          .collection("intents")
          .doc("sessions")
          .set(
            {
              rooms: {
                [roomPath]: updateObj,
              },
            },
            { merge: true },
          );

        // Determine if we're eligible for a new notification
        let shouldSendNotification = false;
        if ({}.hasOwnProperty.call(roomsSessions[roomPath], "notifiedUsers")) {
          const room = roomsSessions[roomPath];
          shouldSendNotification = _.some(
            activeUsers.map((activeUser) => {
              // We're notification eligible if (1) we have a new user or
              // (2) the cooldown has elapsed AND the app is not backgrounded.
              const userIDOrIdentityID = getUserIDOrIdentityID(activeUser);
              const backgrounded =
                usersPresentHeartbeat[activeUser.userID].backgrounded || false;
              return (
                (!room.notifiedUsers[userIDOrIdentityID] ||
                  Math.abs(
                    room.notifiedUsers[userIDOrIdentityID].timestamp.seconds -
                      admin.firestore.Timestamp.now().seconds,
                  ) > NOTIFICATION_COOLDOWN_SECONDS) &&
                !backgrounded
              );
            }),
          );
        } else {
          // If we don't have this property then we're sending a notification
          // for the first time for this room.
          shouldSendNotification = true;
        }

        if (!shouldSendNotification) {
          functions.logger.log(
            "Users in room but not eligible for notification, returning early",
          );
          return;
        }

        // Create activity event. Notify coauthors, community members and users
        // who commented on the post.

        const eventType = "room_users_present";

        functions.logger.log(`Sending notification of type ${eventType}`);

        const post = await db
          .collection("personas")
          .doc(personaID)
          .collection("posts")
          .doc(postID)
          .get();

        const persona = await db.collection("personas").doc(personaID).get();

        const createdByUsers = await Promise.all(
          activeUsers.map(async (activeUser) => {
            let identity = null;
            if (
              activeUser.identity !== activeUser.userID &&
              activeUser.identity.startsWith("PERSONA::")
            ) {
              const identityPersonaID = activeUser.identity.replace(
                "PERSONA::",
                "",
              );
              identity = await db
                .collection("personas")
                .doc(identityPersonaID)
                .get();
            }
            const user = await db
              .collection("users")
              .doc(activeUser.userID)
              .get();
            return {
              id: user.id,
              ref: user.ref,
              data: user.data(),
              ...(identity &&
                identity.exists && {
                  isAnonymous: true,
                  identity: {
                    id: identity.id,
                    name: identity.get("name"),
                    profileImgUrl: identity.get("profileImgUrl") || "",
                  },
                }),
            };
          }),
        );

        const eventData = {
          created_at: admin.firestore.Timestamp.now(),
          event_type: eventType,
          ref: post.ref,
          deleted: post.get("deleted") || false,
          persona_id: personaID,
          post: {
            id: post.id,
            data: post.data(),
            ref: post.ref,
          },
          persona: {
            id: persona.id,
            data: persona.data(),
            ref: persona.ref,
          },
          createdByUsers,
        };

        let usersToNotifyArr = persona.get("authors") || [];

        if (post.get("published")) {
          const communityMemberUserIDs = persona.get("communityMembers") || [];
          usersToNotifyArr = usersToNotifyArr.concat(communityMemberUserIDs);
          if (!persona.get("private")) {
            // Notify followers of the users/personas in the room
            const userFollowersAndPersonaMembers = await Promise.all(
              createdByUsers.flatMap(async (createdByUser) => {
                let followers = [];
                let identityPersona = null;
                // For a user in persona voice notify the persona coauthors and
                // followers
                if (createdByUser.isAnonymous) {
                  identityPersona = await db
                    .collection("personas")
                    .doc(createdByUser.identity.id)
                    .get();
                  if (identityPersona.exists) {
                    followers = followers.concat(
                      identityPersona.get("authors") || [],
                    );
                    followers = followers.concat(
                      identityPersona.get("communityMembers") || [],
                    );
                  }
                }

                // Don't notify user followers if the user is in persona voice
                // for an unattributed persona
                const shouldNotifyUserFollowers =
                  !createdByUser.isAnonymous ||
                  (identityPersona !== null &&
                    !identityPersona.get("anonymous"));
                if (shouldNotifyUserFollowers) {
                  const userFollowers = await createdByUser.ref
                    .collection("live")
                    .doc("followers")
                    .get();
                  if (userFollowers.exists) {
                    followers = followers.concat(
                      userFollowers.get("profileFollow") || [],
                    );
                  }
                }
                return followers;
              }),
            );
            // FIXME: Why do we need flat here after using flatMap...
            usersToNotifyArr = usersToNotifyArr
              .concat(userFollowersAndPersonaMembers)
              .flat();

            const postComments = await post.ref.collection("comments").get();
            if (postComments.docs && postComments.docs.length > 0) {
              const postCommentUserIDs = postComments.docs.map((doc) =>
                doc.get("userID"),
              );
              usersToNotifyArr = usersToNotifyArr.concat(
                postCommentUserIDs || [],
              );
            }

            // FIXME: If an identity reacts to a post then the user who
            // made the post reaction won't be notified. This is an upstream
            // data issue.
            const postReactions = await post.ref
              .collection("live")
              .doc("endorsements")
              .get();
            if (postReactions.exists) {
              const postReactionUserIDs = Object.values(
                postReactions.get("endorsements") || [],
              ).flat();
              usersToNotifyArr = usersToNotifyArr.concat(postReactionUserIDs);
            }
          }
        }

        const usersToNotify = new Set(usersToNotifyArr);

        // Don't notify users who are already in the discussion
        activeUsers.map((activeUser) =>
          usersToNotify.delete(activeUser.userID),
        );

        functions.logger.log(`Notifying ${Array.from(usersToNotify)}`);

        await Promise.all(
          Array.from(usersToNotify).map(async (userID) => {
            // Authors always get live notifications for their posts.
            // If we've added a user who isn't an author make sure they've
            // opted into the extra live notifications.
            if (!persona.get("authors").includes(userID)) {
              const userDoc = await db.collection("users").doc(userID).get();
              if (!userDoc.get("enableExtraLiveNotifications")) {
                return;
              }
            }
            return await createActivityEvent({
              userID,
              persona,
              post,
              eventData,
            });
          }),
        );

        const justNotifiedUsers = {};
        activeUsers.forEach((activeUser) => {
          const userIDOrIdentityID = getUserIDOrIdentityID(activeUser);
          justNotifiedUsers[userIDOrIdentityID] = {
            timestamp: admin.firestore.Timestamp.now(),
          };
        });
        await db
          .collection("intents")
          .doc("sessions")
          .set(
            {
              rooms: {
                [roomPath]: {
                  notifiedUsers: justNotifiedUsers,
                },
              },
            },
            { merge: true },
          );
      }),
    );
  });
