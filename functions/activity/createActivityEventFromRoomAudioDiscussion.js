const { rtdb, db, admin, functions } = require("../admin");
const { createActivityEvent } = require("./helpers");

const TALKING_VOLUME_THRESHOLD = 25;
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

const getUserData = async (activeUser) => {
  let identity = null;
  if (
    activeUser.identity !== activeUser.userID &&
    activeUser.identity.startsWith("PERSONA::")
  ) {
    const identityPersonaID = activeUser.identity.replace("PERSONA::", "");
    identity = await db.collection("personas").doc(identityPersonaID).get();
  }
  const user = await db.collection("users").doc(activeUser.userID).get();
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
};

exports.createActivityEventFromRoomAudioDiscussion = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const sessions = await db.collection("intents").doc("sessions").get();
    const roomsSessions = sessions.get("rooms");

    const roomPresenceRef = rtdb.ref("/roomPresence");
    const roomsPresenceSnapshot = await roomPresenceRef.get();

    if (!roomsPresenceSnapshot.exists()) {
      functions.logger.warn(
        "roomsPresenceSnapshot doesn't exist - returning early",
      );
      functions.logger.warn("roomsPresenceSnapshot:", roomsPresenceSnapshot);
      return;
    }

    const roomsPresence = roomsPresenceSnapshot.val();

    if (!roomsPresence || !roomsPresence.personas) {
      functions.logger.warn(
        "roomsPresence is undefined or null - returning early",
      );
      functions.logger.warn("roomsPresence:", roomsPresence);
      return;
    }

    // 🚨 Tech debt: No need to do this except to match an old data format
    // that this code assumes
    const rooms = {};
    Object.entries(roomsPresence.personas).forEach(([personaID, posts]) => {
      if (posts.posts) {
        Object.entries(posts.posts).forEach(([postID, presenceEntry]) => {
          rooms[`personas/${personaID}/posts/${postID}`] = presenceEntry;
        });
      }
    });

    await Promise.all(
      Object.entries(rooms).map(async ([path, fields]) => {
        const [__, personaID, ___, postID] = path.split("/");

        // We generally need to check that the current presence status of the
        // room is accurate since we have stale entries. We should remove those
        const userIDs = Object.keys(fields).filter(
          (k) => k !== "lastActiveSessionTimestamp",
        );

        const activeUsers = [];
        const unmutedUsers = [];
        let numUnmutedUsers = 0;
        for (const userID of userIDs) {
          const userPresence = fields[userID];
          userPresence.userID = userID;
          activeUsers.push(userPresence);
          if (
            {}.hasOwnProperty.call(userPresence, "micMuted") &&
            !userPresence.micMuted
          ) {
            unmutedUsers.push(userPresence);
            numUnmutedUsers += 1;
          }
        }

        // Don't update if we don't have enough users for a discussion
        if (activeUsers.length < 2 || numUnmutedUsers === 0) {
          return;
        }

        functions.logger.log("Found active room audio discussion at ", path);

        functions.logger.log("Logging analytics");

        const today = new Date();
        const postKey = today.toISOString().split("T").shift();
        await db
          .collection("analytics")
          .doc(postKey)
          .set(
            {
              audioDiscussions: {
                [path]: {
                  users: admin.firestore.FieldValue.arrayUnion(
                    ...activeUsers.map((activeUser) => activeUser.userID),
                  ),
                },
              },
            },
            { merge: true },
          );

        // Create activity event. Notify coauthors, community members and users
        // who engaged with the post.

        const post = await db
          .collection("personas")
          .doc(personaID)
          .collection("posts")
          .doc(postID)
          .get();

        const persona = await db.collection("personas").doc(personaID).get();

        // Find out who's talking
        const unfilteredTalkingUsers = await Promise.all(
          unmutedUsers.map(async (userPresence) => {
            const talking = await db
              .collection("users")
              .doc(userPresence.userID)
              .collection("live")
              .doc("talking")
              .get();

            if (!talking.exists) {
              functions.logger.log("talking does not exist, returning early");
              return null;
            }

            const talkingData = talking.data();
            const volume = talkingData[path] && talkingData[path].volume;

            if (!volume) {
              functions.logger.log(
                `Data at ${path} does not exist, returning early`,
              );
              return null;
            }

            if (volume >= TALKING_VOLUME_THRESHOLD) {
              return userPresence;
            } else {
              return null;
            }
          }),
        );

        const talkingUsers = unfilteredTalkingUsers.filter(
          (obj) => obj !== null,
        );

        if (talkingUsers.length === 0) {
          functions.logger.log("No users talking, returning early");
          return;
        }

        // Find out which of the talking users we haven't recently sent a
        // notification for
        let unnotifiedSpeakers = [];
        const notifiedSpeakers =
          roomsSessions[path] && roomsSessions[path].notifiedSpeakers;
        if (notifiedSpeakers) {
          unnotifiedSpeakers = talkingUsers.filter((userPresence) => {
            const userIDOrIdentityID = getUserIDOrIdentityID(userPresence);
            const lastNotifiedTimestamp =
              notifiedSpeakers[userIDOrIdentityID] &&
              notifiedSpeakers[userIDOrIdentityID].timestamp;

            return (
              !lastNotifiedTimestamp ||
              (lastNotifiedTimestamp &&
                Math.abs(
                  admin.firestore.Timestamp.now().seconds -
                    lastNotifiedTimestamp.seconds,
                ) > NOTIFICATION_COOLDOWN_SECONDS)
            );
          });
        } else {
          unnotifiedSpeakers = talkingUsers;
        }

        if (unnotifiedSpeakers.length === 0) {
          functions.logger.log(
            "Found users talking but none eligible for notification, returning early",
          );
          return;
        }

        const createdByUsers = await Promise.all(
          unnotifiedSpeakers.map(async (activeUser) => getUserData(activeUser)),
        );

        const createdByUserIDs = createdByUsers.map((createdByUser) => {
          return createdByUser.isAnonymous
            ? createdByUser.identity.id
            : createdByUser.id;
        });

        const filteredActiveUsers = activeUsers.filter(
          (activeUser) =>
            !createdByUserIDs.includes(getUserIDOrIdentityID(activeUser)),
        );

        const listeningUsers = await Promise.all(
          filteredActiveUsers.map(async (activeUser) =>
            getUserData(activeUser),
          ),
        );

        const eventData = {
          created_at: admin.firestore.Timestamp.now(),
          event_type: "room_audio_discussion",
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
          createdByUserIDs,
          createdByUsers,
          listeningUsers,
        };

        let usersToNotifyArr = persona.get("authors") || [];

        if (post.get("published")) {
          const communityMemberUserIDs = persona.get("communityMembers") || [];
          usersToNotifyArr = usersToNotifyArr.concat(communityMemberUserIDs);
          if (!persona.get("private")) {
            // Notify users who have engaged with the post
            const postComments = await post.ref.collection("comments").get();
            if (postComments.docs && postComments.docs.length > 0) {
              const postCommentUserIDs = postComments.docs.map((doc) =>
                doc.get("userID"),
              );
              usersToNotifyArr = usersToNotifyArr.concat(postCommentUserIDs);
            }

            // FIXME: If an identity reacts to a post then the user who
            // made the post reaction won't be notified.
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
          }
        }

        const usersToNotify = new Set(usersToNotifyArr);

        // Don't notify users who are already in the discussion
        activeUsers.map((activeUser) =>
          usersToNotify.delete(activeUser.userID),
        );

        if (usersToNotify.size === 0) {
          functions.logger.log("No users to notify, returning early");
          return;
        }

        functions.logger.log(`Notifying ${Array.from(usersToNotify)}`);

        await Promise.all(
          Array.from(usersToNotify).map(async (userID) => {
            await createActivityEvent({ userID, persona, post, eventData });
          }),
        );

        const justNotifiedSpeakers = {};
        createdByUserIDs.forEach((uid) => {
          justNotifiedSpeakers[uid] = {
            timestamp: admin.firestore.Timestamp.now(),
          };
        });

        // Set the last time we notified users about a speaker talking
        await db
          .collection("intents")
          .doc("sessions")
          .set(
            {
              rooms: {
                [path]: {
                  notifiedSpeakers: justNotifiedSpeakers,
                },
              },
            },
            { merge: true },
          );
      }),
    );
  });
