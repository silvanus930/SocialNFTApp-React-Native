const { db, admin, functions } = require("../admin");
const _ = require("lodash");
const { algoliaIndex } = require("../algolia/config");
const {
  getPersonaCommonData,
  getMessageCommonData,
  getCreatedByUserCommonData,
  getPostCommonData,
  findMentions,
  isUserInRoom,
  newCreateActivityEvent,
} = require("./helpers");
const {
  createPushNotificationFromActivityEventRef,
} = require("./createPushNotificationFromActivityEvent");

const SYSTEM_DM_PERSONA_ID = "NKDmMFWHDIRP4IMjOw5y";

const getIdentity = async (identityID) => {
  const identityPersona = await db.collection("personas").doc(identityID).get();
  if (identityPersona.exists) {
    return {
      id: identityID,
      name: identityPersona.get("name") || "",
      profileImgUrl: identityPersona.get("profileImgUrl") || "",
    };
  } else {
    return null;
  }
};

/**
 * Extracts @-mentioned Role title from text
 * @param {string} text
 */
const findRoleTitle = (text) => {
  const regex = /@role:(?<roleTitle>\w+)/;
  if (!text) {
    return new Set();
  } else {
    return new Set(
      text
        .split("\n")
        .flatMap((words) => words.split(" "))
        .map((word) => {
          const matches = word.match(regex);
          if (matches === null) {
            return null;
          } else {
            if (matches && matches.groups && matches.groups.roleTitle) {
              return matches.groups.roleTitle;
            }
          }
        })
        .filter((match) => !_.isNil(match))
    );
  }
};

exports.createActivityEventFromChat = functions.firestore
  .document("{entity}/{entityId}/{chatName}/{chatId}/messages/{messageId}")
  .onWrite(async (change, context) => {
    const { messageId } = context.params;
    const before = change.before;
    const after = change.after;
    const snapshot = after;
    const ref = after.ref;
    const messageUserID = snapshot.get("userID");
    const messageType = snapshot.get("messageType");

    if (context.params.messageId == "LastSeen") {
      return;
    }
    if (
      context.params.entityId !== SYSTEM_DM_PERSONA_ID &&
      context.params.chatName !== "chat" &&
      context.params.chatName !== "chats"
    ) {
      return;
    }

    if (
      context.params.entity !== "communities" &&
      context.params.entity !== "personas"
    ) {
      functions.logger.error(
        `${context.params.entity} / ${context.params.entityId} / ${context.params.chatName} / ${context.params.chatId} / ${context.params.messageId}`
      );
      throw new Error("Unrecognized entity type");
    }

    if (
      messageUserID === "system" &&
      messageType &&
      ["proposal", "transfer", "post"].includes(messageType)
    ) {
      return;
    }

    const entityType =
      context.params.entity === "communities" ? "community" : "persona";
    const isCommunityAllChat = entityType === "community";

    if (!before.exists && after.exists) {
      // New message
      const chat = await ref.parent.parent.get();
      const notificationsMutedUsers = chat.get("notificationsMutedUsers") || [];
      const entityDoc = await chat.ref.parent.parent.get();
      const entityId = context.params.entityId;

      let usersToNotify;
      let attendees;
      let mentionIds = [];

      const isDM = entityId === SYSTEM_DM_PERSONA_ID;
      const isAllChat = context.params.chatId === "all";

      const mentions = [...findMentions(snapshot.get("text"))];

      const mentionsRoleTitles = [...findRoleTitle(snapshot.get("text"))];
      let mentionRoleIdsTmp = [];

      const rolRef = isCommunityAllChat
        ? `communities\/${entityId}`
        : `personas\/${entityId}`;

      if (mentionsRoleTitles.length) {
        mentionRoleIdsTmp = await Promise.all(
          mentionsRoleTitles.map(async (roleTitle) => {
            let members = [];
            if (isCommunityAllChat) {
              members = entityDoc.get("members") || [];
            } else {
              members = entityDoc.get("authors") || [];
            }
            // console.log('entityDoc', entityDoc.path);
            // console.log('members', members);
            const asyncFilter = async (arr, predicate) =>
              Promise.all(arr.map(predicate)).then((results) =>
                arr.filter((_v, index) => results[index])
              );

            const filteredMemberByRole = await asyncFilter(
              members,
              async (member) => {
                const userRef = await db.collection("users").doc(member).get();
                const roles = userRef.get("roles");
                let flag = false;
                roles.forEach((role) => {
                  if (role?.ref?.path === rolRef && role?.title === roleTitle) {
                    flag = true;
                  }
                });
                return flag;
              }
            );
            return filteredMemberByRole;
          })
        );
        mentionRoleIdsTmp = mentionRoleIdsTmp.flat();
        mentionRoleIdsTmp = mentionRoleIdsTmp.filter(
          (item, index) => mentionRoleIdsTmp.indexOf(item) === index
        );
      }

      try {
        const mentionIdsTmp = await Promise.all(
          mentions.map(async (userName) => {
            if (userName === "all") {
              // return all community userID
              functions.logger.log("---all called!");
              if (entityType === "community") {
                return entityDoc.get("members") || [];
              } else {
                const data = await db
                  .collection("communities")
                  .doc(entityDoc.get("communityID"))
                  .get();
                return data.get("members") || [];
              }
            }

            const userQuerySnapshot = await db
              .collection("users")
              .where("userName", "==", userName)
              .get();
            if (userQuerySnapshot.empty) {
              functions.logger.warn("Username does not exist:", userName);
              return null;
            }
            const doc = userQuerySnapshot.docs[0];
            // No self-mentions
            if (doc.id === messageUserID) {
              return null;
            }
            return doc.id;
          })
        );
        mentionIds = mentionIdsTmp
          .concat(mentionRoleIdsTmp)
          .flat()
          .filter((mid) => !_.isNil(mid));
        // console.log('mentionRoleIdsTmp: ', mentionRoleIdsTmp);
        // console.log('mentionIdsTmp: ', mentionIdsTmp);
        // console.log('mentionIds: ', mentionIds);
        mentionIds = mentionIds.filter(
          (item, index) => mentionIds.indexOf(item) === index
        );
        // console.log('filtered mentionIds: ', mentionIds);
      } catch (e) {
        functions.logger.error(e);
        functions.logger.error(
          `${context.params.entity} / ${context.params.entityId} / ${context.params.chatName} / ${context.params.chatId} / ${context.params.messageId}`
        );
      }

      if (isDM) {
        attendees = chat.get("attendees").map((u) => u.uid);
        usersToNotify = new Set(attendees);
      } else if (isAllChat) {
        const members = entityDoc.get("authors") || entityDoc.get("members");
        const communityMembers = entityDoc.get("communityMembers") || [];
        attendees = members.concat(communityMembers).concat(mentionIds);

        // console.log('attendees', attendees);

        usersToNotify = new Set(
          attendees.filter(
            (member) => !notificationsMutedUsers.includes(member)
          )
        );
        usersToNotify.delete(messageUserID);
        // console.log('usersToNotify: ', usersToNotify);
      } else {
        throw new Error("Chat is neither a DM nor all chat");
      }
      const createdByUser = await db
        .collection("users")
        .doc(messageUserID)
        .get();

      const identityID = snapshot.get("identityID");
      const isAnonymous = !!snapshot.get("anonymous");
      if (isAnonymous && !identityID) {
        throw new Error(
          `Anonymous message sent without identityID. MessageID: ${snapshot.id}`
        );
      }
      usersToNotify.delete(messageUserID);

      let identity = null;
      if (identityID) {
        identity = await getIdentity(identityID);
      }

      const eventData = {
        created_at: snapshot.get("timestamp"),
        originalCreatedAt: snapshot.get("timestamp"),
        ref,
        event_type: "chat_message",
        seen: false,
        deleted: snapshot.get("deleted") || false,
        ...(entityType === "persona" && {
          persona_id: context.params.entityId,
          isProjectAllChat: isAllChat,
        }),
        ...(entityType === "community" && {
          communityID: context.params.entityId,
          isCommunityAllChat: isAllChat,
        }),
        isDM,
        isAnonymous,
        message: {
          id: snapshot.id,
          data: {
            ...getMessageCommonData(snapshot),
          },
          ref: ref,
        },
        chat: {
          id: chat.id,
          data: {
            attendees,
          },
          ref: chat.ref,
        },
        [entityType]: {
          id: entityDoc.id,
          data: {
            ...getPersonaCommonData(entityDoc),
          },
          ref: entityDoc.ref,
        },
        createdByUser: {
          id: createdByUser.id,
          data: {
            ...getCreatedByUserCommonData(createdByUser),
          },
          ref: createdByUser.ref,
        },
        ...(identity !== null && {
          identity: {
            ...identity,
          },
        }),
      };

      if (chat.get("postID")) {
        const post = await db
          .collection(context.params.entity)
          .doc(context.params.entityId)
          .collection("posts")
          .doc(chat.get("postID"))
          .get();

        if (post.exists) {
          eventData["post"] = {
            id: post.id,
            data: {
              ...getPostCommonData(post),
            },
            ref: post.ref,
          };
        }
      }

      await Promise.all(
        [...usersToNotify].map(async (userID) => {
          const eventDataCopy = Object.assign({}, eventData);

          if (mentionIds.includes(userID)) {
            eventDataCopy.event_type = "chat_mention";
          } else {
            eventDataCopy.event_type = "chat_message";
          }

          // Don't send a chat_message notification if we're in the room
          const isEventChatMessage =
            eventDataCopy.event_type === "chat_message";
          const isUserInRoomBool = await isUserInRoom({
            userID,
            roomPath: `${context.params.entity}/${context.params.entityId}/${context.params.chatName}/${context.params.chatId}`,
          });

          if (isEventChatMessage && isUserInRoomBool) {
            functions.logger.log(
              " User is in room, skipping chat_message notification"
            );
            return;
          }

          if (isEventChatMessage) {
            const existingChatMessageActivityEvent = await db
              .collection("users")
              .doc(userID)
              .collection("activity")
              .where("chat.ref", "==", chat.ref)
              .where("event_type", "==", "chat_message")
              .orderBy("created_at", "desc")
              .get();

            if (existingChatMessageActivityEvent.docs.length > 0) {
              const latestEvent = existingChatMessageActivityEvent.docs[0];

              await latestEvent.ref.update({
                // HACK: Firestore can't order by fields that don't exist and
                // udpatedAt is already being used for other updates to activity
                // that we don't want to surface to users by reordering the
                // activity stream. So we write over created_at and record
                // the original timestamp in a separate field instead so that
                // these events can appear at the top.
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                message: {
                  id: snapshot.id,
                  data: {
                    ...getMessageCommonData(snapshot),
                  },
                  ref: ref,
                },
                createdByUser: {
                  id: createdByUser.id,
                  data: {
                    ...getCreatedByUserCommonData(createdByUser),
                  },
                  ref: createdByUser.ref,
                },
                deleted: false,
              });
              functions.logger.log(
                `Updated chat_message event for ${userID} with new message`,
                ref.path
              );
              const updatedLatestEventSnapshot = await latestEvent.ref.get();

              if (isUserInRoomBool) {
                functions.logger.log(
                  "User is in room, skipping push notification"
                );
                return;
              }

              await createPushNotificationFromActivityEventRef({
                eventSnapshot: updatedLatestEventSnapshot,
                userID,
              });
              functions.logger.log("Created push notification for ", userID);
            } else {
              if (isDM) {
                const userDoc = await db.collection("users").doc(userID).get();
                if (!userDoc.exists) {
                  functions.logger.error(
                    `User ${userID} does not exist, returning early. This might be a persona ID.`
                  );
                  return null;
                }
                const dataRef = await userDoc.ref
                  .collection("activity")
                  .add(eventData);
                const data = await dataRef.get();
                if (isUserInRoomBool) {
                  functions.logger.log(
                    "User is in room, skipping push notification"
                  );
                  return;
                }
                await createPushNotificationFromActivityEventRef({
                  eventSnapshot: data,
                  userID,
                });
                functions.logger.log(
                  "Created push notification for DM ",
                  userID
                );
              }

              await newCreateActivityEvent({
                userID,
                eventData: eventDataCopy,
                entity: entityDoc,
                entityType,
              });
            }
          } else {
            await newCreateActivityEvent({
              userID,
              eventData: eventDataCopy,
              entity: entityDoc,
              entityType,
            });
          }
        })
      );

      await algoliaIndex.saveObject({ ...eventData, objectID: messageId });

      functions.logger.log(`Saved event to algolia - ${messageId}`);
    } else {
      // Edited message: Only create mention events for users that were mentioned
      // Don't bother if the text hasn't changed or we have no text
      if (
        (after.exists && before.get("text") === after.get("text")) ||
        after.get("text") === ""
      ) {
        return;
      }

      const beforeMentions = findMentions(before.get("text"));
      const afterMentions = findMentions(after.get("text"));

      if (
        _.isEqual(beforeMentions, afterMentions) ||
        afterMentions.length === 0
      ) {
        return;
      }

      const newMentions = [...afterMentions].filter(
        (x) => !beforeMentions.has(x)
      );

      if (newMentions.length === 0) {
        return;
      }

      const message = after;
      const ref = message.ref;
      const post = await ref.parent.parent.get();
      const entityDoc = await post.ref.parent.parent.get();
      const isAnonymous = !!message.get("anonymous");
      const createdByUser = await db
        .collection("users")
        .doc(message.get("userID"))
        .get();

      let identity;
      if (message.get("identityID")) {
        identity = await db
          .collection("personas")
          .doc(message.get("identityID"))
          .get();
      }

      newMentions.forEach(async (userName) => {
        const userQuerySnapshot = await db
          .collection("users")
          .where("userName", "==", userName)
          .get();

        if (userQuerySnapshot.empty) {
          functions.logger.warn("Username does not exist:", userName);
          return;
        }

        // FIXME: As of right now usernames are not unique and we have no way
        // to disambiguate between two users with the same username. So we
        // just pick the first one.
        const doc = userQuerySnapshot.docs[0];

        // No self-mentions
        if (doc.id === createdByUser.id) {
          return;
        }

        const eventData = {
          created_at: after.get("editTimestamp"),
          ref,
          event_type: "chat_mention",
          seen: false,
          deleted: after.get("deleted") || false,
          ...(entityType === "persona" && {
            persona_id: context.params.entityId,
          }),
          ...(entityType === "community" && {
            communityID: context.params.entityId,
          }),
          isAnonymous,
          message: {
            id: snapshot.id,
            data: {
              ...getMessageCommonData(snapshot),
            },
            ref: ref,
          },
          post: {
            id: post.id,
            data: {
              ...getPostCommonData(post),
            },
            ref: post.ref,
          },
          [entityType]: {
            id: entityDoc.id,
            data: {
              ...getPersonaCommonData(entityDoc),
            },
            ref: entityDoc.ref,
          },
          createdByUser: {
            id: createdByUser.id,
            data: {
              ...getCreatedByUserCommonData(createdByUser),
            },
            ref: createdByUser.ref,
          },
          ...(identity &&
            identity.exists && {
              identity: {
                id: message.get("identityID") || "",
                name: identity.get("name") || "",
                profileImgUrl: identity.get("profileImgUrl") || "",
              },
            }),
        };

        functions.logger.log(
          `Chat message edited: creating chat_mention event for ${doc.id} on message ${message.id}`
        );
        try {
          await newCreateActivityEvent({
            userID: doc.id,
            eventData,
            entity: entityDoc,
            entityType,
          });
        } catch (e) {
          functions.logger.error(e);
          functions.logger.error(
            `${context.params.entity} / ${context.params.entityId} / ${context.params.chatName} / ${context.params.chatId} / ${context.params.messageId}`
          );
        }
        await algoliaIndex.saveObject({ ...eventData, objectID: messageId });

        functions.logger.log(`Saved edit event to algolia - ${messageId}`);
      });
    }
  });
