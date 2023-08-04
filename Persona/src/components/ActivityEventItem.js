import {BlurView} from '@react-native-community/blur';
import {MessageModalStateRefContext} from 'state/MessageModalStateRef';
import auth from '@react-native-firebase/auth';
import {ProfileModalStateContext} from 'state/ProfileModalState';
import firestore from '@react-native-firebase/firestore';
import ActivityEventApplication from 'components/ActivityEventApplication';
import ActivityEventSimple from 'components/ActivityEventSimple';
import MarkDown from 'components/MarkDown';
import ParseText from 'components/ParseText';
import PostMedia from 'components/PostMedia';
import React, {useContext} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import fonts from 'resources/fonts';
import images from 'resources/images';
import baseText from 'resources/text';
//import {ActivityModalStateRefContext} from 'state/ActivityModalStateRef';
import {POST_TYPE_ARTIST} from 'state/PostState';
import {isPersonaAccessible, truncate} from 'utils/helpers';
import colors from 'resources/colors';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import getResizedImageUrl from 'utils/media/resize';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {
    useNavToCommunityChat,
    useNavToPersona,
    useNavToPersonaChat,
    useNavToPostDiscussion,
    useNavToCommunityPostDiscussion,
    useNavToPersonaTransfers,
    useNavToCommunityTransfers,
    useNavToMyProfile,
    useNavToDMChat,
} from 'hooks/navigationHooks';
import {
    ACTIIVTY_TINY_PROFILE_SIZE,
    ACTIVITY_FONT_SIZE,
    ACTIVITY_ICON_SIZE,
    ACTIVITY_POST_PREVIEW_TEXT_MAX_LENGTH,
    ACTIVITY_PREVIEW_COLOR,
    ACTIVITY_PREVIEW_TEXT_SIZE,
    ACTIVITY_TEXT_MAX_LENGTH,
    ITEM_BOTTOM_MARGIN,
    ITEM_TOP_MARGIN,
    MEDIA_SIZE,
} from 'utils/constants';
import {TitleText} from './shared/TitleText';
import {ACTIVITY_TINY_PROFILE_SIZE} from './ActivityEventSimple';
import {useBecomeAuthor} from './CommunityMenu';
import {CommunityStateRefContext} from 'state/CommunityStateRef';

let ACCEPT_INCOG_SIZE = 28;
let ACCEPT_PEOPLE_SIZE = 28;
let ACCEPT_FEATHER_SIZE = 28;
let ACCEPT_WIDTH = 200;
let ACCEPT_HEIGHT = 40;
let ACCEPT_BUBBLE_SIZE = 30;

export default function ActivityEventItem({navigation, event}) {
    const {
        current: {personaMap, user},
    } = useContext(GlobalStateRefContext);
    const {
        current: {communityMap},
    } = useContext(CommunityStateRefContext);

    const profileModalContext = React.useContext(ProfileModalStateContext);
    const eventItem = React.useCallback(() => {
        let eventBody;
        let icon;
        let preview;
        const isDM = event.persona_id === SYSTEM_DM_PERSONA_ID;
        const isProjectAllChat = event.isProjectAllChat;
        const isCommunityAllChat = event.isCommunityAllChat;
        const isArtistPost = event.post?.type === POST_TYPE_ARTIST;
        const isGalleryPost = event.post?.mediaType === 'gallery';
        const isAudioPost = event.post?.mediaType === 'audio';
        const isVideoPost = event.post?.mediaType === 'video';
        const isImageAvailable =
            event.post?.mediaType === 'photo' &&
            event.post?.mediaUrl?.length > 0;
        const isTextAvailable = event.post?.text?.length > 0;
        const isTitleAvailable = event.post?.title?.length > 0;
        const isTextContentAvailable = isTextAvailable || isTitleAvailable;
        const shouldHidePreview =
            (isAudioPost || isVideoPost) &&
            !isTextAvailable &&
            !isTitleAvailable;

        const postPreview = () => {
            if (shouldHidePreview) {
                return null;
            }
            // if (isArtistPost && !event?.subPersona) {
            //     const subPersonaID = event.post.subPersonaID;
            //     event.subPersona = {};
            //     event.subPersona.id = subPersonaID;
            //     if (!personaMap[subPersonaID]) {
            //         // Subpersona was deleted
            //         event.subPersona.data = {
            //             deleted: true,
            //             name: 'This persona has since been deleted',
            //         };
            //     } else {
            //         event.subPersona.data = personaMap[subPersonaID];
            //     }
            // }
            return (
                <View
                    style={{
                        marginTop: 10,
                        marginBottom: ITEM_BOTTOM_MARGIN,
                        borderColor: colors.seperatorLineColor,
                        borderWidth: 0.4,
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        padding: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    {!isArtistPost && (
                        <View style={{flexDirection: 'row'}}>
                            {(isImageAvailable || isGalleryPost) && (
                                <View
                                    style={{
                                        marginRight: isTextContentAvailable
                                            ? 15
                                            : 0,
                                    }}>
                                    <PostMedia
                                        post={event.post}
                                        size={
                                            isTextAvailable || isTitleAvailable
                                                ? 'mini'
                                                : 'thumbnail'
                                        }
                                    />
                                </View>
                            )}
                            {(isTextAvailable || isTitleAvailable) && (
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        flex: 1,
                                    }}>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}>
                                        {isAudioPost && isTitleAvailable && (
                                            <FastImage
                                                style={Styles.mediaTypeIcon}
                                                color={ACTIVITY_PREVIEW_COLOR}
                                                source={images.audio}
                                            />
                                        )}
                                        {isVideoPost && isTitleAvailable && (
                                            <FastImage
                                                style={Styles.mediaTypeIcon}
                                                color={ACTIVITY_PREVIEW_COLOR}
                                                source={images.videoCamera}
                                            />
                                        )}
                                        {isTitleAvailable && (
                                            <Text
                                                numberOfLines={
                                                    isImageAvailable &&
                                                    !isTextAvailable
                                                        ? 3
                                                        : 1
                                                }
                                                style={{
                                                    ...baseText,
                                                    color: ACTIVITY_PREVIEW_COLOR,
                                                    fontSize:
                                                        ACTIVITY_PREVIEW_TEXT_SIZE,
                                                    fontFamily: fonts.bold,
                                                    marginBottom:
                                                        isTextAvailable ? 5 : 0,
                                                    flexShrink: 1,
                                                }}>
                                                {event.post?.title}
                                            </Text>
                                        )}
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            flex: 1,
                                        }}>
                                        {isAudioPost && !isTitleAvailable && (
                                            <FastImage
                                                style={Styles.mediaTypeIcon}
                                                color={ACTIVITY_PREVIEW_COLOR}
                                                source={images.audio}
                                            />
                                        )}
                                        {isVideoPost && !isTitleAvailable && (
                                            <FastImage
                                                style={Styles.mediaTypeIcon}
                                                color={ACTIVITY_PREVIEW_COLOR}
                                                source={images.videoCamera}
                                            />
                                        )}
                                        {isTextAvailable && (
                                            <View
                                                style={{
                                                    flex: 1,
                                                    marginTop: -12,
                                                }}>
                                                <MarkDown
                                                    fontSize={
                                                        ACTIVITY_PREVIEW_TEXT_SIZE -
                                                        1
                                                    }
                                                    numberOfLines={2}
                                                    fontFamily={fonts.system}
                                                    style={{
                                                        color: ACTIVITY_PREVIEW_COLOR,
                                                        fontSize:
                                                            ACTIVITY_PREVIEW_TEXT_SIZE,
                                                        fontFamily:
                                                            fonts.system,

                                                        fontStyle: 'italic',
                                                    }}
                                                    text={truncate(
                                                        event.post.text,
                                                        {
                                                            maxLength:
                                                                ACTIVITY_POST_PREVIEW_TEXT_MAX_LENGTH,
                                                            useWordBoundary: true,
                                                        },
                                                    )}
                                                />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                    {isArtistPost && event?.subPersona && (
                        <View
                            style={{
                                flexDirection: 'row',
                                flex: 1,
                                alignItems: 'center',
                            }}>
                            <FastImage
                                style={{
                                    ...Styles.profilePicture,
                                    opacity: event.subPersona?.data?.deleted
                                        ? 0.7
                                        : 1,
                                }}
                                source={{
                                    uri: getResizedImageUrl({
                                        width: ACTIVITY_ICON_SIZE,
                                        height: ACTIVITY_ICON_SIZE,
                                        origUrl:
                                            personaMap[event?.subPersona?.id]
                                                ?.profileImgUrl ||
                                            images.personaDefaultProfileUrl,
                                    }),
                                }}
                            />
                            <View
                                style={{
                                    flexDirection: 'column',
                                    flex: 1,
                                    marginLeft: 10,
                                    alignContent: 'center',
                                }}>
                                {!!event?.subPersona?.data?.name && (
                                    <Text
                                        numberOfLines={2}
                                        style={{
                                            ...baseText,
                                            color: ACTIVITY_PREVIEW_COLOR,
                                            fontSize:
                                                ACTIVITY_PREVIEW_TEXT_SIZE,
                                            fontFamily: fonts.bold,
                                            opacity: event.subPersona?.data
                                                ?.deleted
                                                ? 0.7
                                                : 1,
                                        }}>
                                        {event.subPersona.data.name}
                                    </Text>
                                )}
                                {!!event?.subPersona?.data?.bio && (
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            ...baseText,
                                            color: ACTIVITY_PREVIEW_COLOR,
                                            fontSize:
                                                ACTIVITY_PREVIEW_TEXT_SIZE,
                                            fontFamily: fonts.system,
                                        }}>
                                        {event.subPersona.data.bio}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            );
        };

        const getPostDisplayAction = () => {
            let actionType;
            if (
                event.post.type === POST_TYPE_ARTIST &&
                event.event_type === 'new_post_from_collaborator'
            ) {
                return 'created a new persona in';
            } else {
                let displayMediaType;
                if (event.event_type === 'post_edit_from_collaborator') {
                    actionType = 'edited';
                } else {
                    actionType = `${
                        event?.post?.published ? 'published' : 'drafted'
                    }`;
                }
                if (shouldHidePreview) {
                    if (isAudioPost) {
                        displayMediaType = 'an audio post';
                    } else if (isVideoPost) {
                        displayMediaType = 'a video post';
                    } else if (isArtistPost) {
                        displayMediaType = 'a persona post';
                    } else {
                        displayMediaType = 'a post';
                    }
                } else {
                    displayMediaType = 'a post';
                }
                return `${actionType} ${displayMediaType}`;
            }
        };
        const displayCreatedByUsers = createdByUsers => {
            const getDisplayName = createdByUser => {
                return createdByUser.isAnonymous
                    ? createdByUser.name
                    : createdByUser.userName;
            };
            if (createdByUsers.length === 1) {
                return (
                    <Text
                        style={{
                            ...baseText,
                            fontSize: ACTIVITY_FONT_SIZE,
                            fontFamily: fonts.bold,
                            color: colors.postAction,
                        }}>
                        {getDisplayName(createdByUsers[0])}
                    </Text>
                );
            } else if (createdByUsers.length < 3) {
                const tail = (
                    <Text
                        style={{
                            ...baseText,
                            fontSize: ACTIVITY_FONT_SIZE,
                            fontFamily: fonts.bold,
                            color: colors.postAction,
                        }}>
                        {getDisplayName(
                            createdByUsers[createdByUsers.length - 1],
                        )}
                    </Text>
                );
                const rest = createdByUsers
                    .slice(0, createdByUsers.length - 1)
                    .map(cu => (
                        <Text
                            key={`${event.id}-${cu.id}`}
                            style={{
                                ...baseText,
                                fontSize: ACTIVITY_FONT_SIZE,
                                color: colors.postAction,
                                fontFamily: fonts.bold,
                            }}>
                            {getDisplayName(cu)}
                        </Text>
                    ));
                return (
                    <Text
                        style={{
                            ...baseText,
                            color: colors.postAction,
                            fontSize: ACTIVITY_FONT_SIZE,
                        }}>
                        {rest} and {tail}
                    </Text>
                );
            } else {
                const maxNumUsersToShow = 10;
                const numAdditionalUsers =
                    createdByUsers.length - maxNumUsersToShow;
                const usersToShow = createdByUsers
                    .slice(0, maxNumUsersToShow)
                    .map((cu, index) => (
                        <Text
                            key={`${event.id}-${cu.id}`}
                            style={{
                                ...baseText,
                                fontFamily: fonts.bold,
                                fontSize: ACTIVITY_FONT_SIZE,
                            }}>
                            {getDisplayName(cu)}
                            {index <
                            Math.min(maxNumUsersToShow, createdByUsers.length) -
                                2
                                ? ', '
                                : ''}
                        </Text>
                    ));
                if (numAdditionalUsers > 0) {
                    return (
                        <Text
                            style={{...baseText, fontSize: ACTIVITY_FONT_SIZE}}>
                            {usersToShow} and {numAdditionalUsers} other user
                            {numAdditionalUsers === 1 ? '' : 's'}
                        </Text>
                    );
                } else {
                    const head = usersToShow.slice(0, usersToShow.length - 1);
                    const tail = usersToShow[usersToShow.length - 1];
                    return (
                        <Text
                            style={{...baseText, fontSize: ACTIVITY_FONT_SIZE}}>
                            {head} and {tail}
                        </Text>
                    );
                }
            }
        };
        const displayEndorsements = endorsements => {
            if (endorsements.length === 1) {
                return endorsements[0];
            } else {
                const tail = endorsements[endorsements.length - 1];
                const rest = endorsements.slice(0, endorsements.length - 1);
                return `${rest.join(', ')} and ${tail}`;
            }
        };
        switch (event.event_type) {
            case 'post_endorsement':
                eventBody = () => {
                    const displayPostType = () => {
                        if (shouldHidePreview) {
                            if (isAudioPost) {
                                return 'audio';
                            } else if (isVideoPost) {
                                return 'video';
                            } else {
                                return '';
                            }
                        } else {
                            return '';
                        }
                    };
                    return (
                        <>
                            <TitleText>
                                {displayCreatedByUsers(event.createdByUsers)}
                            </TitleText>
                            <TitleText>
                                {' '}
                                reacted with{' '}
                                {displayEndorsements(
                                    event.endorsements,
                                )} to{' '}
                                {user.id === event.post.userID ? 'your ' : 'a '}
                                {displayPostType()}
                                post
                            </TitleText>
                            {!isTitleAvailable && (
                                <TitleText>
                                    {' '}
                                    on{' '}
                                    <TitleText style={{fontFamily: fonts.bold}}>
                                        {event.persona.name}
                                    </TitleText>
                                </TitleText>
                            )}
                        </>
                    );
                };
                preview = postPreview;
                icon = (
                    <Feather
                        name="heart"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={preview}
                        />
                    </View>
                );
            case 'comment_endorsement':
            case 'post_thread_comment_endorsement':
            case 'chat_endorsement':
            case 'chat_thread_comment_endorsement':
            case 'chat_thread_message_endorsement':
                eventBody = () => (
                    <>
                        <TitleText>
                            {displayCreatedByUsers(event.createdByUsers)}
                        </TitleText>
                        <TitleText>
                            {' '}
                            reacted {displayEndorsements(event.endorsements)} to
                            your message{' '}
                            {event?.message?.isThread ? ' in a thread ' : ''}
                        </TitleText>
                    </>
                );
                icon = (
                    <Ionicons
                        name="ios-heart-circle-outline"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                preview = () => <ChatPreview event={event} />;
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={preview}
                        />
                    </View>
                );
                eventBody = () => (
                    <>
                        <TitleText style={{fontFamily: fonts.bold}}>
                            {displayCreatedByUsers(event.createdByUsers)}
                        </TitleText>
                        {event.persona_id === SYSTEM_DM_PERSONA_ID ? (
                            <>
                                <TitleText>
                                    {' '}
                                    reacted to your message with{' '}
                                    {displayEndorsements(event.endorsements)}
                                </TitleText>
                            </>
                        ) : (
                            <>
                                <TitleText>
                                    {' '}
                                    reacted with{' '}
                                    {displayEndorsements(event.endorsements)} to
                                    your message about
                                    {isTitleAvailable ? ' ' : ' a post '}
                                </TitleText>
                                {isTitleAvailable ? (
                                    <TitleText
                                        style={{
                                            fontFamily: fonts.bold,
                                        }}>
                                        {event?.post?.title}
                                    </TitleText>
                                ) : (
                                    <>
                                        <TitleText>in </TitleText>
                                        <TitleText
                                            style={{fontFamily: fonts.bold}}>
                                            {event.persona.name}
                                        </TitleText>
                                    </>
                                )}
                            </>
                        )}
                    </>
                );
                icon = (
                    <Ionicons
                        name="ios-heart-circle-outline"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                preview = () => {
                    return (
                        <View
                            style={{
                                marginTop: ITEM_TOP_MARGIN,
                                marginBottom: ITEM_BOTTOM_MARGIN,
                            }}>
                            {event.message?.mediaUrl?.length > 0 && (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        marginBottom: event.message.text
                                            ? ITEM_BOTTOM_MARGIN
                                            : 0,
                                    }}>
                                    <FastImage
                                        source={{
                                            uri: getResizedImageUrl({
                                                origUrl: event.message.mediaUrl,
                                                width: MEDIA_SIZE,
                                                height: MEDIA_SIZE,
                                            }),
                                        }}
                                        style={{
                                            width: MEDIA_SIZE,
                                            height: MEDIA_SIZE,
                                        }}
                                    />
                                </View>
                            )}
                            {!!event.message.text && (
                                <ParseText
                                    style={{
                                        fontFamily: fonts.system,
                                        color: ACTIVITY_PREVIEW_COLOR,
                                        fontSize: ACTIVITY_PREVIEW_TEXT_SIZE,
                                        fontStyle: 'italic',
                                    }}
                                    text={truncate(event.message.text, {
                                        maxLength: ACTIVITY_TEXT_MAX_LENGTH,
                                        useWordBoundary: true,
                                    })}
                                />
                            )}
                        </View>
                    );
                };
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={preview}
                        />
                    </View>
                );
            case 'authorInvitation':
                eventBody = () => (
                    <>
                        <TitleText
                            style={{fontFamily: fonts.bold, color: 'white'}}>
                            {event.createdByUser.userName}
                        </TitleText>
                        <TitleText> invited you to collaborate on </TitleText>
                        <TitleText
                            style={{
                                fontFamily: event.persona.name
                                    ? fonts.bold
                                    : fonts.regular,
                                color: colors.postAction,
                            }}>
                            {event.persona.name
                                ? event.persona.name
                                : 'a new persona'}
                        </TitleText>
                    </>
                );
                icon = (
                    <Feather
                        name="users"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={() => (
                                <InviteButton personaID={event.persona_id} />
                            )}
                        />
                    </View>
                );
            case 'communityInvitation':
                eventBody = () => (
                    <>
                        <TitleText style={{fontFamily: fonts.bold}}>
                            {event.createdByUser.userName}
                        </TitleText>
                        <TitleText> invited you to follow </TitleText>
                        <TitleText
                            style={{
                                fontFamily: event.persona.name
                                    ? fonts.bold
                                    : fonts.regular,
                            }}>
                            {event.persona.name
                                ? event.persona.name
                                : 'a new persona'}
                        </TitleText>
                    </>
                );
                icon = (
                    <Feather
                        name="users"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <>
                        <View
                            style={{
                                ...Styles.eventItemContainer,
                            }}>
                            <ActivityEventSimple
                                eventBody={eventBody}
                                event={event}
                                navigation={navigation}
                                icon={icon}
                                preview={() => (
                                    <InviteCommunityButton
                                        personaID={event.persona_id}
                                    />
                                )}
                            />
                        </View>
                    </>
                );
            case 'communityChange':
                eventBody = () => (
                    <>
                        <TitleText style={{fontFamily: fonts.bold}}>
                            {event.createdByUser.userName}
                        </TitleText>
                        <TitleText> followed </TitleText>
                        <TitleText
                            style={{
                                fontFamily: event.persona.name
                                    ? fonts.bold
                                    : fonts.regular,
                            }}>
                            {event.persona.name
                                ? event.persona.name
                                : 'a new persona'}
                        </TitleText>
                    </>
                );
                icon = (
                    <Feather
                        name="users"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <>
                        <View
                            style={{
                                ...Styles.eventItemContainer,
                            }}>
                            <ActivityEventSimple
                                eventBody={eventBody}
                                event={event}
                                navigation={navigation}
                                icon={icon}
                            />
                        </View>
                    </>
                );
            case 'authorChange':
                eventBody = () => (
                    <>
                        <TitleText style={{fontFamily: fonts.bold}}>
                            {event.createdByUser.userName}
                        </TitleText>
                        <TitleText>
                            {' '}
                            {event.isAuthor
                                ? 'is now an author'
                                : 'is no longer an author'}{' '}
                            on{' '}
                        </TitleText>
                        <TitleText
                            style={{
                                fontFamily: event.persona.name
                                    ? fonts.bold
                                    : fonts.regular,
                            }}>
                            {event.persona.name
                                ? event.persona.name
                                : 'a new persona'}
                        </TitleText>
                    </>
                );
                icon = (
                    <Feather
                        name="users"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <>
                        <View
                            style={{
                                ...Styles.eventItemContainer,
                            }}>
                            <ActivityEventSimple
                                eventBody={eventBody}
                                event={event}
                                navigation={navigation}
                                icon={icon}
                            />
                        </View>
                    </>
                );
            case 'user_profile_follow':
                eventBody = () => (
                    <>
                        <TitleText style={{fontFamily: fonts.bold}}>
                            {event.createdByUser.userName}
                        </TitleText>
                        <TitleText> is now following you </TitleText>
                    </>
                );
                icon = (
                    <Feather
                        name="users"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <>
                        <View
                            style={{
                                ...Styles.eventItemContainer,
                            }}>
                            <ActivityEventSimple
                                eventBody={eventBody}
                                event={event}
                                navigation={navigation}
                                icon={icon}
                            />
                        </View>
                    </>
                );
            case 'application':
                eventBody = () => (
                    <>
                        <TitleText style={{fontFamily: fonts.bold}}>
                            {event.createdByUser.userName}
                        </TitleText>
                        <TitleText>
                            {' '}
                            applied to collaborate on your persona{' '}
                        </TitleText>
                        <TitleText style={{fontFamily: fonts.bold}}>
                            {event.persona.name}
                        </TitleText>
                    </>
                );
                icon = (
                    <Feather
                        name="users"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventApplication
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                        />
                    </View>
                );
            case 'post_comment':
            case 'post_thread_comment':
            case 'post_new_discussion':
            case 'post_continued_discussion':
                icon = (
                    <Feather
                        name="message-circle"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                preview = () => <ChatPreview event={event} />;
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={preview}
                        />
                    </View>
                );
            case 'discussion':
                eventBody = () => {
                    const bodyText = () => {
                        if (isDM) {
                            if (event.endorsements) {
                                return (
                                    <TitleText>
                                        {' '}
                                        reacted to your message
                                    </TitleText>
                                );
                            } else {
                                if (event?.message?.isThread) {
                                    return (
                                        <TitleText>
                                            {' '}
                                            sent you a message on a thread
                                        </TitleText>
                                    );
                                } else {
                                    return (
                                        <TitleText>
                                            {' '}
                                            sent you a message
                                        </TitleText>
                                    );
                                }
                            }
                        } else if (isProjectAllChat || isCommunityAllChat) {
                            if (event.endorsements) {
                                return (
                                    <TitleText>
                                        {' '}
                                        reacted to your message
                                    </TitleText>
                                );
                            } else {
                                if (event?.message?.isThread) {
                                    return (
                                        <TitleText>
                                            {' '}
                                            {event.createdByUsers?.length > 1
                                                ? 'are chatting on a thread on '
                                                : 'is chatting on a thread on '}
                                            <Text style={{fontWeight: 'bold'}}>
                                                {event?.persona?.name ||
                                                    event?.community?.name}
                                            </Text>
                                        </TitleText>
                                    );
                                } else {
                                    return (
                                        <TitleText>
                                            {' '}
                                            {event.createdByUsers?.length > 1
                                                ? 'are chatting on '
                                                : 'is chatting on '}
                                            <Text style={{fontWeight: 'bold'}}>
                                                {event?.persona?.name ||
                                                    event?.community?.name}
                                            </Text>
                                        </TitleText>
                                    );
                                }
                            }
                        }

                        if (event?.comment?.isThread) {
                            return (
                                <TitleText>
                                    {' '}
                                    replied on a discussion in a thread{' '}
                                </TitleText>
                            );
                        } else {
                            return (
                                <TitleText> replied on a discussion </TitleText>
                            );
                        }
                    };

                    return (
                        <TitleText>
                            <TitleText>
                                {displayCreatedByUsers(event.createdByUsers)}
                            </TitleText>
                            {bodyText()}
                            {!isDM &&
                                !isTitleAvailable &&
                                !isProjectAllChat &&
                                !isCommunityAllChat && (
                                    <TitleText>
                                        on a post in{' '}
                                        <TitleText
                                            style={{fontFamily: fonts.bold}}>
                                            {event?.persona?.name ||
                                                event?.community?.name}
                                        </TitleText>
                                    </TitleText>
                                )}
                        </TitleText>
                    );
                };
                icon = (
                    <Feather
                        name="message-circle"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                preview = () => {
                    const additionalEventText = () => {
                        const numComments = event.eventList.filter(
                            ev =>
                                ev.event_type === 'post_comment' ||
                                ev.event_type === 'post_thread_comment' ||
                                ev.event_type === 'chat_message' ||
                                ev.event_type === 'chat_thread_message',
                        ).length;
                        const reactions = event.eventList.filter(
                            ev =>
                                ev.event_type === 'comment_endorsement' ||
                                ev.event_type === 'chat_endorsement' ||
                                ev.event_type ===
                                    'post_thread_comment_endorsement',
                        );
                        const numReactions = reactions.length;
                        let textArr = [];
                        if (numComments > 0) {
                            let additionalEventsStr;
                            if (isDM) {
                                additionalEventsStr =
                                    'message' + (numComments === 1 ? '' : 's');
                            } else {
                                additionalEventsStr =
                                    numComments === 1 ? 'reply' : 'replies';
                            }
                            textArr.push(
                                `${numComments} ${additionalEventsStr}`,
                            );
                        }
                        if (numReactions > 0) {
                            let allReactions;
                            // Don't show reaction emojis if we're already showing an
                            // endorsement event in the preview -- too many emojis
                            if (
                                ![
                                    'comment_endorsement',
                                    'chat_endorsement',
                                    'post_thread_comment_endorsement',
                                ].includes(
                                    event.eventList[event.numEvents - 1]
                                        .event_type,
                                )
                            ) {
                                allReactions = new Set(
                                    reactions.flatMap(ev => ev.endorsements),
                                );
                            }
                            textArr.push(
                                `${numReactions} ${
                                    numReactions === 1
                                        ? 'reaction'
                                        : 'reactions'
                                }${
                                    allReactions
                                        ? ' ' + [...allReactions].join('')
                                        : ''
                                }`,
                            );
                        }
                        return textArr.join(' and ');
                    };
                    const commentPreview = () => {
                        const obj = event.comment || event.message || null;
                        if (obj === null) {
                            return null;
                        } else {
                            return (
                                <View
                                    style={{
                                        marginTop: ITEM_TOP_MARGIN,
                                        marginBottom: ITEM_BOTTOM_MARGIN,
                                    }}>
                                    {obj?.mediaUrl?.length > 0 && (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                marginBottom: obj?.text
                                                    ? ITEM_BOTTOM_MARGIN
                                                    : 0,
                                            }}>
                                            <FastImage
                                                source={{
                                                    uri: getResizedImageUrl({
                                                        origUrl: obj?.mediaUrl,
                                                        width: MEDIA_SIZE,
                                                        height: MEDIA_SIZE,
                                                    }),
                                                }}
                                                style={{
                                                    width: MEDIA_SIZE,
                                                    height: MEDIA_SIZE,
                                                }}
                                            />
                                        </View>
                                    )}
                                    {!!obj.text && (
                                        <View style={{flexDirection: 'row'}}>
                                            {event.createdByUsers.length >
                                                1 && (
                                                <FastImage
                                                    style={
                                                        Styles.tinyProfilePicture
                                                    }
                                                    source={{
                                                        uri:
                                                            (event.isAnonymous
                                                                ? event.identity
                                                                      .profileImgUrl
                                                                : event
                                                                      .createdByUser
                                                                      .profileImgUrl ||
                                                                  images.userDefaultProfileUrl) !==
                                                            images.userDefaultProfileUrl
                                                                ? getResizedImageUrl(
                                                                      {
                                                                          origUrl:
                                                                              event.isAnonymous
                                                                                  ? event
                                                                                        .identity
                                                                                        .profileImgUrl
                                                                                  : event
                                                                                        .createdByUser
                                                                                        .profileImgUrl ||
                                                                                    images.userDefaultProfileUrl,
                                                                          width: ACTIIVTY_TINY_PROFILE_SIZE,
                                                                          height: ACTIIVTY_TINY_PROFILE_SIZE,
                                                                      },
                                                                  )
                                                                : images.userDefaultProfileUrl,
                                                    }}
                                                />
                                            )}
                                            <ParseText
                                                style={{
                                                    fontFamily: fonts.system,
                                                    color: ACTIVITY_PREVIEW_COLOR,
                                                    fontSize:
                                                        ACTIVITY_PREVIEW_TEXT_SIZE,
                                                    marginRight: 20,
                                                    fontStyle: 'italic',
                                                }}
                                                text={truncate(obj.text, {
                                                    maxLength:
                                                        ACTIVITY_TEXT_MAX_LENGTH,
                                                    useWordBoundary: true,
                                                })}
                                            />
                                        </View>
                                    )}
                                    {event.numEvents > 1 && (
                                        <Text
                                            style={{
                                                ...baseText,
                                                color: ACTIVITY_PREVIEW_COLOR,
                                                fontSize:
                                                    ACTIVITY_PREVIEW_TEXT_SIZE,
                                                alignSelf: 'flex-start',
                                                justifyContent: 'flex-end',
                                                marginTop: ITEM_TOP_MARGIN,
                                            }}>
                                            {additionalEventText()}
                                        </Text>
                                    )}
                                </View>
                            );
                        }
                    };
                    const endorsementPreview = () => {
                        const obj = event.comment || event.message || null;
                        return (
                            <View
                                style={{
                                    marginTop: ITEM_TOP_MARGIN,
                                    marginBottom: ITEM_BOTTOM_MARGIN,
                                }}>
                                {obj?.mediaUrl?.length > 0 && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            marginBottom: obj.text
                                                ? ITEM_BOTTOM_MARGIN
                                                : 0,
                                        }}>
                                        <FastImage
                                            source={{
                                                uri: getResizedImageUrl({
                                                    origUrl: obj?.mediaUrl,
                                                    width: MEDIA_SIZE,
                                                    height: MEDIA_SIZE,
                                                }),
                                            }}
                                            style={{
                                                width: MEDIA_SIZE,
                                                height: MEDIA_SIZE,
                                            }}
                                        />
                                    </View>
                                )}
                                {!!obj?.text && (
                                    <View style={{flexDirection: 'row'}}>
                                        {event.createdByUsers.length > 1 && (
                                            <FastImage
                                                style={
                                                    Styles.tinyProfilePicture
                                                }
                                                source={{
                                                    uri:
                                                        (user.profileImgUrl ||
                                                            images.userDefaultProfileUrl) ===
                                                        images.userDefaultProfileUrl
                                                            ? images.userDefaultProfileUrl
                                                            : getResizedImageUrl(
                                                                  {
                                                                      origUrl:
                                                                          user.profileImgUrl ||
                                                                          images.userDefaultProfileUrl,
                                                                      width: ACTIIVTY_TINY_PROFILE_SIZE,
                                                                      height: ACTIIVTY_TINY_PROFILE_SIZE,
                                                                  },
                                                              ),
                                                }}
                                            />
                                        )}
                                        <ParseText
                                            style={{
                                                fontFamily: fonts.system,
                                                color: ACTIVITY_PREVIEW_COLOR,
                                                fontSize:
                                                    ACTIVITY_PREVIEW_TEXT_SIZE,
                                                marginRight: 20,
                                            }}
                                            text={truncate(obj.text, {
                                                maxLength:
                                                    ACTIVITY_TEXT_MAX_LENGTH,
                                                useWordBoundary: true,
                                            })}
                                        />
                                    </View>
                                )}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        marginLeft: 10,
                                        marginTop: 5,
                                    }}>
                                    <FastImage
                                        style={Styles.tinyProfilePicture}
                                        source={{
                                            uri:
                                                ((event.isAnonymous
                                                    ? event?.identity
                                                          ?.profileImgUrl
                                                    : event?.createdByUser
                                                          ?.profileImgUrl) ||
                                                    images.userDefaultProfileUrl) ===
                                                images.userDefaultProfileUrl
                                                    ? images.userDefaultProfileUrl
                                                    : getResizedImageUrl({
                                                          origUrl:
                                                              (event.isAnonymous
                                                                  ? event
                                                                        ?.identity
                                                                        ?.profileImgUrl
                                                                  : event
                                                                        ?.createdByUser
                                                                        ?.profileImgUrl) ||
                                                              images.userDefaultProfileUrl,
                                                          width: ACTIIVTY_TINY_PROFILE_SIZE,
                                                          height: ACTIIVTY_TINY_PROFILE_SIZE,
                                                      }),
                                        }}
                                    />
                                    <Text
                                        style={{
                                            ...baseText,
                                            fontSize: ACTIVITY_FONT_SIZE,
                                        }}>
                                        {event.endorsements}
                                    </Text>
                                </View>
                                {event.numEvents > 1 && (
                                    <Text
                                        style={{
                                            ...baseText,
                                            color: ACTIVITY_PREVIEW_COLOR,
                                            fontSize:
                                                ACTIVITY_PREVIEW_TEXT_SIZE,
                                            alignSelf: 'flex-start',
                                            justifyContent: 'flex-end',
                                            marginTop: ITEM_TOP_MARGIN,
                                        }}>
                                        {additionalEventText()}
                                    </Text>
                                )}
                            </View>
                        );
                    };
                    return (
                        <>
                            {event.endorsements
                                ? endorsementPreview()
                                : commentPreview()}
                        </>
                    );
                };
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={preview}
                        />
                    </View>
                );
            case 'chat_message':
            case 'chat_thread_message':
                eventBody = () =>
                    event.persona_id === SYSTEM_DM_PERSONA_ID ? (
                        <>
                            <TitleText style={{fontFamily: fonts.bold}}>
                                {event.isAnonymous
                                    ? event.identity.name
                                    : event.createdByUser.userName}
                            </TitleText>
                            <TitleText> sent you a message</TitleText>
                            {event.message.isThread && (
                                <TitleText> in a thread</TitleText>
                            )}
                        </>
                    ) : event.isProjectAllChat || event.isCommunityAllChat ? (
                        <>
                            <TitleText style={{fontFamily: fonts.bold}}>
                                {event.isAnonymous
                                    ? event.identity.name
                                    : event.createdByUser.userName}
                            </TitleText>
                            <TitleText> is chatting </TitleText>
                            {event.message.isThread && (
                                <TitleText> in a thread </TitleText>
                            )}
                            <TitleText>on </TitleText>
                            <TitleText style={{fontFamily: fonts.bold}}>
                                {event?.persona?.name || event?.community?.name}
                            </TitleText>
                        </>
                    ) : (
                        <>
                            <TitleText>
                                {displayCreatedByUsers(event.createdByUsers)}
                            </TitleText>
                            <TitleText>
                                {' '}
                                is chatting with you about
                                {isTitleAvailable ? ' ' : ' a post '}
                            </TitleText>
                            {isTitleAvailable && (
                                <TitleText
                                    style={{
                                        fontFamily: fonts.bold,
                                    }}>
                                    {event?.post?.title}
                                </TitleText>
                            )}
                            {event.message.isThread && (
                                <TitleText> in a thread</TitleText>
                            )}
                            {!isTitleAvailable && (
                                <>
                                    <TitleText> on </TitleText>
                                    <TitleText style={{fontFamily: fonts.bold}}>
                                        {event.persona.name}
                                    </TitleText>
                                </>
                            )}
                        </>
                    );
                icon = (
                    <Feather
                        name="message-square"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                preview = () => <ChatPreview event={event} />;
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={preview}
                        />
                    </View>
                );
            case 'new_post_from_collaborator':
                eventBody = () => {
                    const getDisplayCreatedByUser = () => {
                        if (event.isAnonymous) {
                            if (
                                event?.identity.id !== event.persona_id &&
                                event?.identity.id !== event?.communityID &&
                                event?.identity.name
                            ) {
                                return event?.identity.name;
                            } else {
                                return 'An anonymous author';
                            }
                        } else {
                            return event.createdByUser.userName;
                        }
                    };
                    return (
                        <>
                            <TitleText style={{fontFamily: fonts.bold}}>
                                {getDisplayCreatedByUser()}{' '}
                            </TitleText>
                            <TitleText>{getPostDisplayAction()}</TitleText>
                            {isArtistPost && (
                                <TitleText style={{fontFamily: fonts.bold}}>
                                    {' '}
                                    {event?.community?.name ||
                                        event?.persona?.name}
                                </TitleText>
                            )}
                        </>
                    );
                };
                preview = postPreview;
                icon = (
                    <Feather
                        name="git-commit"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={postPreview}
                        />
                    </View>
                );
            case 'post_edit_from_collaborator':
                eventBody = () => (
                    <>
                        <TitleText style={{fontFamily: fonts.bold}}>
                            {event.post?.anonymous
                                ? 'A co-author'
                                : event.createdByUser.userName}
                        </TitleText>
                        <TitleText> {`${getPostDisplayAction()}`} </TitleText>
                    </>
                );
                preview = postPreview;
                icon = (
                    <Feather
                        name="git-merge"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={postPreview}
                        />
                    </View>
                );

            case 'post_mention':
                eventBody = () => {
                    return (
                        <>
                            <TitleText>
                                {displayCreatedByUsers(event.createdByUsers)}
                            </TitleText>
                            <TitleText> mentioned you on a post</TitleText>
                            {!isTitleAvailable && (
                                <TitleText>
                                    {' '}
                                    on
                                    <TitleText style={{fontFamily: fonts.bold}}>
                                        {event?.persona?.name ||
                                            event?.community?.name}
                                    </TitleText>
                                </TitleText>
                            )}
                        </>
                    );
                };
                icon = (
                    <Feather
                        name="heart"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                        />
                    </View>
                );

            case 'comment_mention':
            case 'comment_thread_mention':
                eventBody = () => (
                    <>
                        <TitleText>
                            {displayCreatedByUsers(event.createdByUsers)}
                        </TitleText>
                        {event.comment.isThread ? (
                            <TitleText>
                                {' '}
                                mentioned you in a discussion in a thread{' '}
                            </TitleText>
                        ) : (
                            <TitleText>
                                {' '}
                                mentioned you in a discussion{' '}
                            </TitleText>
                        )}
                        {!isTitleAvailable && (
                            <TitleText>
                                on a post in{' '}
                                <TitleText style={{fontFamily: fonts.bold}}>
                                    {event?.persona?.name ||
                                        event?.communitiy?.name}
                                </TitleText>
                            </TitleText>
                        )}
                    </>
                );
                icon = (
                    <Feather
                        name="message-circle"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                preview = () => (
                    <View
                        style={{
                            marginTop: ITEM_TOP_MARGIN,
                            marginBottom: ITEM_BOTTOM_MARGIN,
                        }}>
                        {event.comment?.mediaUrl?.length > 0 && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    marginBottom: event.comment.text
                                        ? ITEM_BOTTOM_MARGIN
                                        : 0,
                                }}>
                                <FastImage
                                    source={{
                                        uri: getResizedImageUrl({
                                            origUrl: event.comment.mediaUrl,
                                            width: MEDIA_SIZE,
                                            height: MEDIA_SIZE,
                                        }),
                                    }}
                                    style={{
                                        width: MEDIA_SIZE,
                                        height: MEDIA_SIZE,
                                    }}
                                />
                            </View>
                        )}
                        {!!event.comment.text && (
                            <ParseText
                                style={{
                                    fontFamily: fonts.system,
                                    color: ACTIVITY_PREVIEW_COLOR,
                                    fontSize: ACTIVITY_PREVIEW_TEXT_SIZE,
                                    marginRight: 20,
                                }}
                                text={truncate(event.comment.text, {
                                    maxLength: ACTIVITY_TEXT_MAX_LENGTH,
                                    useWordBoundary: true,
                                })}
                            />
                        )}
                    </View>
                );
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={preview}
                        />
                    </View>
                );
            case 'chat_mention':
            case 'chat_thread_mention':
                eventBody = () => (
                    <>
                        <TitleText>
                            {displayCreatedByUsers(event.createdByUsers)}
                        </TitleText>
                        {event.message.isThread ? (
                            <TitleText> mentioned you in a thread </TitleText>
                        ) : (
                            <TitleText> mentioned you </TitleText>
                        )}
                    </>
                );
                icon = (
                    <Feather
                        name="message-circle"
                        size={ACTIVITY_ICON_SIZE}
                        color={'white'}
                    />
                );
                preview = () => <ChatPreview event={event} />;
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            icon={icon}
                            preview={preview}
                        />
                    </View>
                );

            case 'community_join':
                eventBody = () => {
                    return (
                        <>
                            <TitleText>
                                {displayCreatedByUsers(event.createdByUsers)}
                            </TitleText>
                            <TitleText> joined your community on </TitleText>
                            <TitleText style={{fontFamily: fonts.bold}}>
                                {event.persona.name}
                            </TitleText>
                        </>
                    );
                };
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                        />
                    </View>
                );
            case 'room_audio_discussion':
            case 'room_users_present':
                eventBody = () => {
                    const isOrAre =
                        event.createdByUsers.length === 1 ? 'is' : 'are';
                    const copy =
                        event.event_type === 'room_audio_discussion'
                            ? `${isOrAre} talking`
                            : `${isOrAre} live`;
                    return (
                        <>
                            <TitleText>
                                {displayCreatedByUsers(event.createdByUsers)}{' '}
                                {copy}
                            </TitleText>
                            {!isTitleAvailable && (
                                <TitleText>
                                    on a post in{' '}
                                    <TitleText style={{fontFamily: fonts.bold}}>
                                        {event.persona.name}
                                    </TitleText>
                                </TitleText>
                            )}
                        </>
                    );
                };
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                        />
                    </View>
                );
            case 'room_ping':
                eventBody = () => {
                    const copy = 'requested you join';
                    return (
                        <>
                            <TitleText>
                                {displayCreatedByUsers(event.createdByUsers)}
                            </TitleText>
                            <TitleText> {copy} </TitleText>
                            {!isTitleAvailable && (
                                <TitleText>
                                    on a post in{' '}
                                    <TitleText style={{fontFamily: fonts.bold}}>
                                        {event.persona.name}
                                    </TitleText>
                                </TitleText>
                            )}
                        </>
                    );
                };
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                        />
                    </View>
                );
            case 'persona_delete':
                eventBody = () => {
                    return (
                        <>
                            <TitleText>
                                {displayCreatedByUsers(event.createdByUsers)}
                            </TitleText>
                            <TitleText> deleted </TitleText>
                            <TitleText style={{fontFamily: fonts.bold}}>
                                {event.persona.name}
                            </TitleText>
                        </>
                    );
                };
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                        />
                    </View>
                );
            case 'post_remix':
                eventBody = () => {
                    const getDisplayCreatedByUser = () => {
                        if (event.isAnonymous) {
                            if (
                                event?.identity.id !== event.persona_id &&
                                event?.identity.name
                            ) {
                                return event?.identity.name;
                            } else {
                                return 'An anonymous author';
                            }
                        } else {
                            return event.createdByUser.userName;
                        }
                    };
                    return (
                        <>
                            <TitleText style={{fontFamily: fonts.bold}}>
                                {getDisplayCreatedByUser()}{' '}
                            </TitleText>
                            <TitleText>remixed </TitleText>
                            <TitleText
                                style={{
                                    fontFamily: fonts.bold,
                                }}>
                                {event?.remixSourcePost?.title}{' '}
                            </TitleText>
                            <TitleText>from </TitleText>
                            <TitleText style={{fontFamily: fonts.bold}}>
                                {event?.remixSourcePersona?.name}{' '}
                            </TitleText>
                            <TitleText>onto </TitleText>
                            <TitleText style={{fontFamily: fonts.bold}}>
                                {event?.persona?.name}{' '}
                            </TitleText>
                        </>
                    );
                };
                preview = postPreview;
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            preview={postPreview}
                        />
                    </View>
                );
            case 'new_proposal':
            case 'proposal_ending_soon':
            case 'proposal_ended':
                preview = () => {
                    return (
                        <View
                            style={{
                                paddingLeft: 10,
                                paddingRight: 10,
                                paddingTop: 15,
                                paddingBottom: 15,
                                backgroundColor: colors.background,
                                borderRadius: 6,
                                marginBottom: 10,
                            }}>
                            <TitleText style={{fontWeight: 'bold'}}>
                                {event?.proposal?.title}
                            </TitleText>
                            {event?.proposal?.amount &&
                                event?.proposal?.currency &&
                                event?.proposal?.targetName && (
                                    <TitleText
                                        style={{
                                            color: colors.textFaded2,
                                            fontSize: 13,
                                        }}>
                                        Transfer {event?.proposal?.amount}{' '}
                                        {event?.proposal?.currency} →{' '}
                                        {event?.proposal?.targetName}
                                    </TitleText>
                                )}
                        </View>
                    );
                };
                return (
                    <View
                        style={{
                            ...Styles.eventItemContainer,
                        }}>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                            preview={preview}
                        />
                    </View>
                );

            case 'transfer':
                const targetName =
                    event?.target?.id === user.id
                        ? 'you'
                        : event?.target?.data?.name ||
                          event?.target?.data?.userName;
                const sourceName =
                    event?.source?.id === user.id
                        ? 'You'
                        : event?.source?.data?.name ||
                          event?.source?.data?.userName;
                const {amount, currency, name} = event?.transfer?.data;
                eventBody = () =>
                    `${
                        event?.source?.type === 'purchasable' && name
                            ? name
                            : sourceName
                    } sent ${targetName} ${amount} ${currency}`;
                return (
                    <View>
                        <ActivityEventSimple
                            eventBody={eventBody}
                            event={event}
                            navigation={navigation}
                        />
                    </View>
                );
            default:
                break;
        }
    }, [event, navigation, personaMap, user.id, user.profileImgUrl]);

    const navToPersona = useNavToPersona(navigation);
    const navToPersonaChat = useNavToPersonaChat(navigation);
    const navToCommunityChat = useNavToCommunityChat(navigation);
    const navToPostDiscussion = useNavToPostDiscussion(navigation);
    const navToCommunityPostDiscussion =
        useNavToCommunityPostDiscussion(navigation);
    const navToPersonaTransfers = useNavToPersonaTransfers(navigation);
    const navToCommunityTransfers = useNavToCommunityTransfers(navigation);
    const navToMyProfile = useNavToMyProfile(navigation);
    const navToDMChat = useNavToDMChat(navigation);

    /*const activityModalStateRefContext = React.useContext(
        ActivityModalStateRefContext,
    );*/

    const messageModalContextRef = React.useContext(
        MessageModalStateRefContext,
    );

    const onPress = React.useCallback(async () => {
        navigation.pop(3);
        //navigation.navigate('Persona');
        profileModalContext?.closeLeftDrawer &&
            profileModalContext?.closeLeftDrawer();
        //activityModalStateRefContext.current.toggleModalVisibility();
        const isDM = event.persona_id === SYSTEM_DM_PERSONA_ID;
        const isProjectAllChat = event.isProjectAllChat;
        const isCommunityAllChat = event.isCommunityAllChat;
        let myUserID = auth().currentUser.uid;
        const persona = personaMap[event.persona_id];

        if (
            !isDM &&
            !isCommunityAllChat &&
            !isPersonaAccessible({persona, userID: myUserID})
        ) {
            Alert.alert('You do not have access to this content');
            return null;
        }

        if (isProjectAllChat) {
            const communityID = personaMap[event?.persona_id]?.communityID;
            navToPersonaChat({
                chatDocPath: event.chatDocPath,
                numAttendees: event.numAttendees,
                personaName: event?.persona?.name,
                personaKey: event.persona_id,
                communityID: communityID,
                personaProfileImgUrl: event?.persona?.profileImgUrl,
                highlightCommentKey: event.comment_id,
                openToThreadID: event?.parentMessageID,
                threadID: event?.threadID,
            });
            return;
        }

        if (isCommunityAllChat) {
            navToCommunityChat({
                chatDocPath: event.chatDocPath,
                numAttendees: event.numAttendees,
                communityID: event?.communityID,
                highlightCommentKey: event.comment_id,
                openToThreadID: event?.parentMessageID,
            });
            return;
        }

        if (isDM) {
            const chatID = event.chatDocPath.split('/')[3];
            console.log('handling DM Nav Path, chatID', chatID);
            navToDMChat(
                event.chatId,
                event?.createdByUser,
                event?.comment_id,
                event?.parentMessageID,
            );
            return;
        }
        if (
            [
                'invitation',
                'authorChange',
                'communityChange',
                'application',
                'communityInvitation',
                'authorInvitation',
            ].includes(event.event_type)
        ) {
            navToPersona(event.persona_id);
        } else if (
            event.event_type === 'chat_message' ||
            event.event_type === 'chat_endorsement' ||
            event.event_type === 'chat_thread_message' ||
            (event.event_type === 'discussion' && isDM)
        ) {
            if (isDM) {
                navToDMChat(
                    event.chatId,
                    null,
                    event?.comment_id,
                    event?.parentMessageID,
                );
            } else {
                navToPersonaChat({
                    chatDocPath: event.chatDocPath,
                    numAttendees: event.numAttendees,
                    personaName: event?.persona?.name,
                    personaKey: event.persona_id,
                    communityID: event?.persona?.communityID,
                    personaProfileImgUrl: event?.persona?.profileImgUrl,
                    highlightCommentKey: event.comment_id,
                    openToThreadID: event?.parentMessageID,
                    threadID: event?.threadID,
                });
            }
        } else if (
            event.event_type === 'post_comment' ||
            event.event_type === 'comment_endorsement' ||
            event.event_type === 'post_thread_comment' ||
            event.event_type === 'post_thread_comment_endorsement' ||
            (event.event_type === 'discussion' &&
                !(isDM || isProjectAllChat)) ||
            event.event_type === 'comment_mention' ||
            event.event_type === 'comment_thread_mention'
        ) {
            if (event?.communityID) {
                navToCommunityPostDiscussion({
                    communityID: event?.communityID,
                    postKey: event?.post_id,
                    highlightCommentKey: event?.comment_id,
                    openToThreadID: event?.parentMessageID,
                });
            } else {
                navToPostDiscussion({
                    personaName: event?.persona?.name,
                    personaKey: event.persona_id,
                    postKey: event.post_id,
                    highlightCommentKey: event.comment_id,
                    personaProfileImgUrl: event?.persona?.profileImgUrl,
                    openToThreadID: event?.parentMessageID,
                });
            }
        } else if (event.event_type === 'transfer') {
            if (
                event.source.type === 'persona' &&
                personaMap[event?.source?.id]?.authors?.includes(myUserID)
            ) {
                navToPersonaTransfers({
                    personaKey: event?.source?.id,
                    communityID: personaMap[event?.source?.id]?.communityID,
                });
            } else if (
                event?.source?.type === 'community' &&
                communityMap[event?.source?.id]?.members?.includes(myUserID)
            ) {
                navToCommunityTransfers({communityID: event?.source?.id});
            } else if (
                event?.target?.type === 'persona' &&
                personaMap[event?.target?.id]?.authors?.includes(myUserID)
            ) {
                navToPersonaTransfers({
                    personaKey: event?.target?.id,
                    communityID: personaMap[event?.target?.id]?.communityID,
                });
            } else if (
                event?.target?.type === 'community' &&
                communityMap[event?.target?.id]?.members?.includes(myUserID)
            ) {
                navToCommunityTransfers({communityID: event?.target?.id});
            } else if (
                event?.source?.id === myUserID ||
                event?.target?.id === myUserID
            ) {
                // FIXME: We can't use this until we have a profile transfers
                // page.
                // navToMyProfile();
            } else {
                throw new Error('Unrecognized nav pattern for transfer event');
            }
        } else {
            if (event?.communityID) {
                navToCommunityPostDiscussion({
                    communityID: event?.communityID,
                    postKey: event?.post_id,
                    highlightCommentKey: event.comment_id,
                });
            } else {
                navToPostDiscussion({
                    personaName: event?.persona?.name,
                    personaKey: event.persona_id,
                    postKey: event.post_id,
                    personaProfileImgUrl: event?.persona?.profileImgUrl,
                    highlightCommentKey: event.comment_id,
                });
            }
        }
    }, [
        navigation,
        profileModalContext,
        event.persona_id,
        event.isProjectAllChat,
        event.isCommunityAllChat,
        event.event_type,
        event.chatDocPath,
        event.numAttendees,
        event?.persona?.name,
        event?.persona?.profileImgUrl,
        event?.persona?.communityID,
        event.comment_id,
        event?.parentMessageID,
        event?.threadID,
        event?.communityID,
        event.post_id,
        event?.parentCommentID,
        event?.source?.id,
        event?.source?.type,
        event?.target?.id,
        event?.target?.type,
        personaMap,
        navToPersonaChat,
        navToCommunityChat,
        navToPersona,
        navToCommunityPostDiscussion,
        navToPostDiscussion,
        communityMap,
        navToPersonaTransfers,
        navToCommunityTransfers,
    ]);

    return (
        <TouchableOpacity
            disabled={
                (event.event_type === 'application' && !event.accepted) ||
                event.event_type === 'user_profile_follow' ||
                event.event_type === 'persona_delete'
            }
            style={{marginTop: 5, marginBottom: 5}}
            onPress={onPress}>
            {Platform.OS === 'android' ? (
                <View
                    blurType={'chromeMaterialDark'}
                    blurRadius={5}
                    blurAmount={5}
                    reducedTransparencyFallbackColor={
                        colors.mediaPostBackground
                    }
                    style={{
                        flexDirection: 'column',
                        borderColor: colors.darkSeperator,
                        borderBottomWidth: 0,
                        marginLeft: 10,
                        paddingLeft: 5,
                        paddingRight: 5,
                        marginRight: 10,
                        paddingTop: 8,
                        paddingBottom: 3,
                        borderColor: 'red',
                        borderWidth: 0,
                        borderRadius: 8,
                    }}>
                    {/*<View ><Text style={{...baseText}}>{event?.event_type}</Text></View>*/}
                    {eventItem()}
                </View>
            ) : (
                <BlurView
                    blurType={'chromeMaterialDark'}
                    blurRadius={48}
                    blurAmount={5}
                    reducedTransparencyFallbackColor={
                        colors.mediaPostBackground
                    }
                    style={{
                        flexDirection: 'column',
                        borderColor: colors.darkSeperator,
                        borderBottomWidth: 0,
                        marginLeft: 10,
                        paddingLeft: 5,
                        paddingRight: 5,
                        marginRight: 10,
                        paddingTop: 8,
                        paddingBottom: 3,
                        borderColor: 'red',
                        borderWidth: 0,
                        borderRadius: 8,
                    }}>
                    {/*<View ><Text style={{...baseText}}>{event?.event_type}</Text></View>*/}
                    {eventItem()}
                </BlurView>
            )}
        </TouchableOpacity>
    );
}

function ChatPreview({event}) {
    const message = event?.message || event?.comment;
    const parentMessageID = event?.parentMessageID || event?.parentCommentID;
    const parentMessage = event?.parentMessage || event?.parentComment;
    return (
        <View
            style={{
                borderColor: 'red',
                borderWidth: 0,
                marginBottom: ITEM_BOTTOM_MARGIN,
            }}>
            {parentMessageID ? (
                <View style={{display: 'flex'}}>
                    <Text
                        style={{
                            color: ACTIVITY_PREVIEW_COLOR,
                            fontSize: ACTIVITY_PREVIEW_TEXT_SIZE,
                            fontStyle: 'italic',
                            marginBottom: 10,
                        }}>
                        {parentMessage?.text}
                    </Text>
                    <View
                        style={{
                            display: 'flex',
                            alignSelf: 'flex-start',
                            marginLeft: 15,
                            borderWidth: 0.5,
                            borderRadius: 5,
                            paddingLeft: 10,
                            paddingRight: 10,
                            paddingTop: 5,
                            paddingBottom: 5,
                            borderColor: colors.faded,
                        }}>
                        <View style={Styles.threadBreakoutStyle} />
                        <ChatMessage event={event} />
                    </View>
                </View>
            ) : (
                <ChatMessage event={event} />
            )}
        </View>
    );
}

function ChatMessage({event}) {
    const {
        current: {userMap},
    } = useContext(GlobalStateRefContext);
    const message = event?.message || event?.comment;
    const messageUserID = [
        'comment_endorsement',
        'chat_endorsement',
        'post_thread_comment_endorsement',
        'chat_thread_message_endorsement',
    ].includes(event.event_type)
        ? event?.message?.userID || event?.comment?.userID
        : event?.createdByUser?.id;
    const messageUser = userMap[messageUserID];

    return (
        <View>
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 2,
                }}>
                <FastImage
                    style={{
                        ...Styles.tinyProfilePicture,
                        width: 12,
                        height: 12,
                    }}
                    source={{
                        uri:
                            (event.isAnonymous
                                ? event.identity.profileImgUrl
                                : messageUser?.profileImgUrl ||
                                  images.userDefaultProfileUrl) ===
                            images.userDefaultProfileUrl
                                ? images.userDefaultProfileUrl
                                : getResizedImageUrl({
                                      origUrl: event.isAnonymous
                                          ? event.identity.profileImgUrl
                                          : messageUser?.profileImgUrl ||
                                            images.userDefaultProfileUrl,
                                      width: ACTIVITY_TINY_PROFILE_SIZE,
                                      height: ACTIVITY_TINY_PROFILE_SIZE,
                                  }),
                    }}
                />
                <Text
                    style={{
                        color: colors.text,
                        fontSize: 12,
                        fontWeight: 'bold',
                        marginRight: 2,
                    }}>
                    {messageUser?.userName}
                </Text>
            </View>
            {!!message?.text && (
                <ParseText
                    style={{
                        fontFamily: fonts.system,
                        color: ACTIVITY_PREVIEW_COLOR,
                        fontSize: ACTIVITY_PREVIEW_TEXT_SIZE,
                        marginRight: 20,
                        fontStyle: 'italic',
                    }}
                    text={truncate(message?.text, {
                        maxLength: ACTIVITY_TEXT_MAX_LENGTH,
                        useWordBoundary: true,
                    })}
                />
            )}

            {message?.mediaUrl?.length > 0 && (
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        marginBottom: message?.text ? ITEM_TOP_MARGIN : 0,
                    }}>
                    <FastImage
                        source={{
                            uri: getResizedImageUrl({
                                origUrl: message?.mediaUrl,
                                width: MEDIA_SIZE,
                                height: MEDIA_SIZE,
                            }),
                        }}
                        style={{
                            width: MEDIA_SIZE,
                            height: MEDIA_SIZE,
                        }}
                    />
                </View>
            )}
        </View>
    );
}

const options = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
};

function InviteCommunityButton({personaID}) {
    const myUserID = auth().currentUser?.uid;
    const {userMap, personaMap} = useContext(GlobalStateContext);
    const myUser = userMap[myUserID];
    let persona = personaMap[personaID];

    const iAmMember =
        persona?.communityMembers?.includes(myUserID) ||
        persona?.authors?.includes(myUserID);
    const becomeMember = () => {
        if (!iAmMember) {
            const batch = firestore().batch();
            batch.set(
                firestore()
                    .collection('users')
                    .doc(myUserID)
                    .collection('live')
                    .doc('homePersonaState'),
                {[`${personaID}`]: {communityMember: true}},
                {merge: true},
            );
            batch.set(
                firestore().collection('personas').doc(personaID),
                {
                    communityMembers: firestore.FieldValue.arrayUnion(myUserID),
                    invitedCommunityMembers: {[myUserID]: {accepted: true}},
                },
                {merge: true},
            );
            batch.set(
                firestore().collection('personaCaching').doc(personaID),
                {
                    communityMembers: firestore.FieldValue.arrayUnion(myUserID),
                    invitedCommunityMembers: {[myUserID]: {accepted: true}},
                },
                {merge: true},
            );
            batch.commit();
        }
    };
    const triggerImpactLight = React.useCallback(
        () => ReactNativeHapticFeedback.trigger('impactLight', options),
        [options],
    );
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                height: 45,
            }}>
            {iAmMember ? (
                <Text
                    style={{
                        ...baseText,
                        alignSelf: 'center',
                        width: 95,
                        color: colors.textFaded2,
                        fontFamily: fonts.system,
                        fontSize: ACTIVITY_FONT_SIZE,
                        borderWidth: 0,
                        borderRadius: 10,
                    }}>
                    Accepted
                </Text>
            ) : (
                <TouchableOpacity
                    onPressIn={triggerImpactLight}
                    style={{flexDirection: 'row', alignItems: 'center'}}
                    hitSlop={{left: 20, right: 5, bottom: 12, top: 5}}
                    onPress={becomeMember}>
                    <View
                        style={{
                            width: ACCEPT_WIDTH,
                            height: ACCEPT_HEIGHT,
                            marginTop: 2,
                            borderRadius: 19,
                            borderWidth: 1,
                            borderColor: colors.darkSeperator,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Ionicons
                            style={{left: -0.75, marginRight: 7}}
                            name={'people'}
                            size={ACCEPT_PEOPLE_SIZE}
                            color={colors.textFaded2}
                        />
                        <Text
                            style={{
                                ...baseText,
                                color: colors.textBright,
                                fontFamily: fonts.bold,
                                marginStart: 0,
                                marginEnd: 15,
                            }}>
                            Accept Invite
                        </Text>
                        <FastImage
                            style={{
                                width: ACCEPT_BUBBLE_SIZE,
                                height: ACCEPT_BUBBLE_SIZE,
                                borderRadius: ACCEPT_BUBBLE_SIZE,
                                marginRight: 2,
                                marginLeft: 2,
                            }}
                            source={{
                                uri: getResizedImageUrl({
                                    origUrl:
                                        myUser.profileImgUrl ||
                                        images.userDefaultProfileUrl ===
                                            images.userDefaultProfileUrl
                                            ? images.userDefaultProfileUrl
                                            : myUser.profileImgUrl ||
                                              images.userDefaultProfileUrl,
                                    width: 13,
                                    height: 13,
                                }),
                            }}
                        />
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}

function InviteButton({personaID}) {
    const myUserID = auth().currentUser?.uid;
    const {userMap, personaMap} = useContext(GlobalStateContext);
    const myUser = userMap[myUserID];
    const persona = personaMap[personaID];
    const iAmAuthor = persona?.authors?.includes(myUserID);
    const becomeAuthor = useBecomeAuthor({personaID});
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                height: 45,
            }}>
            {iAmAuthor ? (
                <Text
                    style={{
                        ...baseText,
                        alignSelf: 'center',
                        marginTop: 3,
                        marginBottom: 2,
                        width: 95,
                        color: colors.textFaded2,
                        fontSize: ACTIVITY_FONT_SIZE,
                        borderWidth: 0,
                        borderRadius: 10,
                    }}>
                    Accepted
                </Text>
            ) : (
                <TouchableOpacity
                    onPressIn={triggerImpactLight}
                    style={{flexDirection: 'row', alignItems: 'center'}}
                    hitSlop={{left: 20, right: 5, bottom: 12, top: 5}}
                    onPress={becomeAuthor}>
                    <View
                        style={{
                            width: ACCEPT_WIDTH,
                            height: ACCEPT_HEIGHT,
                            marginTop: 2,
                            borderRadius: 19,
                            borderWidth: 1,
                            borderColor: colors.darkSeperator,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        {persona?.anonymous ? (
                            <MaterialCommunityIcons
                                name="incognito"
                                size={ACCEPT_INCOG_SIZE}
                                color={colors.textFaded2}
                                style={{top: 0, left: -0.5, marginRight: 7}}
                            />
                        ) : (
                            <Entypo
                                color={colors.textFaded2}
                                name={'feather'}
                                size={ACCEPT_FEATHER_SIZE}
                                style={{left: 0.25, top: 0.25, marginRight: 8}}
                            />
                        )}
                        <Text
                            style={{
                                ...baseText,
                                color: colors.textBright,
                                fontFamily: fonts.bold,
                                marginStart: 0,
                                marginEnd: 15,
                            }}>
                            Accept Invite
                        </Text>
                        <FastImage
                            style={{
                                width: ACCEPT_BUBBLE_SIZE,
                                height: ACCEPT_BUBBLE_SIZE,
                                borderRadius: ACCEPT_BUBBLE_SIZE,
                                marginRight: 2,
                            }}
                            source={{
                                uri:
                                    myUser.profileImgUrl ||
                                    images.userDefaultProfileUrl ===
                                        images.userDefaultProfileUrl
                                        ? images.userDefaultProfileUrl
                                        : getResizedImageUrl({
                                              origUrl:
                                                  myUser.profileImgUrl ||
                                                  images.userDefaultProfileUrl,
                                              width: 13,
                                              height: 13,
                                          }),
                            }}
                        />
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}

const Styles = StyleSheet.create({
    threadBreakoutStyle: {
        marginLeft: 0,
        width: 15,
        height: 20,
        zIndex: 0,
        top: -5,
        left: -15,
        borderBottomLeftRadius: 15,
        borderLeftWidth: 0.5,
        borderBottomWidth: 0.5,
        borderLeftColor: colors.faded,
        borderBottomColor: colors.faded,
        position: 'absolute',
    },
    eventBodyText: {
        color: colors.textFaded,
    },
    eventItemContainer: {
        borderColor: 'green',
        borderWidth: 0,
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: null,
        alignItems: 'center',
    },
    unSeenActivity: {
        width: 7,
        height: 7,
        borderRadius: 100,
        backgroundColor: colors.emphasisRed,
        position: 'absolute',
        right: 0,
        marginTop: 20,
        marginRight: 5,
    },
    mediaTypeIcon: {
        height: 25,
        width: 25,
        marginRight: 5,
        backgroundColor: null,
        color: ACTIVITY_PREVIEW_COLOR,
    },
    profilePicture: {
        height: ACTIVITY_ICON_SIZE,
        width: ACTIVITY_ICON_SIZE,
        borderRadius: 100,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
    tinyProfilePicture: {
        height: ACTIIVTY_TINY_PROFILE_SIZE,
        width: ACTIIVTY_TINY_PROFILE_SIZE,
        borderRadius: 100,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
        marginRight: 5,
    },
});
