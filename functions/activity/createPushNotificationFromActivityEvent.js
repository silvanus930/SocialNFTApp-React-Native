const { db, admin, functions } = require("../admin");
const {
  truncate,
  displayCreatedByUsers,
  getResizedImageUrl,
  timestampToDateString,
} = require("./helpers");
const {
  SYSTEM_DM_PERSONA_ID,
  PERSONA_DEFAULT_PROFILE_URL,
  USER_DEFAULT_PROFILE_URL,
} = require("./constants");

const getPersonaProfileImgUrl = (eventData) => {
  return getResizedImageUrl({
    origUrl:
      eventData?.persona?.data?.profileImgUrl ||
      eventData?.community?.data?.profileImgUrl ||
      eventData?.entity?.data?.profileImgUrl ||
      PERSONA_DEFAULT_PROFILE_URL,
    width: 400,
    height: 400,
    // roundCrop: true,
  });
};

const getCreatedByProfileImgUrl = (eventData) => {
  try {
    if ({}.hasOwnProperty.call(eventData, "createdByUsers")) {
      return getPersonaProfileImgUrl(eventData);
    } else {
      return getResizedImageUrl({
        origUrl: eventData.isAnonymous
          ? eventData.identity.profileImgUrl || PERSONA_DEFAULT_PROFILE_URL
          : eventData.createdByUser.data.profileImgUrl ||
            USER_DEFAULT_PROFILE_URL,
        width: 400,
        height: 400,
        // roundCrop: true,
      });
    }
  } catch (err) {
    functions.logger.error("Error creating profile image: ", err, eventData);
    return null;
  }
};

const acceptedEventTypes = [
  "post_like",
  "authorInvitation",
  "post_comment",
  "post_thread_comment",
  "post_thread_comment_endorsement",
  "comment_endorsement",
  "application",
  "chat_message",
  "new_post_from_collaborator",
  "chat_endorsement",
  "chat_thread_message",
  "post_endorsement",
  "post_mention",
  "comment_mention",
  "comment_thread_mention",
  "community_join",
  "room_audio_discussion",
  "room_users_present",
  "room_ping",
  "post_new_discussion",
  "post_continued_discussion",
  "user_profile_follow",
  "post_remix",
  "communityInvitation",
  "user_signup",
  "new_proposal",
  "proposal_ending_soon",
  "proposal_ended",
  "chat_mention",
  "chat_thread_mention",
  "transfer",
  "chat_thread_message_endorsement",
];

const createPushNotificationFromActivityEventRef = async ({
  eventSnapshot,
  userID,
}) => {
  const eventData = eventSnapshot.data();
  if (!acceptedEventTypes.includes(eventData.event_type)) {
    functions.logger.log(
      `${eventData.event_type} not yet supported - returning early`,
    );
    return;
  }

  const user = await db.collection("users").doc(userID).get();
  const deviceTokensDoc = await user.ref.collection("tokens").doc(userID).get();
  let deviceTokens;
  if (
    deviceTokensDoc.exists &&
    (deviceTokensDoc.get("deviceTokens") || []).length > 0
  ) {
    deviceTokens = [...deviceTokensDoc.get("deviceTokens")];
  } else {
    deviceTokens = [...(user.get("deviceTokens") || [])];
  }

  if (!deviceTokens || deviceTokens.length === 0) {
    functions.logger.log(
      `No device tokens found for ${userID}, returning early`,
    );
    return;
  }

  functions.logger.log(
    `Generating ${eventData.event_type} push notification for user ${userID} and event ${eventSnapshot.id}`,
    eventData,
  );

  let body;
  let title;
  let subtitle;
  let imageUrl;
  let pushData;
  let notificationThreadID;

  if (eventData.event_type === "post_like") {
    const createdByUserName = eventData.createdByUser.data.userName;
    const personaName = eventData.persona.data.name;
    const postTitle = eventData.post.data.title;
    title = personaName;
    body = `${createdByUserName} liked your post${
      postTitle ? " " + postTitle : ""
    } on ${personaName}`;
    pushData = {
      isPostPublished: eventData.post.data.published.toString(),
      eventType: "post_like",
      personaName: personaName,
      pid: eventData.persona.id,
      personaId: eventData.persona.id,
      personaKey: eventData.persona.id,
      postKey: eventData.post.id,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
    };
  } else if (eventData.event_type === "authorInvitation") {
    const createdByUserName = eventData.createdByUser.data.userName;
    const personaName = eventData.persona.data.name;
    title = personaName;
    body = `${createdByUserName} invited you to collaborate on ${personaName}`;
    imageUrl = getPersonaProfileImgUrl(eventData);
    pushData = {
      eventType: "authorInvitation",
      personaId: eventData.persona.id,
      personaName: personaName,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
    };
  } else if (eventData.event_type === "communityInvitation") {
    const createdByUserName = eventData.createdByUser.data.userName;
    const personaName = eventData.persona.data.name;
    title = personaName;
    body = `${createdByUserName} invited you to follow ${personaName}`;
    imageUrl = getPersonaProfileImgUrl(eventData);
    pushData = {
      eventType: "communityInvitation",
      personaId: eventData.persona.id,
      personaName: personaName,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
    };
  } else if (
    eventData.event_type === "post_comment" ||
    eventData.event_type === "post_thread_comment"
  ) {
    const postTitle = eventData.post.data.title || "Untitled Post";
    const entityName =
      eventData?.persona?.data?.name || eventData?.community?.data?.name;
    const createdByUserName = eventData.createdByUser.data.userName;
    title = `${postTitle}`;
    subtitle = entityName;
    body = `${
      eventData.isAnonymous ? eventData.identity.name : createdByUserName
    }: ${eventData.comment.data.text}`;
    notificationThreadID = eventData.post.id;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    pushData = {
      eventType: eventData.event_type,
      ...(eventData?.persona && {
        personaName: eventData?.persona?.data?.name,
        personaId: eventData?.persona?.id,
        personaProfileImgUrl: eventData?.persona?.data?.profileImgUrl,
      }),
      ...(eventData?.community && { communityId: eventData?.community?.id }),
      postId: eventData.post.id,
      commentId: eventData.comment.id,
    };
    if (eventData.comment.data.isThread) {
      const isParentCommentAnonymous = eventData.parentComment.data.anonymous;
      if (isParentCommentAnonymous) {
        const parentCommentCreatedByIdentity = await db
          .collection("personas")
          .doc(eventData.parentComment.data.identityID)
          .get();
        const identityName = parentCommentCreatedByIdentity.get("name");
        title = `💬 Reply to ${identityName} on ${postTitle}`;
      } else {
        const parentCommentCreatedByUser = await db
          .collection("users")
          .doc(eventData.parentComment.data.userID)
          .get();
        const parentCommentCreatedByUserName =
          parentCommentCreatedByUser.get("userName");
        title = `💬 Reply to ${parentCommentCreatedByUserName} on ${postTitle}`;
      }
      notificationThreadID = eventData.parentComment.id;
      pushData["threadID"] = eventData.parentComment.id;
    }
  } else if (
    eventData.event_type === "comment_endorsement" ||
    eventData.event_type === "post_thread_comment_endorsement" ||
    eventData.event_type === "chat_endorsement" ||
    eventData.event_type === "chat_thread_message_endorsement"
  ) {
    const postTitle = eventData?.post?.data?.title;
    const entityName =
      eventData?.community?.data?.name || eventData?.persona?.data?.name;
    let createdByUserNameOrIdentityName;
    if (eventData.identity) {
      createdByUserNameOrIdentityName = eventData.identity.name;
    } else {
      const createdByUser = await db
        .collection("users")
        .doc(eventData.createdByUserId)
        .get();
      createdByUserNameOrIdentityName = createdByUser.get("userName");
    }
    // We only get one reaction at a time from our change handlers
    // so show the first reaction we get.
    const commentType = eventData?.message ? "message" : "comment";
    title = postTitle || entityName;
    subtitle = postTitle ? entityName : undefined;
    body = `${createdByUserNameOrIdentityName} reacted ${
      eventData.endorsements[0]
    } to${
      eventData?.[commentType]?.data?.text
        ? ": " + eventData?.[commentType]?.data?.text
        : " your message"
    }`;

    if (commentType === "message") {
      notificationThreadID = eventData?.chat?.id;
    } else if (eventData?.post?.id) {
      notificationThreadID = eventData?.post?.id;
    } else {
      throw new Error(
        "Unrecognized notificationThreadID for chat/comment endorsement",
      );
    }
    imageUrl = getCreatedByProfileImgUrl(eventData);
    pushData = {
      eventType: eventData.event_type,
      ...(eventData?.post?.id && {
        postId: eventData.post.id,
      }),
      ...(eventData?.persona && {
        personaName: eventData.persona.data.name,
        personaId: eventData.persona.id,
        personaProfileImgUrl: eventData.persona.data.profileImgUrl,
      }),
      ...(eventData?.community && {
        communityId: eventData?.community?.id,
      }),
      ...(eventData?.message && {
        messageId: eventData?.message?.id,
        chatDocPath: eventData?.chat?.ref?.path,
      }),
      ...(eventData?.comment && {
        commentId: eventData?.comment?.id,
      }),
    };
    if (eventData?.[commentType]?.data?.isThread) {
      const parentCommentType =
        commentType === "message" ? "parentMessage" : "parentComment";
      notificationThreadID = eventData?.[parentCommentType]?.id;
      pushData["threadID"] = eventData?.[parentCommentType]?.id;
    }
  } else if (eventData.event_type === "application") {
    const applicationUserId = eventData.application.data.userID;
    const createdByUserName = eventData.createdByUser.data.userName;
    const personaName = eventData.persona.data.name;
    const accepted = eventData.persona.data.authors.includes(applicationUserId);
    title = personaName;
    if (accepted) {
      body = `${createdByUserName} accepted your invitation to collaborate on ${personaName}`;
    } else {
      body = `${createdByUserName} requested to collaborate on ${personaName}`;
    }
    pushData = {
      eventType: "application",
      personaId: eventData.persona.id,
      personaName: personaName,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
    };
  } else if (
    eventData.event_type === "chat_message" ||
    eventData.event_type === "chat_thread_message"
  ) {
    if (eventData.createdByUser.data.id === "system") {
      functions.logger.log("System chat message found - returning early");
      return;
    }

    const isDM = eventData.isDM;
    const isProjectAllChat = eventData.isProjectAllChat;
    const isCommunityAllChat = eventData.isCommunityAllChat;
    const messageText = eventData.message.data.text;
    const createdByUserName = eventData.createdByUser.data.userName;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    if (isDM) {
      title = `${
        eventData.isAnonymous ? eventData.identity.name : createdByUserName
      }`;
      body = truncate(messageText);
    } else if (isProjectAllChat || isCommunityAllChat) {
      const communityOrPersonaName = isCommunityAllChat
        ? eventData.community.data.name
        : eventData.persona.data.name;
      title = `${communityOrPersonaName}`;
      body = `${
        eventData.isAnonymous ? eventData.identity.name : createdByUserName
      }: ${truncate(messageText)}`;
    } else {
      title = `${eventData.persona.data.name}`;
      body = `To your chat on ${
        eventData.post.data.title || eventData.persona.data.name
      }:\n${truncate(messageText)}`;
    }
    notificationThreadID = eventData.chat.id;

    if (isCommunityAllChat) {
      pushData = {
        eventType: eventData.event_type,
        chatDocPath: eventData.chat.ref.path,
        numAttendees: eventData.chat.data.attendees.length.toString(),
        communityName: eventData.community.data.name,
        communityId: eventData.community.id,
        communityProfileImgUrl: eventData.community.data.profileImgUrl,
        messageId: eventData.message.id,
      };
    } else {
      pushData = {
        eventType: eventData.event_type,
        chatDocPath: eventData.chat.ref.path,
        numAttendees: eventData.chat.data.attendees.length.toString(),
        personaName: eventData.persona.data.name,
        personaId: eventData.persona.id,
        personaKey: eventData.persona.id,
        personaProfileImgUrl: eventData.persona.data.profileImgUrl,
        messageId: eventData.message.id,
      };
    }

    if (eventData.message.data.isThread) {
      pushData["threadID"] = eventData.parentMessage.id;
    }
  } else if (eventData.event_type === "new_post_from_collaborator") {
    const entityName =
      eventData?.persona?.data?.name || eventData?.community?.data?.name;
    const createdByUserName = eventData.createdByUser.data.userName;
    const verb = eventData.post.data.published ? "published" : "drafted";
    const postTitle = eventData.post.data.title
      ? `"${eventData.post.data.title}"`
      : "a post";
    title = `New post on ${entityName}`;
    body = `${
      eventData.isAnonymous
        ? eventData.identity.name || "An anonymous author"
        : createdByUserName
    } ${verb} ${postTitle} on ${entityName}`;
    imageUrl = getPersonaProfileImgUrl(eventData);
    pushData = {
      isPostPublished: (!!eventData.post.data.published).toString(),
      eventType: "new_post_from_collaborator",
      ...(eventData.persona && {
        personaName: entityName,
        pid: eventData.persona.id,
        personaId: eventData.persona.id,
        personaKey: eventData.persona.id,
        personaProfileImgUrl: eventData.persona.data.profileImgUrl,
      }),
      ...(eventData.community && {
        communityName: entityName,
        communityID: eventData.community.id,
      }),
      postKey: eventData.post.id,
    };
  } else if (eventData.event_type === "post_endorsement") {
    let createdByUserNameOrIdentityName;
    if (eventData.identity && eventData.identity.name) {
      createdByUserNameOrIdentityName = eventData.identity.name;
    } else {
      createdByUserNameOrIdentityName = eventData.createdByUser.data.userName;
    }
    const personaName = eventData.persona.data.name;
    const postTitle = eventData.post.data.title;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    const postTitleOrPersonaName = postTitle
      ? `"${postTitle}"`
      : `on ${personaName}`;
    title = `${createdByUserNameOrIdentityName} ${eventData.endorsements[0]}`;
    body = `${createdByUserNameOrIdentityName} reacted ${
      eventData.endorsements[0]
    } to ${
      userID === eventData.post.data.userID
        ? "your post "
        : postTitle
        ? ""
        : "a post "
    }${postTitleOrPersonaName}`;

    pushData = {
      isPostPublished: eventData.post.data.published.toString(),
      eventType: eventData.event_type,
      personaName: personaName,
      pid: eventData.persona.id,
      personaId: eventData.persona.id,
      personaKey: eventData.persona.id,
      postKey: eventData.post.id,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
    };
  } else if (eventData.event_type === "post_mention") {
    const createdByUserName = eventData.isAnonymous
      ? eventData.identity.name
      : eventData.createdByUser.data.userName;
    const entityName =
      eventData?.community?.data?.name || eventData?.persona?.data?.name;
    const postTitle = eventData.post.data.title;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    const postTitleOrEntityName = postTitle
      ? `"${postTitle}"`
      : `a post in ${entityName}`;
    title = `⚡️ Mention on ${postTitleOrEntityName}`;
    body = `${createdByUserName} mentioned you on ${postTitleOrEntityName}`;
    pushData = {
      isPostPublished: eventData.post.data.published.toString(),
      eventType: eventData.event_type,
      ...(eventData?.persona && {
        personaName: entityName,
        pid: eventData.persona.id,
        personaId: eventData.persona.id,
        personaKey: eventData.persona.id,
        personaProfileImgUrl: eventData.persona.data.profileImgUrl,
      }),
      ...(eventData?.community && {
        communityId: eventData?.community?.id,
      }),
      postKey: eventData.post.id,
    };
  } else if (
    eventData.event_type === "comment_mention" ||
    eventData.event_type === "comment_thread_mention"
  ) {
    const postTitle = eventData.post.data.title;
    const entityName =
      eventData?.persona?.data?.name || eventData?.community?.data?.name;
    const postTitleOrEntityName = postTitle
      ? `"${postTitle}"`
      : `a post in ${entityName}`;
    const createdByUserName = eventData.isAnonymous
      ? eventData.identity.name
      : eventData.createdByUser.data.userName;
    if (eventData.event_type === "comment_thread_mention") {
      title = `⚡️ Mention on ${postTitleOrEntityName}`;
    } else {
      title = `⚡️ Mention on ${postTitleOrEntityName}`;
    }
    body = `${createdByUserName}: ${truncate(eventData.comment.data.text)}`;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    notificationThreadID = eventData.post.id;
    pushData = {
      eventType: eventData.event_type,
      ...(eventData?.persona && {
        personaName: eventData.persona.data.name,
        personaId: eventData.persona.id,
        personaProfileImgUrl: eventData.persona.data.profileImgUrl,
      }),
      ...(eventData?.community && {
        communityId: eventData?.community.id,
      }),
      postId: eventData.post.id,
      commentId: eventData.comment.id,
    };
    if (eventData.comment.data.isThread) {
      notificationThreadID = eventData.parentComment.id;
      pushData["threadID"] = eventData.parentComment.id;
    }
  } else if (
    eventData.event_type === "chat_mention" ||
    eventData.event_type === "chat_thread_mention"
  ) {
    const entityName =
      eventData?.persona?.data?.name || eventData?.community?.data?.name;
    const createdByUserName = eventData.isAnonymous
      ? eventData.identity.name
      : eventData.createdByUser.data.userName;
    if (eventData.event_type === "comment_thread_mention") {
      title = `⚡️ Mention on ${entityName}`;
    } else {
      title = `⚡️ Mention on ${entityName}`;
    }
    body = `${createdByUserName}: ${truncate(eventData.message.data.text)}`;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    notificationThreadID = eventData.chat.id;
    pushData = {
      eventType: eventData.event_type,
      chatDocPath: eventData.chat.ref.path,
      ...(eventData?.persona && {
        personaName: eventData.persona.data.name,
        personaId: eventData.persona.id,
        personaProfileImgUrl: eventData.persona.data.profileImgUrl,
      }),
      ...(eventData?.community && {
        communityId: eventData?.community.id,
      }),
      messageId: eventData.message.id,
    };
    if (eventData.message.data.isThread) {
      notificationThreadID = eventData.parentMessage.id;
      pushData["threadID"] = eventData.parentMessage.id;
    }
  } else if (eventData.event_type === "community_join") {
    title = `New member on ${eventData.persona.data.name}`;
    body = `${eventData.createdByUser.data.userName} joined your community on ${eventData.persona.data.name}`;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    pushData = {
      eventType: eventData.event_type,
      personaName: eventData.persona.data.name,
      personaId: eventData.persona.id,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
    };
  } else if (
    eventData.event_type === "room_audio_discussion" ||
    eventData.event_type === "room_users_present"
  ) {
    const personaName = eventData.persona.data.name;
    const postTitle = eventData.post.data.title;
    const postTitleOrPersonaName = postTitle
      ? `${postTitle}`
      : `${personaName}`;
    imageUrl = getPersonaProfileImgUrl(eventData);
    if (eventData.event_type === "room_audio_discussion") {
      const isOrAre = eventData.createdByUsers.length === 1 ? "is" : "are";
      const listeningUsersStr = displayCreatedByUsers({
        event: eventData,
        key: "listeningUsers",
      });
      title = `🎙 ${displayCreatedByUsers({
        event: eventData,
      })} ${isOrAre} talking`;
      subtitle = personaName;
      body = `${displayCreatedByUsers({
        event: eventData,
      })} ${isOrAre} talking on ${
        !postTitle ? "a post in " : ""
      }${postTitleOrPersonaName}${
        listeningUsersStr === null ? "" : " with " + listeningUsersStr
      }`;
    } else {
      title = `🟢 ${postTitleOrPersonaName} is live`;
      body = `Join ${displayCreatedByUsers({ event: eventData })} on ${
        !postTitle ? "a post in " : ""
      }${postTitleOrPersonaName}`;
    }
    pushData = {
      eventType: eventData.event_type,
      personaName: eventData.persona.data.name,
      personaId: eventData.persona.id,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
      postId: eventData.post.id,
    };
  } else if (eventData.event_type === "room_ping") {
    const postTitle = eventData.post.data.title;
    const personaName = eventData.post.data.name;
    const createdByUserName = eventData.createdByUser.data.userName;
    const postTitleOrPersonaName = postTitle
      ? `${postTitle}`
      : `${personaName}`;
    title = `👉 ${createdByUserName} on ${postTitleOrPersonaName}`;
    body = `${createdByUserName} is requesting for you to join on ${
      !postTitle ? "a post in " : ""
    }${postTitleOrPersonaName}`;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    pushData = {
      eventType: eventData.event_type,
      personaName: eventData.persona.data.name,
      personaId: eventData.persona.id,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
      postId: eventData.post.id,
      pingID: eventData.pingID,
    };
  } else if (eventData.event_type === "post_new_discussion") {
    const postTitle = eventData.post.data.title;
    const createdByUserName = eventData.createdByUser.data.userName;
    title = `💬 ${postTitle}`;
    body = `${
      eventData.isAnonymous ? eventData.identity.name : createdByUserName
    }: ${truncate(eventData.comment.data.text)}`;
    pushData = {
      eventType: eventData.event_type,
      personaName: eventData.persona.data.name,
      personaId: eventData.persona.id,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
      postId: eventData.post.id,
      commentId: eventData.comment.id,
    };
  } else if (eventData.event_type === "post_continued_discussion") {
    const postTitle = eventData.post.data.title;
    const createdByUserName = eventData.createdByUser.data.userName;
    title = `💬 New replies on ${postTitle}`;
    body = `${
      eventData.isAnonymous ? eventData.identity.name : createdByUserName
    }: ${truncate(eventData.comment.data.text)}`;
    pushData = {
      eventType: eventData.event_type,
      personaName: eventData.persona.data.name,
      personaId: eventData.persona.id,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
      postId: eventData.post.id,
      commentId: eventData.comment.id,
    };
  } else if (eventData.event_type === "user_profile_follow") {
    body = `${eventData.createdByUser.data.userName} is now following you`;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    pushData = {
      eventType: eventData.event_type,
    };
  } else if (eventData.event_type === "post_remix") {
    const postTitle = eventData.post.data.title;
    title = `🔄 ${postTitle}`;
    imageUrl = getCreatedByProfileImgUrl(eventData);
    const createdByUserNameOrIdentityName = eventData.isAnonymous
      ? eventData.identity.name
      : eventData.createdByUser.data.userName;
    body = `${createdByUserNameOrIdentityName} remixed "${eventData.remixSourcePost.data.title}" from ${eventData.remixSourcePersona.data.name} onto ${eventData.persona.data.name}`;
    pushData = {
      isPostPublished: (!!eventData.post.data.published).toString(),
      eventType: "post_remix",
      personaName: eventData.persona.data.name,
      pid: eventData.persona.id,
      personaId: eventData.persona.id,
      personaKey: eventData.persona.id,
      postKey: eventData.post.id,
      personaProfileImgUrl: eventData.persona.data.profileImgUrl,
    };
  } else if (eventData.event_type === "user_signup") {
    title = "New user signup";
    body = `${eventData.userName} just signed up!`;
  } else if (eventData.event_type === "new_proposal") {
    title = `${eventData.entity.data.name}`;
    body = `New proposal: ${eventData.proposal.data.title}`;
    imageUrl = getPersonaProfileImgUrl(eventData);
    const entityType = eventData.entity.ref.path.includes("communities")
      ? "community"
      : "channel";
    pushData = {
      eventType: "new_proposal",
      entityType,
      postID: eventData.post.id,
      entityID: eventData.entity.id,
      proposalID: eventData.proposal.id,
    };
  } else if (eventData.event_type === "proposal_ending_soon") {
    const entity = eventData?.persona || eventData?.community;
    const name = entity.data?.name;
    title = name;
    const timeRemaining = timestampToDateString(
      eventData.proposal.data.endTime.seconds,
    );
    body = `Proposal ending in ${timeRemaining}: ${eventData.proposal.data.title}`;
    imageUrl = getPersonaProfileImgUrl(eventData);
    pushData = {
      eventType: "proposal_ending_soon",
      postID: eventData.post.id,
      ...(eventData?.persona && { personaId: eventData?.persona?.id }),
      ...(eventData?.community && { communityId: eventData?.community?.id }),
      proposalID: eventData.proposal.id,
    };
  } else if (eventData.event_type === "proposal_ended") {
    const entity = eventData?.persona || eventData?.community;
    const name = entity.data?.name;
    const voteResult = eventData?.proposal?.data?.voteOutcome?.result;
    const voteResultDisplay = voteResult === "passed" ? "passed" : "failed";
    const voteResultEmoji = voteResult === "passed" ? "✅" : "❌";
    title = name;
    body = `${voteResultEmoji} Proposal ${voteResultDisplay}: ${eventData.proposal.data.title}`;
    imageUrl = getPersonaProfileImgUrl(eventData);
    pushData = {
      eventType: "proposal_ended",
      postID: eventData.post.id,
      ...(eventData?.persona && { personaId: eventData?.persona?.id }),
      ...(eventData?.community && { communityId: eventData?.community?.id }),
      proposalID: eventData.proposal.id,
    };
  } else if (eventData.event_type === "transfer") {
    const sourceName =
      eventData?.source?.data?.name || eventData?.source?.data?.userName;
    const targetName =
      eventData?.target?.data?.name || eventData?.target?.data?.userName;
    const { amount, currency, name } = eventData?.transfer?.data;
    const sourceType = eventData?.source?.type;

    if (sourceType === "purchasable" && name) {
      body = `${name} sent ${targetName} ${amount} ${currency}`;
    } else {
      body = `${sourceName} sent ${targetName} ${amount} ${currency}`;
    }
    pushData = {
      eventType: "transfer",
      sourceID: eventData?.source?.id,
      sourceType: eventData?.source?.type,
      targetID: eventData?.target?.id,
      targetType: eventData?.target?.type,
    };
  }

  if (eventData?.persona?.data?.communityID) {
    pushData.communityId = eventData.persona.data.communityID;
  }

  const message = {
    tokens: deviceTokens,
    notification: {
      body: body,
    },
    data: {
      // FIXME: For some reason "title" and "body" can get swapped in the app
      // representation of a push even though the actual push notification
      // is correct. So adding them here to ensure we always have it right.
      eventId: eventSnapshot.id,
      body: body,
      title: title || "",
    },
    android: {
      notification: {},
    },
    apns: {
      payload: {
        aps: {
          alert: {
            body,
          },
        },
      },
    },
  };

  if (title) {
    message.notification.title = title;
    message.apns.payload.aps.alert.title = title;
  }

  if (subtitle) {
    // TODO: Add subtitle for Android
    message.apns.payload.aps.alert.subtitle = subtitle;
  }

  if (imageUrl) {
    // TODO: Add image for Android
    message.apns.payload.aps.mutableContent = true;
    message.apns.fcmOptions = {
      imageUrl,
    };
    message.android.notification.imageUrl = imageUrl;
  }

  if (notificationThreadID) {
    // TODO: Add threading for Android
    message.apns.payload.aps.threadId = notificationThreadID;
  }

  if (pushData) {
    Object.assign(message.data, pushData);
  }

  functions.logger.log("Push notification message: ", message);

  try {
    const response = await admin.messaging().sendMulticast(message);
    if (response.successCount > 0) {
      functions.logger.log(
        `Push notification successfully sent for user ${userID} and event ${eventSnapshot.id}`,
      );
      await eventSnapshot.ref.update({
        pushNotificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      functions.logger.warn(
        `FCM call successful but push notification did not send for user ${userID} and event ${eventSnapshot.id}`,
      );
      const firstErrorMessage = response.responses[0].error;
      functions.logger.warn(
        `Here is the first error message: ${firstErrorMessage}`,
      );
    }
  } catch (err) {
    functions.logger.error(
      `Error sending push notification for user ${userID} and event ${eventSnapshot.id}: `,
      err,
    );
    functions.logger.error("Message data: ", message);
  }
};

const createPushNotificationFromActivityEvent = functions
  .runWith({ minInstances: 5, memory: "256MB", failurePolicy: true })
  .firestore.document("users/{userId}/activity/{eventId}")
  .onCreate(async (snapshot, context) => {
    const { userId, eventId } = context.params;
    try {
      if (snapshot.get("pushNotificationSentAt")) {
        functions.logger.log(
          `Attempting to send notification for event ID ${snapshot.id} but we've already sent one. Returning early.`,
        );
        return;
      }

      // Don't send the notification if it's 5m after the event creation - we
      // don't want to keep retrying indefinitely
      if (
        (snapshot.get("created_at") &&
          snapshot.get("created_at").seconds &&
          Math.abs(
            admin.firestore.Timestamp.now().seconds -
              snapshot.get("created_at").seconds,
          )) >
        5 * 25
      ) {
        return;
      }

      await createPushNotificationFromActivityEventRef({
        eventSnapshot: snapshot,
        userID: userId,
      });
    } catch (err) {
      functions.logger.error(
        `createPushNotificationFromActivityEvent failed for ${userId} and event ${eventId}: `,
        err,
      );
    }
  });

module.exports = {
  createPushNotificationFromActivityEvent,
  createPushNotificationFromActivityEventRef,
};
