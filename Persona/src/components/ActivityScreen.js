import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { FlashList, AnimatedFlashList, CellContainer } from '@shopify/flash-list';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import auth from '@react-native-firebase/auth';
import { PresenceStateContext } from 'state/PresenceState';
import { ActivePersonaStateContext } from 'state/ActivePersonaState';
import { FlatList, View, Platform, Text, EventEmitter } from 'react-native';
import { GlobalStateRefContext } from 'state/GlobalStateRef';
import colors from 'resources/colors';
import ActivityEventItem from 'components/ActivityEventItem';
import every from 'lodash.every';
import isNil from 'lodash.isnil';
import some from 'lodash.some';
import Loading from './Loading';
import { ActivityIndicatorContext } from 'state/ActivityIndicatorState';

export default function ActivityScreenWrapper({
    navigation,
    activitySnapRef,
    renderActivityToggle,
    activityScreenFlatListRef,
}) {
    const {
        current: {
            user: { id: currentUserId },
            getUserFromUserList,
        },
    } = useContext(GlobalStateRefContext);
    const { setNumUnseenEvents } = useContext(ActivityIndicatorContext);
    return useMemo(() => {
        const contextProps = {
            currentUserId,
            getUserFromUserList,
            activitySnap: activitySnapRef?.current,
            renderActivityToggle,
            setNumUnseenEvents,
            activityScreenFlatListRef,
        };
        return (
            <React.Profiler
                id={'ActivityScreen'}
                onRender={(id, phase, actualDuration) => {
                    if (actualDuration > 10) {
                        //console.log('======> (Profiler)', id, phase, actualDuration);
                    }
                }}>
                <ActivityScreen
                    navigation={navigation}
                    contextProps={contextProps}
                />
            </React.Profiler>
        );
    }, [
        navigation,
        currentUserId,
        getUserFromUserList,
        activitySnapRef,
        renderActivityToggle,
        setNumUnseenEvents,
        activityScreenFlatListRef,
    ]);
}

function ActivityScreen({ navigation, contextProps }) {
    //console.log('RENDER activity');
    const {
        currentUserId,
        getUserFromUserList,
        activitySnap,
        setNumUnseenEvents,
        activityScreenFlatListRef,
    } = contextProps;
    const shouldExcludeEvent = event => {
        // Exclude older events since they may contain bad data
        const excludeEventsBeforeDateMilliseconds = Date.UTC(2021, 2, 10);
        return (
            event.deleted ||
            !event.created_at ||
            !event.created_at.toMillis ||
            excludeEventsBeforeDateMilliseconds - event.created_at.toMillis() >
            0
        );
    };

    const isValidEvent = (event, keys) => {
        return every(keys.map(key => !isNil(event[key])));
    };

    const {
        current: { user, personaList, userMap, personaMap },
    } = useContext(GlobalStateRefContext);
    const activePersonaContext = React.useContext(ActivePersonaStateContext);
    const customID = activePersonaContext.identityID?.startsWith('PERSONA');
    //console.log('RENDERING ACTIVEPERSONA', customID);
    let personaID;
    if (customID) {
        personaID = activePersonaContext.identityID.split('::')[1];
    }
    function getEventData(event) {
        if (shouldExcludeEvent(event)) {
            event.shouldExclude = true;
        } else {
            try {
                switch (event.event_type) {
                    case 'application':
                        event.application = event.application.data;
                        event.post = event.post.data;
                        event.persona_id = event.persona.id;
                        event.persona = event.persona.data;
                        event.createdByUser = getUserFromUserList(
                            event.application.userID,
                        );
                        event.accepted = event.persona.authors.includes(
                            event.application.userID,
                        );
                        if (
                            !isValidEvent(event, [
                                'application',
                                'post',
                                'persona_id',
                                'persona',
                                'createdByUser',
                                'accepted',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'communityInvitation':
                        event.persona_id = event.persona.id;
                        event.persona = event.persona.data;
                        event.createdByUser = event.createdByUser.data;
                        if (
                            !isValidEvent(event, [
                                'persona_id',
                                'persona',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'authorInvitation':
                        event.persona_id = event.persona.id;
                        event.persona = event.persona.data;
                        event.createdByUser = event.createdByUser.data;
                        if (
                            !isValidEvent(event, [
                                'persona_id',
                                'persona',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'communityChange':
                        event.persona_id = event.persona.id;
                        event.persona = event.persona.data;
                        event.createdByUser = event.member.data;
                        if (
                            !isValidEvent(event, [
                                'persona_id',
                                'persona',
                                'createdByUser',
                                'inCommunity',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'authorChange':
                        event.persona_id = event.persona.id;
                        event.persona = event.persona.data;
                        event.createdByUser = event.author.data;
                        if (
                            !isValidEvent(event, [
                                'persona_id',
                                'persona',
                                'createdByUser',
                                'isAuthor',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'post_comment':
                    case 'post_new_discussion':
                    case 'post_continued_discussion':
                        event.post_id = event.post.id;
                        event.post = event.post.data;
                        event.persona_id = event?.persona?.id;
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        event.persona = event?.persona?.data;
                        event.comment_id = event.comment.id;
                        event.comment = event.comment.data;
                        event.createdByUser = getUserFromUserList(
                            event.comment.userID,
                        );
                        if (
                            !isValidEvent(event, [
                                'post_id',
                                'post',
                                'comment_id',
                                'comment',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'room_ping':
                        event.post_id = event.post.id;
                        event.post = event.post.data;
                        event.persona_id = event.persona.id;
                        event.persona = event.persona.data;
                        event.createdByUser = getUserFromUserList(
                            event.createdByUser.id,
                        );
                        if (
                            !isValidEvent(event, [
                                'post_id',
                                'post',
                                'persona_id',
                                'persona',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'post_like':
                        event.post_id = event.post.id;
                        event.post = event.post.data;
                        event.persona_id = event.persona.id;
                        event.persona = event.persona.data;
                        event.createdByUser = getUserFromUserList(event.ref.id);
                        if (
                            !isValidEvent(event, [
                                'post_id',
                                'post',
                                'persona_id',
                                'persona',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'comment_endorsement':
                    case 'chat_endorsement':
                        event.message =
                            event?.comment?.data || event?.message?.data;
                        event.post_id = event?.post?.id;
                        event.room = event?.chat?.data || event?.post?.data;
                        event.persona_id = event?.persona?.id;
                        event.persona = event?.persona?.data;
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        event.createdByUser = getUserFromUserList(
                            event.createdByUser.id,
                        );
                        event.chatDocPath = event?.chat?.ref?.path;
                        event.chatId = event?.chat?.id;
                        break;

                    case 'new_post_from_collaborator':
                    case 'post_edit_from_collaborator':
                        event.post_id = event.post.id;
                        event.post = event.post.data;
                        event.persona_id = event?.persona?.id;
                        event.persona = event?.persona?.data;
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        event.entityID = event?.entity?.id;
                        event.entityType = event?.entity?.type;
                        event.entity = event?.entity?.data;
                        event.createdByUser = getUserFromUserList(
                            event.post.userID,
                        );
                        if (
                            !isValidEvent(event, [
                                'post_id',
                                'post',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'chat_message':
                        event.comment_id = event.message.id;
                        event.message = event.message.data;
                        event.chatId = event.chat.id;
                        event.chatDocPath = event.chat.ref.path;
                        event.numAttendees = event.chat.data.attendees.length;
                        event.chat = event.chat.data;
                        event.persona_id = event?.persona?.id;
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        event.persona = event?.persona?.data;
                        event.post = event?.post?.data;
                        event.createdByUser = getUserFromUserList(
                            event.message.userID,
                        );
                        if (
                            !isValidEvent(event, [
                                // Chat messages can either occur in a community
                                // or on a persona so both fields are optional
                                // DMs do not have a post so this field is optional
                                'comment_id',
                                'message',
                                'chatId',
                                'chatDocPath',
                                'numAttendees',
                                'chat',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    // case 'chat_endorsement':
                    //     event.chatDocPath = event.chat.ref.path;
                    //     event.chatId = event.chat.id;
                    //     event.numAttendees = event.chat.data.attendees.length;
                    //     event.message = event.message.data;
                    //     event.persona = event?.persona?.data;
                    //     event.community = event?.community?.data;
                    //     event.communityID = event?.community?.id;
                    //     event.post = event?.post?.data;
                    //     event.createdByUser = getUserFromUserList(
                    //         event.createdByUser.id,
                    //     );
                    //     if (
                    //         !isValidEvent(event, [
                    //             'chatDocPath',
                    //             'numAttendees',
                    //             'message',
                    //             'createdByUser',
                    //             'chatId',
                    //         ])
                    //     ) {
                    //         event.shouldExclude = true;
                    //     }
                    //     break;

                    case 'chat_thread_message':
                    case 'chat_thread_message_endorsement':
                        event.chatDocPath = event.chat.ref.path;
                        event.numAttendees =
                            event?.chat?.data?.attendees?.length;
                        event.threadID = event.message.id;
                        event.message = event.message.data;
                        event.parentMessageID = event.parentMessage.id;
                        event.parentMessage = event.parentMessage.data;
                        event.persona_id = event?.persona?.id;
                        event.persona = event?.persona?.data;
                        event.communityID =
                            event?.community?.id || event?.communityID;
                        event.community = event?.community?.data;
                        event.createdByUser = getUserFromUserList(
                            event.createdByUser.id,
                        );
                        if (
                            !isValidEvent(event, [
                                'chatDocPath',
                                'threadID',
                                'message',
                                'parentMessageID',
                                'parentMessage',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'post_thread_comment':
                    case 'post_thread_comment_endorsement':
                        event.post_id = event.post.id;
                        event.post = event.post.data;
                        event.persona_id = event?.persona?.id;
                        event.persona = event?.persona?.data;
                        event.parentMessageID =
                            event?.parentComment?.id ||
                            event?.parentMessage?.id;
                        event.parentMessage =
                            event?.parentComment?.data ||
                            event?.parentMessage?.data;
                        event.message =
                            event?.comment?.data || event?.message?.data;
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        event.createdByUser = getUserFromUserList(
                            event.createdByUser.id,
                        );
                        if (
                            !isValidEvent(event, [
                                'post_id',
                                'post',
                                'parentMessageID',
                                'parentMessage',
                                'message',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'post_endorsement':
                        event.post_id = event.post.id;
                        event.post = event.post.data;
                        event.persona_id = event.persona.id;
                        event.persona = event.persona.data;
                        event.createdByUser = getUserFromUserList(
                            event.createdByUserId,
                        );
                        if (
                            !isValidEvent(event, [
                                'post_id',
                                'post',
                                'persona_id',
                                'persona',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'post_mention':
                        event.post_id = event.post.id;
                        event.post = event.post.data;
                        event.persona_id = event?.persona?.id;
                        event.persona = event?.persona?.data;
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        event.createdByUser = getUserFromUserList(
                            event.createdByUser.id,
                        );
                        if (
                            !isValidEvent(event, [
                                'post_id',
                                'post',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'comment_mention':
                        event.post_id = event.post.id;
                        event.post = event.post.data;
                        event.persona_id = event?.persona?.id;
                        event.persona = event?.persona?.data;
                        event.comment_id = event.comment.id;
                        event.comment = event.comment.data;
                        event.createdByUser = getUserFromUserList(
                            event.createdByUser.id,
                        );
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        if (
                            !isValidEvent(event, [
                                'post_id',
                                'post',
                                'createdByUser',
                                'comment_id',
                                'comment',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'comment_thread_mention':
                        event.post_id = event.post.id;
                        event.post = event.post.data;
                        event.persona_id = event?.persona?.id;
                        event.persona = event?.persona?.data;
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        event.parentCommentID = event.parentComment.id;
                        event.parentComment = event.parentComment.data;
                        event.comment_id = event.comment.id;
                        event.comment = event.comment.data;
                        event.createdByUser = getUserFromUserList(
                            event.comment.userID,
                        );
                        if (
                            !isValidEvent(event, [
                                'post_id',
                                'post',
                                'parentCommentID',
                                'parentComment',
                                'comment_id',
                                'comment',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'chat_mention':
                        event.comment_id = event.message.id;
                        event.message = event.message.data;
                        event.chatId = event.chat.id;
                        event.chatDocPath = event.chat.ref.path;
                        event.numAttendees = event.chat.data.attendees.length;
                        event.chat = event.chat.data;
                        event.persona_id = event?.persona?.id;
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        event.persona = event?.persona?.data;
                        event.post = event?.post?.data;
                        event.createdByUser = getUserFromUserList(
                            event.message.userID,
                        );
                        if (
                            !isValidEvent(event, [
                                'createdByUser',
                                'comment_id',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'community_join':
                        event.persona_id = event.persona.id;
                        event.persona = event.persona.data;
                        event.createdByUser = getUserFromUserList(
                            event.createdByUser.id,
                        );
                        if (
                            !isValidEvent(event, [
                                'persona_id',
                                'persona',
                                'createdByUser',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    // case 'room_audio_discussion':
                    // case 'room_users_present':
                    //   event.persona_id = event.persona.id;
                    //   event.persona = event.persona.data;
                    //   event.post_id = event.post.id;
                    //   event.post = event.post.data;
                    //   event.createdByUsers = event.createdByUsers.map(createdByUser => {
                    //     if (createdByUser.isAnonymous) {
                    //       return {...createdByUser.identity, isAnonymous: true};
                    //     } else {
                    //       return getUserFromUserList(createdByUser.id);
                    //     }
                    //   });
                    //   if (
                    //     !isValidEvent(event, [
                    //       'persona_id',
                    //       'persona',
                    //       'post_id',
                    //       'post',
                    //       'createdByUsers',
                    //     ])
                    //   ) {
                    //     event.shouldExclude = true;
                    //   }
                    //   break;

                    case 'user_profile_follow':
                        event.createdByUser = event.createdByUser.data;
                        if (!isValidEvent(event, ['createdByUser'])) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'persona_delete':
                        event.createdByUser = event.createdByUser.data;
                        event.persona = event.persona.data;
                        if (
                            !isValidEvent(event, ['createdByUser', 'persona'])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;

                    case 'post_remix':
                        event.createdByUser = event.createdByUser.data;
                        event.persona_id = event.persona.id;
                        event.post_id = event.post.id;
                        event.persona = event.persona.data;
                        event.post = event.post.data;
                        event.remixSourcePersona =
                            event.remixSourcePersona.data;
                        event.remixSourcePost = event.remixSourcePost.data;
                        if (
                            !isValidEvent(event, [
                                'createdByUser',
                                'persona',
                                'post',
                                'remixSourcePersona',
                                'remixSourcePost',
                            ])
                        ) {
                            event.shouldExclude = true;
                        }
                        break;
                    case 'new_proposal':
                        if (event.entityType === 'community') {
                            event.communityID = event.entity.id;
                            event.community = event.community.data;
                        } else {
                            event.persona_id = event.entity.id;
                            event.persona = event.entity.data;
                        }
                        event.post_id = event.post.id;
                        event.post = event.proposal.data;
                        event.proposal = event.proposal.data;
                        if (!isValidEvent(event, ['post', 'proposal'])) {
                            event.shouldExclude = true;
                        }
                        break;
                    case 'proposal_ending_soon':
                    case 'proposal_ended':
                        event.persona_id = event?.persona?.id;
                        event.communityID = event?.community?.id;
                        event.community = event?.community?.data;
                        event.persona = event?.persona?.data;
                        event.post_id = event.post.id;
                        event.post = event.proposal.data;
                        event.proposal = event.proposal.data;
                        if (!isValidEvent(event, ['post', 'proposal'])) {
                            event.shouldExclude = true;
                        }
                        break;
                    case 'transfer':
                        break;
                    default:
                        event.shouldExclude = true;
                        break;
                }
            } catch (e) {
                console.log('Error: malformed event', event.id, e);
                event.shouldExclude = true;
            }
        }
        return event;
    }

    const isInSamePingChain = React.useCallback((eventA, eventB) => {
        return (
            eventA &&
            eventB &&
            (eventA.event_type === 'room_ping' ||
                eventA.event_type === 'room_ping') &&
            (eventB.event_type === 'room_ping' ||
                eventB.event_type === 'room_ping') &&
            eventA.post_id === eventB.post_id
        );
    }, []);

    const groupEvents = (eventsData, comparators) => {
        let activeComparator = null;

        const isInSameEventChain = (eventA, eventB) => {
            if (activeComparator === null) {
                return some(
                    comparators.map(fn => {
                        if (fn(eventA, eventB)) {
                            activeComparator = fn;
                            return true;
                        } else {
                            return false;
                        }
                    }),
                );
            } else {
                return activeComparator(eventA, eventB);
            }
        };

        const getUserOrIdentity = _event => {
            if (_event.isAnonymous) {
                return { ..._event.identity, isAnonymous: true };
            } else {
                if (_event.createdByUser?.isAnonymous) {
                    return {
                        ..._event.createdByUser.identity,
                        isAnonymous: true,
                    };
                } else {
                    return { ..._event.createdByUser };
                }
            }
        };

        let firstEventIndex = null;
        const groupedEventsData = [];
        for (let i = 0; i < eventsData.length; i++) {
            if (!eventsData[i].createdByUsers) {
                eventsData[i].displayCreatedByUser = getUserOrIdentity(
                    eventsData[i],
                );
            }
            if (isInSameEventChain(eventsData[i], eventsData[i + 1])) {
                if (firstEventIndex === null) {
                    const createdByUsers = {};
                    createdByUsers[eventsData[i].displayCreatedByUser.id] =
                        eventsData[i].displayCreatedByUser;
                    // Combine multiple comments/reactions from the same comment
                    // chain into a single event with special event_type of "discussion"
                    if (
                        eventsData[i].event_type === 'comment_endorsement' ||
                        eventsData[i].event_type ===
                        'post_thread_comment_endorsement' ||
                        // eventsData[i].event_type === 'chat_message' ||
                        eventsData[i].event_type === 'chat_endorsement'
                    ) {
                        groupedEventsData.push({
                            ...eventsData[i],
                            eventList: [eventsData[i]],
                            numEvents: 1,
                            event_type: 'discussion',
                            createdByUsers,
                        });
                    } else {
                        groupedEventsData.push({
                            ...eventsData[i],
                            eventList: [eventsData[i]],
                            numEvents: 1,
                            createdByUsers,
                        });
                    }
                    firstEventIndex = groupedEventsData.length - 1;
                } else {
                    groupedEventsData[firstEventIndex].createdByUsers[
                        eventsData[i].displayCreatedByUser.id
                    ] = eventsData[i].displayCreatedByUser;
                    groupedEventsData[firstEventIndex].eventList.unshift(
                        eventsData[i],
                    );
                    groupedEventsData[firstEventIndex].numEvents += 1;
                }
            } else if (firstEventIndex !== null) {
                // If this is true we're at the end of an event chain
                // and need to reset the index after we add the event
                groupedEventsData[firstEventIndex].createdByUsers[
                    eventsData[i].displayCreatedByUser.id
                ] = eventsData[i].displayCreatedByUser;
                groupedEventsData[firstEventIndex].eventList.unshift(
                    eventsData[i],
                );
                groupedEventsData[firstEventIndex].numEvents += 1;
                groupedEventsData[firstEventIndex].createdByUsers =
                    Object.values(
                        groupedEventsData[firstEventIndex].createdByUsers,
                    );
                firstEventIndex = null;
                activeComparator = null;
            } else {
                groupedEventsData.push({
                    ...eventsData[i],
                    ...(!eventsData[i].createdByUsers && {
                        createdByUsers: [eventsData[i].displayCreatedByUser],
                    }),
                });
            }
        }
        return groupedEventsData;
    };

    const buildProcessedActivity = activitySnap => {

        if (activitySnap === null || activitySnap === undefined) {
            return null;
        }

        let eventsData = [];
        activitySnap?.docs.forEach(event => {
            eventsData.push({ ...event.data(), id: event.id });
        });
        eventsData = eventsData.map(getEventData);
        // guard against some bad data entries
        eventsData = eventsData.filter(event => !event.shouldExclude);

        const groupedEventsData = groupEvents(eventsData, [
            // isInSameChatChain,
            // isInSameChatThreadChain,
            // isInSameCommentChain,
            // isInSameCommentThreadChain,
            isInSamePingChain,
        ]);

        return groupedEventsData;
    };

    const processedActivity = buildProcessedActivity(activitySnap);

    const renderItem = useCallback(
        ({ item }) => {
            return customID ? (
                item.persona.id === personaID ? (
                    <ActivityEventItem navigation={navigation} event={item} />
                ) : null
            ) : (
                <ActivityEventItem navigation={navigation} event={item} />
            );
        },
        [customID, personaID, navigation],
    );

    // If the item gets updated update the item's key so that the updated event
    // gets rendered in the FlatList
    const getUniqueItemId = useCallback(item => {
        return item?.updatedAt?.seconds
            ? item.id + '-' + item.updatedAt.seconds.toString()
            : item.id;
    }, []);

    return processedActivity === null ? (
        <Loading backgroundColor={colors.background} />
    ) : processedActivity.length === 0 ? (
        <ActivityZeroState />
    ) : (
        <View style={{ flex: 1 }}>
            <FlashList
                estimatedItemSize={200}
                ref={activityScreenFlatListRef}
                removeClippedSubviews={true}
                ListHeaderComponent={<View style={{ height: 50 }} />}
                data={processedActivity}
                renderItem={renderItem}
                keyExtractor={getUniqueItemId}
                showsVerticalScrollIndicator={false}
                bounces={false}
            />
        </View>
    );
}

const ActivityZeroState = () => {
    return (
        <View
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                // backgroundColor: colors.background,
            }}>
            <Text
                style={{
                    ...baseText,
                    color: colors.textFaded,
                    fontStyle: 'italic',
                    marginTop: 60,
                }}>
                No notifications to show
            </Text>
        </View>
    );
};