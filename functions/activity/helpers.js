const { db, rtdb, admin, functions } = require("../admin");
const { encode } = require("base-64");
const _ = require("lodash");

/**
 * Truncates a string
 * @param {string} str The string to truncate
 * @param {object} options Set maximum length to truncate and whether or not
 * to truncate on a word boundary.
 * @return {string} Truncated string
 */
function truncate(str, options = { maxLength: 120, useWordBoundary: true }) {
  const { maxLength, useWordBoundary } = options;
  if (str.length <= maxLength) {
    return str;
  }
  const subString = str.substr(0, maxLength - 1); // the original check
  return (
    (useWordBoundary
      ? subString.substr(0, subString.lastIndexOf(" "))
      : subString) + "…"
  );
}

/**
 * Mark activity entries deleted that reference a given object
 * @param {admin.firestore.DocumentReference} document
 * @return {Promise<void>}
 */
async function markActivityEntriesDeleted(document) {
  const activitySnap = await db
    .collectionGroup("activity")
    .where("ref", "==", document.ref)
    .get();
  await Promise.all(
    activitySnap.docs.map(async (doc) => {
      functions.logger.log(
        "Update activity status",
        document.ref.path,
        doc.ref.path,
      );
      await doc.ref.set(
        {
          deleted: document.get("deleted") || false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }),
  );
}
/**
 * Extracts @-mentioned usernames from text
 * @param {string} text
 */
const findMentions = (text) => {
  const regex = /@(?<userName>\w+)/;
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
            if (matches && matches.groups && matches.groups.userName) {
              return matches.groups.userName;
            }
          }
        })
        .filter((match) => !_.isNil(match)),
    );
  }
};

const displayCreatedByUsers = ({
  event,
  key = "createdByUsers",
  numUsersToShow = 10,
}) => {
  const createdByUsers = event[key];
  const getDisplayName = (createdByUser) => {
    if (event.isAnonymous || createdByUser.data.isAnonymous) {
      return createdByUser.name;
    } else if (createdByUser.isAnonymous) {
      return createdByUser.identity.name;
    } else {
      return createdByUser.data.userName;
    }
  };
  if (createdByUsers.length === 0) {
    return null;
  } else if (createdByUsers.length < 3) {
    return createdByUsers.map((cu) => getDisplayName(cu)).join(" and ");
  } else {
    const usersToShow = createdByUsers.slice(0, numUsersToShow).map((cu) => {
      return getDisplayName(cu);
    });
    const numAdditionalUsers = createdByUsers.length - numUsersToShow;
    if (numAdditionalUsers > 0) {
      const usersToShowStr = usersToShow.join(", ");
      return `${usersToShowStr} and ${numAdditionalUsers} other user${
        numAdditionalUsers === 1 ? "" : "s"
      }`;
    } else {
      const head = usersToShow.slice(0, usersToShow.length - 1);
      const tail = usersToShow[usersToShow.length - 1];
      const usersToShowStr = head.join(", ") + " and " + tail;
      return usersToShowStr;
    }
  }
};

const getPersonaCommonData = (persona) => {
  return {
    id: persona.id,
    name: persona.get("name"),
    profileImgUrl: persona.get("profileImgUrl") || "",
  };
};

const getEntityCommonData = (entity) => {
  return {
    id: entity.id,
    profileImgUrl: entity.get("profileImgUrl") || "",
    ...(entity.get("name") && { name: entity.get("name") }),
    ...(entity.get("userName") && { userName: entity.get("userName") }),
  };
};

const getCreatedByUserCommonData = (createdByUser) => {
  return {
    id: createdByUser.id,
    userName: createdByUser.get("userName"),
    profileImgUrl: createdByUser.get("profileImgUrl") || "",
  };
};

const getPostCommonData = (post) => {
  const remixPersonaID = post.get("remixPersonaID");
  const remixPostID = post.get("remixPostID");
  return {
    id: post.id,
    title: post.get("title"),
    ...(remixPersonaID &&
      remixPostID && {
        remixPersonaID,
        remixPostID,
      }),
  };
};

const getCommentCommonData = (comment) => {
  return {
    id: comment.id,
    userID: comment.get("userID"),
    isThread: comment.get("isThread") || false,
    mediaUrl: comment.get("mediaUrl") || "",
    text: comment.get("text"),
    anonymous: comment.get("anonymous") || false,
    identityID: comment.get("identityID") || "",
  };
};

const getPostPreviewData = (post) => {
  return {
    id: post.id,
    type: post.get("type"),
    mediaType: post.get("mediaType") ?? "",
    mediaUrl: post.get("mediaUrl") ?? "",
    galleryUris: post.get("galleryUris") ?? [],
    text: post.get("text") ?? "",
    subPersonaID: post.get("subPersonaID") ?? "",
    userID: post.get("userID"),
    published: post.get("published") || false,
    ...(post.get("subpersona") && { subpersona: post.get("subpersona") }),
  };
};

const getMessageCommonData = (message) => {
  return {
    id: message.id,
    userID: message.get("userID"),
    isThread: message.get("isThread") ?? false,
    text: message.get("text") ?? "",
    mediaUrl: message.get("mediaUrl") ?? "",
  };
};

const canUserAccessPost = ({ userID, persona, post }) => {
  const isUserAuthor = persona?.get("authors")?.includes(userID);
  return !post?.get("published")
    ? isUserAuthor
    : canUserAccessPersona({ userID, persona });
};

const newCanUserAccessPost = ({ userID, entity, entityType, post }) => {
  const isUserAuthor =
    entity?.get("authors")?.includes(userID) ||
    entity?.get("members")?.includes(userID);
  return !post.get("published")
    ? isUserAuthor
    : canUserAccessEntity({ userID, entity, entityType });
};

const canUserAccessEntity = ({ userID, entity, entityType }) => {
  const isUserAuthor =
    (entity?.get("authors")?.includes(userID) ||
      entity?.get("members")?.includes(userID)) ??
    false;
  const isUserPersonaFollower =
    entity?.get("communityMembers")?.includes(userID) ?? false;

  if (entityType === "community") {
    return isUserAuthor;
  } else {
    return entity.get("private") ? isUserAuthor || isUserPersonaFollower : true;
  }
};

const newCreateActivityEvent = async ({
  userID,
  entity,
  entityType,
  post,
  eventData,
}) => {
  if (
    (post && !newCanUserAccessPost({ userID, entity, entityType, post })) ||
    (entity && !canUserAccessEntity({ userID, entity, entityType }))
  ) {
    functions.logger.log(
      "User cannot access content, returning early: ",
      userID,
    );
    return null;
  }
  const userDoc = await db.collection("users").doc(userID).get();
  if (!userDoc.exists) {
    functions.logger.error(
      `User ${userID} does not exist, returning early. This might be a persona ID.`,
    );
    return null;
  }
  return await userDoc.ref.collection("activity").add(eventData);
};

const canUserAccessPersona = ({ userID, persona }) => {
  const isUserAuthor = persona.get("authors").includes(userID);
  const isUserPersonaFollower = (
    persona.get("communityMembers") || []
  ).includes(userID);
  return persona.get("private") ? isUserAuthor || isUserPersonaFollower : true;
};

const createActivityEvent = async ({ userID, persona, post, eventData }) => {
  if (
    (post && !canUserAccessPost({ userID, persona, post })) ||
    (persona && !canUserAccessPersona({ userID, persona }))
  ) {
    functions.logger.log(
      "User cannot access content, returning early: ",
      userID,
    );
    return null;
  }
  const userDoc = await db.collection("users").doc(userID).get();
  if (!userDoc.exists) {
    functions.logger.error(
      `User ${userID} does not exist, returning early. This might be a persona ID.`,
    );
    return null;
  }
  return await userDoc.ref.collection("activity").add(eventData);
};

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
 * Returns a URL for a resized image according to the given specifications
 * @param {{width: number, height: number, fit: str, origUrl: str}} requestObj
 *  Options for fit: cover, contain, fill, inside, outside
 * @return {str} - the URL of the resized image
 */
function getResizedImageUrl({
  width,
  height,
  fit = "cover",
  origUrl,
  debugTag,
  roundCrop = false,
}) {
  const S3_BUCKET = "persona-content-store";
  const CLOUDFRONT_URL = "https://d15rrhm2u3m386.cloudfront.net";
  const MIN_DIMENSION = 300;

  if (!origUrl || typeof origUrl !== "string" || (!width && !height)) {
    if (debugTag) {
      functions.logger.log(
        "------------",
        "getResizedImageUrl",
        debugTag,
        "returning null",
      );
    }
    return null;
  }

  const urlParts = origUrl.split("/");

  if (urlParts.length === 1) {
    return origUrl;
  }

  const key = urlParts.pop();

  if (key.endsWith("gif")) {
    return origUrl;
  }

  if (key) {
    const request = {
      bucket: S3_BUCKET,
      key,
      edits: {
        resize: {
          fit,
        },
        rotate: null,
      },
    };

    if (width && height && (width < MIN_DIMENSION || height < MIN_DIMENSION)) {
      const aspectRatio = width / height;
      if (aspectRatio <= 1) {
        width = MIN_DIMENSION;
        height = width / aspectRatio;
      } else {
        height = MIN_DIMENSION;
        width = height * aspectRatio;
      }
    }

    if (width) {
      request.edits.resize.width = Math.max(width, MIN_DIMENSION);
    }

    if (height) {
      request.edits.resize.height = Math.max(height, MIN_DIMENSION);
    }

    if (roundCrop) {
      request.edits.roundCrop = {
        rx: 150,
        ry: 150,
      };
    }

    const encodedRequest = encode(JSON.stringify(request));

    if (debugTag) {
      functions.logger.log(
        "------------",
        "getResizedImageUrl: request: ",
        debugTag,
        request,
      );

      functions.logger.log(
        "------------",
        "getResizedImageUrl: new url: ",
        debugTag,
        `${CLOUDFRONT_URL}/${encodedRequest}`,
      );
    }

    return `${CLOUDFRONT_URL}/${encodedRequest}`;
  } else {
    return origUrl;
  }
}

const getDocumentChanges = ({ before, after, trackedFields }) => {
  for (let i = 0; i < trackedFields.length; i++) {
    const beforeVal = before.get(trackedFields[i]);
    const afterVal = after.get(trackedFields[i]);
    if (!_.isEqual(beforeVal, afterVal)) {
      return [trackedFields[i], beforeVal, afterVal];
    }
  }
  return null;
};

function timestampToDateString(timestampInSeconds) {
  const today = new Date().getTime() / 1000;
  const secondsPast = timestampInSeconds - today;
  const secondsInMin = 60;
  const secondsInHour = 3600;
  const secondsInDay = 86400;
  const secondsInWeek = 604800;
  const secondsInYear = 31540000;
  if (secondsPast <= secondsInHour) {
    return parseInt(secondsPast / secondsInMin).toString() + " minutes";
  } else if (secondsPast <= secondsInDay) {
    return parseInt(secondsPast / secondsInHour).toString() + " hours";
  } else if (secondsPast <= secondsInWeek) {
    return parseInt(secondsPast / secondsInDay).toString() + " days";
  } else if (secondsPast <= secondsInYear) {
    return parseInt(secondsPast / secondsInWeek).toString() + " weeks";
  } else {
    return parseInt(secondsPast / secondsInYear).toString() + " years";
  }
}

async function isUserInRoom({ userID, roomPath }) {
  const userPresence = await rtdb.ref(`/usersPresence/${userID}`).get();
  const userPresenceData = userPresence.val();
  const connections = userPresenceData?.connections;
  if (!connections) {
    return false;
  }
  const mostRecentConnection = Object.keys(connections)
    .map((connectionID) => {
      return {
        enteredRoomAt: connections[connectionID]?.currentRoom?.enteredRoomAt,
        path: connections[connectionID]?.currentRoom?.path,
      };
    })
    .reduce((prev, curr) =>
      prev.enteredRoomAt > curr.enteredRoomAt ? prev : curr,
    );

  functions.logger.log(userID, mostRecentConnection, roomPath);
  return roomPath.replaceAll("/", ":") === mostRecentConnection.path;
}

module.exports = {
  getIdentity,
  createActivityEvent,
  canUserAccessPersona,
  canUserAccessPost,
  getMessageCommonData,
  getPostPreviewData,
  getCommentCommonData,
  getPostCommonData,
  getCreatedByUserCommonData,
  getPersonaCommonData,
  displayCreatedByUsers,
  findMentions,
  markActivityEntriesDeleted,
  truncate,
  getResizedImageUrl,
  getDocumentChanges,
  getEntityCommonData,
  timestampToDateString,
  isUserInRoom,
  newCreateActivityEvent,
};
