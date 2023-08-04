const activity = require("./activity");
const feed = require("./feed");
const story = require("./story");
const recursiveDelete = require("./recursiveDelete");
const caching = require("./caching");
const backup = require("./backup");
const onboarding = require("./onboarding");
const {
  createUser,
  createUserWithPhoneNumber,
  finishUserSignup,
} = require("./createUser");

const {
finishUserSignupInviteViaLinkSupport,
} = require("./createUserMultipleCodesSupport");

const {
addAccessToExistingUser,
} = require("./inviteViaLinkExistingUserAccess");

const {sentryHook} = require("./sentryHook");
const {
  createInlineProposalMessage,
  updateInlineProposalMessage,
} = require("./createInlineProposalMessage");
const createInlineTransferMessage = require("./createInlineTransferMessage");
const cleanPresenceData = require("./cleanPresenceData");
const {
  createInlinePostMessage,
  updateInlinePostMessage,
} = require("./createInlinePostMessage");
const {
  createPushNotificationFromInvite,
} = require("./createPushNotificationFromInvite");
const { inviteNewUserByPhone } = require("./inviteNewUserByPhone");
const { inviteNewUserByEmail } = require("./inviteNewUserByEmail");

const {
  createActivityEventFromRoomAudioDiscussion,
} = require("./activity/createActivityEventFromRoomAudioDiscussion");
const {
  createActivityEventFromLiveRoom,
} = require("./activity/createActivityEventFromLiveRoom");
const {
  createActivityEventFromComment,
} = require("./activity/createActivityEventFromComment");
const {
  createActivityEventFromCommentThread,
} = require("./activity/createActivityEventFromCommentThread");
const {
  createOrUpdateActivityEventFromUpdateCommentEndorsement,
} = require("./activity/createOrUpdateActivityEventFromUpdateCommentEndorsement");
const {
  createPushNotificationFromActivityEvent,
} = require("./activity/createPushNotificationFromActivityEvent");
const {
  createActivityEventFromPostMention,
} = require("./activity/createActivityEventFromPostMention");
const { dailyUserAnalyticsJob } = require("./analytics/dailyUserAnalyticsJob");
const {
  createOrUpdateActivityEventFromUpdateCollaboratorPosting,
} = require("./activity/createOrUpdateActivityEventFromUpdateCollaboratorPosting");
const {
  createOrUpdateActivityEventFromUpdateThreadCommentEndorsement,
} = require("./activity/createOrUpdateActivityEventFromUpdateThreadCommentEndorsement");
const {
  createActivityEventFromCollaboratorPosting,
} = require("./activity/createActivityEventFromCollaboratorPosting");
const {
  createStaffActivityEventForNewUser,
} = require("./activity/createStaffActivityEventForNewUser");
const {
  createActivityEventFromNewProposal,
  createNotificationTasksFromNewProposal,
  updateProposalActivityEventsAndTasksFromProposalChange,
} = require("./activity/createActivityEventFromProposal");
const { taskRunner } = require("./tasks/taskRunner");
const {
  createActivityEventFromChat,
} = require("./activity/createActivityEventFromChat");
const {
  createActivityEventFromTransfer,
} = require("./activity/createActivityEventFromTransfer");
const {
  createActivityEventFromPersonaPostThreadCommentEndorsement,
  createActivityEventFromPersonaChatThreadCommentEndorsement,
  createActivityEventFromCommunityChatThreadMessageEndorsement,
  createActivityEventFromCommunityPostThreadCommentEndorsement,
} = require("./activity/createOrUpdateActivityEventFromUpdateThreadCommentEndorsement");

const { populateAlgolia } =require("./algolia/populateAlgolia");

// algolia indexing
exports.populateAlgolia = populateAlgolia;

// activity management
exports.updateActivityEventFromInvitation =
  activity.updateActivityEventFromInvitation;
exports.createOrUpdateActivityEventFromAuthorInvite =
  activity.createOrUpdateActivityEventFromAuthorInvite;

exports.createOrUpdateActivityEventFromCommunityInvite =
  activity.createOrUpdateActivityEventFromCommunityInvite;
exports.createActivityEventFromAuthorChange =
  activity.createActivityEventFromAuthorChange;
exports.createActivityEventFromCommunityChange =
  activity.createActivityEventFromCommunityChange;

exports.updateActivityEventFromComment =
  activity.updateActivityEventFromComment;

exports.createActivityEventFromUpdatePostEndorsement =
  activity.createActivityEventFromCreatePostEndorsement;
exports.createOrUpdateActivityEventFromUpdatePostEndorsement =
  activity.createOrUpdateActivityEventFromUpdatePostEndorsement;

exports.createActivityEventFromCreateCommentEndorsement =
  activity.createActivityEventFromCreateCommentEndorsement;
exports.createOrUpdateActivityEventFromUpdateCommentEndorsement =
  createOrUpdateActivityEventFromUpdateCommentEndorsement;

exports.createActivityEventFromCollaboratorPosting =
  createActivityEventFromCollaboratorPosting;
exports.createOrUpdateActivityEventFromUpdateCollaboratorPosting =
  createOrUpdateActivityEventFromUpdateCollaboratorPosting;

exports.createActivityEventFromChat = createActivityEventFromChat;
exports.updateActivityEventFromChat = activity.updateActivityEventFromChat;

exports.createPushNotificationFromActivityEvent =
  createPushNotificationFromActivityEvent;

exports.updateActivityEventFromPersonaUpdate =
  activity.updateActivityEventFromPersonaUpdate;

exports.updateActivityEventFromPostUpdate =
  activity.updateActivityEventFromPostUpdate;

exports.updateActivityEventFromCommentUpdate =
  activity.updateActivityEventFromCommentUpdate;

exports.updateActivityEventFromMessageUpdate =
  activity.updateActivityEventFromMessageUpdate;

exports.createActivityEventFromChatThread =
  activity.createActivityEventFromChatThread;

exports.updateActivityEventFromThreadMessageUpdate =
  activity.updateActivityEventFromThreadMessageUpdate;

exports.createActivityEventFromComment = createActivityEventFromComment;

exports.createActivityEventFromCommentThread =
  createActivityEventFromCommentThread;

exports.updateActivityEventFromThreadCommentUpdate =
  activity.updateActivityEventFromThreadCommentUpdate;

exports.updateActivityEventFromCommentThread =
  activity.updateActivityEventFromCommentThread;

exports.updateActivityEventFromChatThreadMessage =
  activity.updateActivityEventFromChatThreadMessage;

exports.newCreateActivityEventFromCreatePostEndorsement =
  activity.newCreateActivityEventFromCreatePostEndorsement;

exports.newCreateOrUpdateActivityEventFromUpdatePostEndorsement =
  activity.newCreateOrUpdateActivityEventFromUpdatePostEndorsement;

exports.createActivityEventFromPostMention = createActivityEventFromPostMention;

exports.createActivityEventFromRoomPing =
  activity.createActivityEventFromRoomPing;

exports.updateUserFollowers = activity.updateUserFollowers;
exports.createActivityEventFromFollowerChange =
  activity.createActivityEventFromFollowerChange;

exports.createOrUpdateActivityEventFromPersonaVisibilityOrACLChange =
  activity.createOrUpdateActivityEventFromPersonaVisibilityOrACLChange;

exports.createActivityEventFromRemix = activity.createActivityEventFromRemix;

exports.createOrUpdateActivityEventFromUpdateThreadCommentEndorsement =
  createOrUpdateActivityEventFromUpdateThreadCommentEndorsement;

exports.createStaffActivityEventForNewUser = createStaffActivityEventForNewUser;

exports.updateActivityEventFromCommunityChat =
  activity.updateActivityEventFromCommunityChat;
exports.createActivityEventFromCommunityChatThread =
  activity.createActivityEventFromCommunityChatThread;
exports.updateActivityEventFromCommunityChatThreadMessage =
  activity.updateActivityEventFromCommunityChatThreadMessage;

exports.updateActivityEventFromCommunityUpdate =
  activity.updateActivityEventFromCommunityUpdate;

exports.createActivityEventFromNewProposal = createActivityEventFromNewProposal;
exports.createNotificationTasksFromNewProposal =
  createNotificationTasksFromNewProposal;
exports.updateProposalActivityEventsAndTasksFromProposalChange =
  updateProposalActivityEventsAndTasksFromProposalChange;

exports.createActivityEventFromTransfer = createActivityEventFromTransfer;

exports.createActivityEventFromCommunityChatThreadMessageEndorsement =
  createActivityEventFromCommunityChatThreadMessageEndorsement;
exports.createActivityEventFromPersonaPostThreadCommentEndorsement =
  createActivityEventFromPersonaPostThreadCommentEndorsement;
exports.createActivityEventFromPersonaChatThreadCommentEndorsement =
  createActivityEventFromPersonaChatThreadCommentEndorsement;
exports.createActivityEventFromCommunityPostThreadCommentEndorsement =
  createActivityEventFromCommunityPostThreadCommentEndorsement;

// feed management
exports.createGlobalFeedEventFromCommunityPost =
  feed.createGlobalFeedEventFromCommunityPost;
exports.updateGlobalFeedEventFromCommunityPost =
  feed.updateGlobalFeedEventFromCommunityPost;
exports.createGlobalFeedEventFromPost = feed.createGlobalFeedEventFromPost;
exports.updateGlobalFeedEventFromPost = feed.updateGlobalFeedEventFromPost;
exports.updateGlobalFeedEventFromPersona =
  feed.updateGlobalFeedEventFromPersona;

// story management
exports.createStoryFromPost = story.createStoryFromPost;
exports.updateStoryFromPost = story.updateStoryFromPost;
exports.createStoryFromPersona = story.createStoryFromPersona;
exports.updateStoryFromPersona = story.updateStoryFromPersona;
exports.createStoryCacheFromPost = story.createStoryCacheFromPost;
exports.updateStoryCacheFromPost = story.updateStoryCacheFromPost;
exports.createStoryCacheFromPersona = story.createStoryCacheFromPersona;
exports.updateStoryCacheFromPersona = story.updateStoryCacheFromPersona;

// misc
exports.recursiveDelete = recursiveDelete.recursiveDelete;
exports.recursiveMarkDelete = recursiveDelete.recursiveMarkDelete;

// caching
exports.updateFollowingCache = caching.updateFollowingCache;
exports.updatePersonaMemberOnCreate = caching.updatePersonaMemberOnCreate;
exports.updatePersonaMember = caching.updatePersonaMember;
exports.cachePersonaStatsOnPersonaCreate =
  caching.cachePersonaStatsOnPersonaCreate;
exports.cachePersonaStatsOnPersonaUpdate =
  caching.cachePersonaStatsOnPersonaUpdate;
exports.cachePersonaStatsOnPostCreate = caching.cachePersonaStatsOnPostCreate;
exports.cachePersonaStatsOnPostUpdate = caching.cachePersonaStatsOnPostUpdate;
exports.cacheLatestChatOnMessageCreate = caching.cacheLatestChatOnMessageCreate;
exports.cacheLatestChatOnMessageUpdate = caching.cacheLatestChatOnMessageUpdate;
exports.addUserPostsUnSeen = feed.addUserPostsUnSeen;
exports.updateUserPostsUnSeen = feed.updateUserPostsUnSeen;
exports.updateUserPostsUnSeenFromCuration =
  feed.updateUserPostsUnSeenFromCuration;
exports.cacheDraftCreate = caching.cacheDraftCreate;
exports.cacheDraftUpdate = caching.cacheDraftUpdate;

// backup
exports.scheduledFirestoreExport = backup.scheduledFirestoreExport;

exports.createUser = createUser;
exports.createUserWithPhoneNumber = createUserWithPhoneNumber;
exports.finishUserSignup = finishUserSignup;
exports.finishUserSignupInviteViaLinkSupport = finishUserSignupInviteViaLinkSupport;
exports.addAccessToExistingUser = addAccessToExistingUser;
exports.createInlineProposalMessage = createInlineProposalMessage;
exports.createInlineTransferMessage = createInlineTransferMessage;
exports.cleanPresenceData = cleanPresenceData;
exports.createInlinePostMessage = createInlinePostMessage;
exports.updateInlinePostMessage = updateInlinePostMessage;
exports.updateInlineProposalMessage = updateInlineProposalMessage;
exports.inviteNewUserByPhone = inviteNewUserByPhone;
exports.inviteNewUserByEmail = inviteNewUserByEmail;
exports.createPushNotificationFromInvite = createPushNotificationFromInvite;
exports.taskRunner = taskRunner;
exports.sentryHook = sentryHook;
