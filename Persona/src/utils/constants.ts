import colors from 'resources/colors';
export const ACTIVITY_TEXT_MAX_LENGTH = 125;
export const ACTIVITY_POST_PREVIEW_TEXT_MAX_LENGTH = 125;
export const ACTIVITY_PREVIEW_COLOR = colors.textFaded;
export const ACTIVITY_PREVIEW_TEXT_SIZE = 14;
export const MEDIA_SIZE = 100;
export const ACTIVITY_ICON_SIZE = 22;
export const ACTIVITY_PROFILE_SIZE = 36;
export const ACTIIVTY_TINY_PROFILE_SIZE = 15;
export const ITEM_BOTTOM_MARGIN = 8.4;
export const ITEM_TOP_MARGIN = 14.2;
export const ACTIVITY_FONT_SIZE = 14;

export const MEMBER_RIGHTS = {
	readChatPost: true,
  writePost: true,
  writeChat: true,
  withdrawal: false,
  createProposal: true,
  voteProposal: true,
  invite: true,
  createChannel: true,
  editChannel: true,
  createFundraisingPost: true,
  canPinPost: true,
  canCreateEvent: true,
};

export const MEMBER_ROLE = {
  title: 'member',
  price: 0,
  rights: MEMBER_RIGHTS,
  tier: 3,
};

export const ADMIN_RIGHTS = {
	...MEMBER_RIGHTS,
	withdrawal: true
};

export const ADMIN_ROLE = {
  title: 'admin',
  price: 0,
  rights: ADMIN_RIGHTS,
  tier: 1,
};