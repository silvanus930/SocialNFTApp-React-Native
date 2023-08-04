import React, {useContext, useMemo} from 'react';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import colors from 'resources/colors';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import FastImage from 'react-native-fast-image';
import {timestampToDateString, timestampToDateString2} from 'utils/helpers';
import images from 'resources/images';
import Icon from 'react-native-vector-icons/Feather';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import useDebounce from 'hooks/useDebounce';
import {useNavigation} from '@react-navigation/native';
import isEqual from 'lodash.isequal';
import {useNavToPersona, useNavToCommunity} from 'hooks/navigationHooks';
import getResizedImageUrl from 'utils/media/resize';
import {ACTIVITY_FONT_SIZE} from 'components/ActivityConstants';

export const ACTIVITY_TIMESTAMP_FONT_SIZE = 12;
export const ACTIVITY_PREVIEW_COLOR = colors.textFaded2;
export const ACTIVITY_PREVIEW_TEXT_SIZE = 14;
export const MEDIA_SIZE = 80;
export const ACTIVITY_ICON_SIZE = 22;
export const ACTIVITY_PROFILE_SIZE = 40;
export const ACTIVITY_SMALL_PROFILE_SIZE = 30;
export const ACTIVITY_TINY_PROFILE_SIZE = 12;
export const ITEM_BOTTOM_MARGIN = 9;
export const ITEM_TOP_MARGIN = 4;

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

const EventTimestamp = ({event}) => {
    const [hack, setHack] = React.useState(true);
    React.useEffect(() => {
        const interval = setInterval(async () => {
            setHack(!hack);
        }, 60000);

        return () => clearInterval(interval);
    }, [hack, setHack]);

    return (
        <Text
            style={{
                ...baseText,
                fontSize: ACTIVITY_TIMESTAMP_FONT_SIZE,
                fontFamily: fonts.timestamp,
                color: colors.faded,
                marginTop: 10,
            }}>
            {timestampToDateString(event.created_at.seconds)}
        </Text>
    );
};
export default React.memo(ActivityEventSimpleWrapper, propsAreEqual);

function ActivityEventSimpleWrapper(props) {
    const {
        current: {
            user: {id, profileImgUrl},
            personaMap,
        },
    } = useContext(GlobalStateRefContext);
    const {
        current: {communityMap},
    } = useContext(CommunityStateRefContext);
    return useMemo(() => {
        const currentUser = {id, profileImgUrl};
        return <ActivityEventSimple currentUser={currentUser} {...props} />;
    }, [id, profileImgUrl, props]);
}

function ActivityEventSimple({event, eventBody, preview}) {
    const navigation = useNavigation();
    const navToUserProfile = useDebounce(
        userID => navigation.push('Profile', {userID}),
        [navigation],
    );

    const {
        current: {
            user: {id: uid, profileImgUrl},
            personaMap,
        },
    } = useContext(GlobalStateRefContext);
    const {
        current: {communityMap},
    } = useContext(CommunityStateRefContext);
    const displayUserProfilePhotos = () => {
        const usersToShow = event.createdByUsers.slice(0, 2);
        return (
            <View style={{flexDirection: 'row'}}>
                {usersToShow.map((createdByUser, index) => {
                    return (
                        <FastImage
                            key={createdByUser.id}
                            source={{
                                uri: getResizedImageUrl({
                                    origUrl: createdByUser.isAnonymous
                                        ? createdByUser.profileImgUrl ||
                                          images.personaDefaultProfileUrl
                                        : createdByUser.profileImgUrl ||
                                          images.userDefaultProfileUrl,
                                    width: Styles.profilePicture.width,
                                    height: Styles.profilePicture.height,
                                }),
                            }}
                            style={[
                                Styles.profilePicture,
                                ...(usersToShow.length === 2
                                    ? [
                                          {
                                              marginTop: 7,
                                              marginLeft: -22 * index,
                                              zIndex: -index,
                                              transform: [
                                                  {translateY: -10 * index},
                                              ],
                                              borderWidth: 1,
                                              borderColor: colors.background,
                                              width: ACTIVITY_SMALL_PROFILE_SIZE,
                                              height: ACTIVITY_SMALL_PROFILE_SIZE,
                                          },
                                      ]
                                    : []),
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    const navToPersona = useNavToPersona(navigation);
    const navToCommunity = useNavToCommunity(navigation);
    const isDM = event.persona_id === SYSTEM_DM_PERSONA_ID;
    const isUserProfileFollow = event.event_type === 'user_profile_follow';
    const getEventIcon = event => {
        if (event.event_type === 'post_remix') {
            return '🔄 ';
        } else if (event.event_type === 'room_audio_discussion') {
            return '🎙 ';
        } else {
            return null;
        }
    };

    const getEventTitle = eventData => {
        if (eventData?.isProjectAllChat || eventData?.isCommunityAllChat) {
            return 'Chat';
        } else if (eventData.event_type === 'new_proposal') {
            return 'New Proposal';
        } else if (eventData.event_type === 'proposal_ending_soon') {
            const timeRemaining = timestampToDateString2(
                eventData.proposal.endTime.seconds,
            );
            return `⚠️ Proposal ending in ${timeRemaining}`;
        } else if (eventData.event_type === 'proposal_ended') {
            const voteResult = eventData?.proposal?.voteOutcome?.result;
            const voteResultDisplay =
                voteResult === 'passed' ? 'passed' : 'failed';
            const emoji = voteResult === 'passed' ? '✅' : '❌';
            return `${emoji} Proposal ${voteResultDisplay}`;
        } else if (eventData?.event_type === 'transfer') {
            return 'Transfer';
        } else if (eventData?.post) {
            if (eventData?.post?.title === '' || !eventData?.post?.title) {
                return '(untitled post)';
            } else {
                return eventData?.post?.title;
            }
        } else {
            return null;
        }
    };

    const getEntityName = eventData => {
        if (eventData.event_type === 'transfer') {
            const sourceID = eventData?.source?.id;
            if (
                personaMap[sourceID]?.authors?.includes(uid) ||
                communityMap[sourceID]?.members?.includes(uid)
            ) {
                return eventData?.source?.data?.name;
            } else {
                return eventData?.target?.data?.name;
            }
        } else {
            return eventData?.persona?.name || eventData?.community?.name;
        }
    };

    return (
        <View style={Styles.eventSimpleContainer}>
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                    }}>
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 0.15,
                        }}>
                        <PersonaDisplay
                            isUserProfileFollow={isUserProfileFollow}
                            isDM={isDM}
                            navToPersona={navToPersona}
                            navToCommunity={navToCommunity}
                            event={event}
                            personaMap={personaMap}
                            communityMap={communityMap}
                            currentUserID={uid}
                        />
                    </View>

                    {/* Event text */}
                    <View
                        style={{
                            borderWidth: 0,
                            borderColor: 'orange',
                            flex: 0.8,
                            justifyContent: 'flex-start',
                            paddingLeft: 10,
                            paddingRight: 5,
                        }}>
                        <Text
                            numberOfLines={1}
                            style={[
                                Styles.personaLocationText,
                                {
                                    ...baseText,
                                    fontFamily: fonts.medium,
                                    fontSize: ACTIVITY_FONT_SIZE,
                                },
                            ]}>
                            {getEntityName(event)}
                        </Text>
                        <View
                            style={{
                                borderWidth: 0,
                                borderColor: 'green',
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                                marginBottom: 10,
                            }}>
                            <Text
                                numberOfLines={1}
                                style={[
                                    Styles.personaLocationText,
                                    {
                                        ...baseText,
                                        fontFamily: fonts.regular,
                                        color: colors.text,
                                        fontSize: ACTIVITY_FONT_SIZE,
                                    },
                                ]}>
                                {getEventIcon(event)}
                                {getEventTitle(event)}
                            </Text>
                        </View>
                        <UserAction eventBody={eventBody} />

                        {/* Event preview */}
                        <View>{preview && preview()}</View>
                    </View>
                    <View
                        style={{
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            flex: 0.1,
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                marginBottom: 1,
                                justifyContent: 'flex-start',
                            }}>
                            <EventTimestamp event={event} />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

function PersonaDisplay({
    isUserProfileFollow,
    isDM,
    navToPersona,
    navToCommunity,
    event,
    personaMap,
    communityMap,
    currentUserID,
}) {
    const getEntityProfileImgUrl = eventData => {
        let profileImgUrl;
        if (event.event_type === 'transfer') {
            const sourceID = eventData?.source?.id;
            if (
                personaMap[sourceID]?.authors?.includes(currentUserID) ||
                communityMap[sourceID]?.members?.includes(currentUserID)
            ) {
                profileImgUrl = eventData?.source?.data?.profileImgUrl;
            } else {
                profileImgUrl = eventData?.target?.data?.profileImgUrl;
            }
        } else {
            profileImgUrl =
                personaMap[event?.persona_id]?.profileImgUrl ||
                communityMap[event?.communityID]?.profileImgUrl;
        }
        return profileImgUrl;
    };

    return (
        <View
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
                marginRight: 5,
            }}>
            {isUserProfileFollow ? null : isDM ? (
                <View>
                    <Icon name="send" size={20} color={colors.text} />
                </View>
            ) : (
                <>
                    <TouchableOpacity
                        hitSlop={{top: 10, bottom: 15, left: 15, right: 15}}
                        onPress={() =>
                            event?.communityID
                                ? navToCommunity(event?.communityID)
                                : navToPersona(event.persona_id)
                        }
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        <FastImage
                            source = {{ 
                                uri: getEntityProfileImgUrl(event) ? getResizedImageUrl({
                                    origUrl: getEntityProfileImgUrl(event),
                                    width: Styles.profilePicture.width,
                                    height: Styles.profilePicture.height,
                                }) : images.personaDefaultProfileUrl,
                            }} 
                            style={[Styles.personaProfilePicture]}
                        />
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

function UserAction({eventBody}) {
    return (
        <>
            {!!eventBody && (
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        marginBottom: 15,
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            fontFamily: fonts.system,
                            color: colors.textFaded,
                            fontSize: ACTIVITY_FONT_SIZE,
                        }}>
                        {eventBody()}
                    </Text>
                </View>
            )}
        </>
    );
}

const Styles = StyleSheet.create({
    eventSimpleContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        borderColor: 'purple',
        marginTop: 1.5,
    },
    eventItemTextContainer: {
        flex: 0.5,
    },
    eventItemText: {
        borderColor: 'yellow',
        borderWidth: 0,
        color: colors.text,
    },
    personaLocationText: {
        color: colors.text,
        fontSize: ACTIVITY_FONT_SIZE,
    },
    profilePicture: {
        height: ACTIVITY_PROFILE_SIZE,
        width: ACTIVITY_PROFILE_SIZE,
        borderRadius: 38,
        marginLeft: 0,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
    personaProfilePicture: {
        height: ACTIVITY_PROFILE_SIZE,
        width: ACTIVITY_PROFILE_SIZE,
        borderRadius: 5,
        marginLeft: 0,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
    userProfilePicture: {
        height: ACTIVITY_PROFILE_SIZE,
        width: ACTIVITY_PROFILE_SIZE,
        borderRadius: 100,
        marginLeft: 10,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
});
