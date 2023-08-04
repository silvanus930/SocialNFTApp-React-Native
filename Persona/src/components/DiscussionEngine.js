import {BlurView} from '@react-native-community/blur';
import {
    safeAreaOffset,
    safeAreaOffsetKeyboardOpen,
} from 'components/DiscussionEngineConstants';
import DiscussionTypingIndicators from 'components/DiscussionTypingIndicators';
import {heightOffset} from 'components/NotchSpacer';
import OptionsModal from 'components/OptionsModal';
import RemixPulloutModal from 'components/RemixPulloutModal';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Dimensions,
    Keyboard,
    Platform,
    StyleSheet,
    View,
    LogBox,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
//import RoomsSmallStatus from 'components/RoomsSmallStatus';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CreateDiscussionComment from 'components/CreateDiscussionComment';
import DiscussionCommentList from 'components/DiscussionCommentList';
import UserAutocomplete from 'components/UserAutocomplete';
import isEqual from 'lodash.isequal';
import colors from 'resources/colors';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import DiscussionEngineState, {
    DiscussionEngineDispatchContext,
    DiscussionEngineFrameModalState,
    DiscussionEngineFrameState,
    DiscussionEngineModalState,
    DiscussionEngineStateContext,
} from './DiscussionEngineContext';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
// AROTH
import {isSameDayFromSeconds} from 'utils/DateTime';
import {DateTime} from 'luxon';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// TODO - thread add comment renders twice per new comment?
LogBox.ignoreAllLogs();

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(DiscussionEngine, propsAreEqual);
export const DiscussionEngineModal = React.memo(
    DiscussionEngineModalPreMemo,
    propsAreEqual,
);

//
// AROTH: bookmark;;
function DiscussionEngineModalPreMemo(props) {
    return (
        <DiscussionEngineFrameModalState>
            <DiscussionEngineModalState>
                <DiscussionEngineMain {...props} modal={true} />
            </DiscussionEngineModalState>
        </DiscussionEngineFrameModalState>
    );
}
function DiscussionEngine(props) {
    return (
        <DiscussionEngineFrameState>
            <DiscussionEngineState>
                <DiscussionEngineMain
                    {...props}
                    parentObjPath={props.parentObjPath}
                />
            </DiscussionEngineState>
        </DiscussionEngineFrameState>
    );
}

function DiscussionEngineMain(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);

    // todo i believe threadView is deprecated. Remove from here plus other places
    const threadView = state.threadView;
    const threadID = state.threadID;
    const openThreadIDs = state.openThreadIDs;
    const nowTimestamp = state.nowTimestamp;
    const loadedNewerMessages = state.loadedNewerMessages;
    return useMemo(
        () => (
            <React.Profiler
                id={'DiscussionEngineMainMemo'}
                onRender={(id, phase, actualDuration) => {
                    if (actualDuration > 2) {
                        // console.log('======> (Profiler) ', id, phase, actualDuration);
                    }
                }}>
                <DiscussionEngineMainMemo
                    {...props}
                    threadID={threadID}
                    openThreadIDs={openThreadIDs}
                    nowTimestamp={nowTimestamp}
                    currentState={state}
                    loadedNewerMessages={loadedNewerMessages}
                />
            </React.Profiler>
        ),
        [props, openThreadIDs, threadID, nowTimestamp, loadedNewerMessages],
    );
}

function DiscussionEngineMainMemo({
    renderFromTop,
    modal = false,
    header = true,
    extraData = null,
    hideFirstTimelineSegment = false,
    renderGoUpArrow = false,
    parentObjPath,
    transparentBackground = false,
    collectionName,
    discussionTitle,
    navigation,
    threadID,
    openThreadIDs,
    showSeenIndicators = true,
    headerProps = undefined,
    headerType = undefined,
    threadView = false,
    style = {},
    heightScaleFactor = 1,
    disableKeyboardMotion = false,
    openToThreadID,
    scrollToMessageID,
    nowTimestamp,
    currentState,
    loadedNewerMessages,
    animatedHeaderOptions = undefined,
}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const personaContext = React.useContext(PersonaStateRefContext);

    const scrollToMessageOrThread = openToThreadID ?? scrollToMessageID;

    if (!nowTimestamp) {
        dispatch({type: 'setNowTimestamp', payload: firestore.Timestamp.now()});
    }

    const myUserID = auth().currentUser.uid;
    const [comments, setComments] = useState([]);
    // const [loadedNewerMessages, setLoadedNewerMessages] = useState(false);
    // const [openToIndex, setOpenToIndex] = useState(null);
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const {
        current: {communityMap},
    } = React.useContext(CommunityStateRefContext);

    const animatedKeyboardOffset = useSharedValue(safeAreaOffset);

    const getFirebaseCommentsCollection = useCallback(() => {
        return parentObjPath
            ? firestore().doc(parentObjPath).collection(collectionName)
            : null;
    }, [parentObjPath, collectionName]);

    const getFirebaseCommentsLiveCache = useCallback(() => {
        return parentObjPath
            ? firestore()
                  .doc(parentObjPath)
                  .collection('live')
                  .doc('messageCache')
                  .collection('messagesCache')
            : null;
    }, [parentObjPath, collectionName]);

    let personaKey = headerProps?.personaID;

    let canTextChat =
        personaKey && personaMap && personaMap[personaKey]
            ? personaMap[personaKey].publicCanChat ||
              (personaKey &&
                  personaMap[personaKey]?.authors?.includes(
                      auth().currentUser.uid,
                  ))
            : true;

    React.useEffect(() => {
        const subscribers = [
            navigation &&
                navigation.addListener('blur', () => {
                    dispatch({type: 'clearShowEditMenu'});
                    dispatch({type: 'clearEditComment'});
                    dispatch({type: 'clearReplyComment'});
                    dispatch({type: 'clearSelectedComments'});
                    dispatch({type: 'exitShowEndorsementsMenu'});
                    dispatch({type: 'clearEndorsementMenu'});
                }),
        ];
        return () =>
            subscribers.forEach(unsubscribe => unsubscribe && unsubscribe());
    }, [dispatch, navigation]);

    const generateCommentGroups = useCallback(
        (commentsData, runningThreadID) => {
            let groupedComments = [];
            const maxTimeGrouping = 60 * 3; // 3 min grouping
            const maxNumberGrouping = 15;
            let lastItem;
            let groupLength = 0;
            let headerCommentKey;
            let numberSeenPerCommentGroup = {};
            let first = true;
            let headerKey;
            let replyUserName = '';

            for (const item of commentsData) {
                if (
                    threadView ||
                    item.comment.userID !== lastItem?.comment.userID ||
                    item.comment.identityID !== lastItem?.comment.identityID ||
                    groupLength > maxNumberGrouping ||
                    (item.comment.timestamp?.seconds || 0) -
                        lastItem?.comment?.timestamp?.seconds >
                        maxTimeGrouping ||
                    ((item.comment.timestamp?.seconds || 0) -
                        lastItem?.comment?.timestamp?.seconds <
                        maxTimeGrouping &&
                        lastItem?.comment?.numThreadComments > 0) ||
                    lastItem?.comment?.isThread !== item.comment?.isThread ||
                    item.comment?.numThreadComments > 0 ||
                    item.comment?.isThread
                ) {
                    if (headerCommentKey) {
                        groupedComments.push({
                            component: 'footer',
                            key: `${headerCommentKey}_footer`,
                            comment: {
                                anonymous: item.comment?.anonymous,
                                identityID: item.comment?.identityID,
                                userID: item.comment.userID,
                                isThread: item.comment?.isThread,
                                timestamp: item.comment?.timestamp,
                                prevTimestamp: lastItem?.comment?.timestamp,
                                prevUserID: lastItem?.comment?.userID,
                            },
                            commentKey: item.commentKey,
                        });
                    }

                    // -------------------------------------------------------------
                    // <Date Seperator injection>
                    // -------------------------------------------------------------
                    const mySeconds = item.comment?.timestamp?.seconds;
                    const prevSeconds = lastItem?.comment?.timestamp?.seconds;

                    if (mySeconds && prevSeconds) {
                        if (!isSameDayFromSeconds(mySeconds, prevSeconds)) {
                            groupedComments.push({
                                component: 'dateSeparator',
                                date: DateTime.fromSeconds(mySeconds),
                            });
                        }
                    }

                    // -------------------------------------------------------------
                    // </Date Seperator injection>
                    // -------------------------------------------------------------

                    groupLength = 0;
                    headerCommentKey = item.commentKey;
                    headerKey = `${item.commentKey}_header`;
                    groupedComments.push({
                        component: 'header',
                        comment: {
                            anonymous: item.comment?.anonymous,
                            identityID: item.comment?.identityID,
                            userID: item.comment.userID,
                            timestamp: item.comment.timestamp,
                            isThread: item.comment?.isThread,
                            numThreadComments: item.comment?.numThreadComments,
                            prevTimestamp: lastItem?.comment?.timestamp,
                            prevUserID: lastItem?.comment?.userID,
                        },
                        first,
                        commentKey: item.commentKey,
                        key: headerKey,
                    });
                    first = false;
                }
                if (item.comment?.numThreadComments > 0) {
                    replyUserName = userMap[item?.comment?.userID].userName;
                }
                groupLength += 1;

                groupedComments.push({
                    component: 'comment',
                    ...item,
                    key: item.commentKey,
                    threadID: runningThreadID,
                    replyUserName:
                        item?.comment?.numThreadComments > 0 ||
                        item?.comment.isThread
                            ? replyUserName
                            : '',
                    parentObjPath,
                });

                if (showSeenIndicators) {
                    const numberSeenPerComment = Object.keys(
                        item.comment?.seen || {},
                    ).filter(userID => userID !== myUserID).length;
                    numberSeenPerCommentGroup[headerKey] =
                        Math.min(
                            numberSeenPerCommentGroup[headerKey],
                            numberSeenPerComment,
                        ) || numberSeenPerComment;
                }

                lastItem = item;
            } // finish iterating through each item of commentsData
            if (groupedComments.length > 0) {
                groupedComments.push({
                    component: 'footer',
                    key: `${headerCommentKey}_footer`,
                    comment: {
                        anonymous: lastItem.comment?.anonymous,
                        identityID: lastItem.comment?.identityID,
                        userID: lastItem.comment.userID,
                        prevUserID: lastItem.comment.userID,
                        isThread: lastItem.comment?.isThread,
                        timestamp: lastItem.comment?.timestamp,
                        prevTimestamp: lastItem?.comment?.timestamp,
                    },
                });
            }

            return [groupedComments, numberSeenPerCommentGroup];
        },
        [showSeenIndicators, myUserID, userMap],
    );

    const getNumberUnseenAtEnd = useCallback(
        (commentsList, allComments) => {
            let numberUnseenAtEnd = 0;
            for (const comment of commentsList) {
                if (
                    Object.keys(comment.comment?.seen || {}).includes(myUserID)
                ) {
                    break;
                }
                if (allComments || comment.component === 'comment') {
                    numberUnseenAtEnd += 1;
                }
            }
            return numberUnseenAtEnd;
        },
        [myUserID],
    );

    const isDM = parentObjPath.includes(SYSTEM_DM_PERSONA_ID);
    const commentPayload = React.useRef(null);

    let paginationSize = Platform.OS === 'ios' ? 40 : 80;

    const setCommentPayload = (
        commentsData,
        threadOnlyData,
        numberSeenPerCommentGroup,
    ) => {
        return {
            numberUnseenCommentsOnlyAtEnd: getNumberUnseenAtEnd(
                commentsData,
                true,
            ),
            numberThreads: threadOnlyData.length,
            numberUnseenThreadsAtEnd: getNumberUnseenAtEnd(
                threadOnlyData,
                true,
            ),
            numberUnseenCommentsAtEndAbsolute: getNumberUnseenAtEnd(
                commentsData,
                true,
            ),
            numberSeenPerCommentGroup,
            commentsMap: Object.fromEntries(
                commentsData.map(item => [item.commentKey, item.comment]),
            ),
        };
    };

    let getNext = React.useCallback(
        prevState => {
            let commentsCollection = parentObjPath
                ? firestore()
                      .doc(parentObjPath)
                      .collection(collectionName)
                      .where('deleted', '==', false)
                      .orderBy('timestamp', 'desc')
                : null;

            if (commentsCollection) {
                let next = prevState.nextQuery;
                let oldData = prevState.commentsData || [];
                if (prevState.nextQuery === undefined) {
                    next = commentsCollection.limit(paginationSize);
                    oldData = [];
                }

                if (!next) {
                    return;
                }

                next.get().then(commentsSnap => {
                    let nextData = commentsSnap.docs.map(commentDoc => ({
                        comment: commentDoc.data(),
                        commentKey: commentDoc.id,
                    }));

                    nextData = nextData.filter(
                        ({comment}) =>
                            comment?.numThreadComments > 0 ||
                            !comment?.showCommentDeleted,
                    );

                    let commentsData = oldData.concat(nextData);
                    commentsData.reverse();

                    let threadOnlyData = commentsData.filter(
                        ({comment}) =>
                            comment.hasOwnProperty('latestThreadComment') &&
                            comment?.numThreadComments > 0,
                    );

                    threadOnlyData = threadOnlyData.sort(
                        (a, b) =>
                            a.comment.latestThreadComment.timestamp -
                            b.comment.latestThreadComment.timestamp,
                    );

                    const [groupedComments, numberSeenPerCommentGroup] =
                        generateCommentGroups(commentsData);

                    if (!loadedNewerMessages && scrollToMessageOrThread) {
                        groupedComments.push({
                            component: 'startOfMessages',
                            key: 'startOfMessages',
                        });
                    }

                    commentPayload.current = setCommentPayload(
                        commentsData,
                        threadOnlyData,
                        numberSeenPerCommentGroup,
                    );

                    setComments(groupedComments.reverse());

                    const lastVisibleDoc =
                        commentsSnap.docs[commentsSnap.docs.length - 1];

                    if (lastVisibleDoc?.exists) {
                        const nextQuery = commentsCollection
                            .startAfter(lastVisibleDoc)
                            .limit(paginationSize);
                        dispatch({
                            type: 'updateCommentsData',
                            payload: {commentsData: commentsData.reverse()},
                        });
                        dispatch({
                            type: 'updateNextQuery',
                            payload: {nextQuery},
                        });
                    } else {
                        dispatch({
                            type: 'updateCommentsData',
                            payload: {commentsData: commentsData.reverse()},
                        });
                        dispatch({
                            type: 'updateNextQuery',
                            payload: {nextQuery: null},
                        });
                        dispatch({
                            type: 'triggerNoMoreDocs',
                            payload: true,
                        });
                    }
                });
            }
        },
        [dispatch],
    );

    const initialLoadWhenScrolling = () => {
        if (scrollToMessageOrThread) {
            let commentsCollection = firestore()
                .doc(parentObjPath)
                .collection(collectionName);
            commentsCollection
                .doc(scrollToMessageOrThread)
                .get()
                .then(doc => {
                    let olderThanDoc = commentsCollection
                        .where('deleted', '==', false)
                        .orderBy('timestamp', 'desc')
                        .limit(paginationSize)
                        .startAt(doc);

                    olderThanDoc.get().then(oldCommentsSnap => {
                        let commentsData = oldCommentsSnap.docs.map(
                            commentDoc => ({
                                comment: commentDoc.data(),
                                commentKey: commentDoc.id,
                            }),
                        );

                        commentsData = commentsData.filter(
                            ({comment}) =>
                                comment?.numThreadComments > 0 ||
                                !comment?.showCommentDeleted,
                        );

                        commentsData.reverse();

                        let threadOnlyData = commentsData.filter(
                            ({comment}) =>
                                comment.hasOwnProperty('latestThreadComment') &&
                                comment?.numThreadComments > 0,
                        );

                        threadOnlyData = threadOnlyData.sort(
                            (a, b) =>
                                a.comment.latestThreadComment.timestamp -
                                b.comment.latestThreadComment.timestamp,
                        );

                        const [groupedComments, numberSeenPerCommentGroup] =
                            generateCommentGroups(commentsData);

                        // ADD BUTTON TO SEE NEWER MESSAGES
                        groupedComments.push({
                            component: 'startOfMessages',
                            key: 'startOfMessages',
                        });

                        commentPayload.current = setCommentPayload(
                            commentsData,
                            threadOnlyData,
                            numberSeenPerCommentGroup,
                        );

                        setComments(groupedComments.reverse());

                        const lastVisibleDoc =
                            oldCommentsSnap.docs[
                                oldCommentsSnap.docs.length - 1
                            ];

                        if (lastVisibleDoc?.exists) {
                            const nextQuery = commentsCollection
                                .where('deleted', '==', false)
                                .orderBy('timestamp', 'desc')
                                .startAfter(lastVisibleDoc)
                                .limit(paginationSize);
                            dispatch({
                                type: 'updateCommentsData',
                                payload: {commentsData: commentsData.reverse()},
                            });
                            dispatch({
                                type: 'updateNextQuery',
                                payload: {nextQuery},
                            });
                        } else {
                            dispatch({
                                type: 'updateCommentsData',
                                payload: {commentsData: commentsData.reverse()},
                            });
                            dispatch({
                                type: 'updateNextQuery',
                                payload: {nextQuery: null},
                            });
                            dispatch({
                                type: 'triggerNoMoreDocs',
                                payload: true,
                            });
                        }
                    });

                    let newerThanDoc = commentsCollection
                        .where('deleted', '==', false)
                        .orderBy('timestamp', 'asc')
                        .limit(1)
                        .startAfter(doc);

                    newerThanDoc.get().then(commentsSnap => {
                        if (commentsSnap.docs.length === 0) {
                            // there are newer docs
                            // Hide button for newer msgs
                            dispatch({
                                type: 'setLoadedNewerMessages',
                                payload: true,
                            });
                        }
                    });
                });
        }
    };

    const loadNewerMessages = useCallback(() => {
        if (scrollToMessageOrThread) {
            let commentsCollection = firestore()
                .doc(parentObjPath)
                .collection(collectionName);

            commentsCollection
                .doc(scrollToMessageOrThread)
                .get()
                .then(doc => {
                    let newerThanDoc = commentsCollection
                        .where('deleted', '==', false)
                        .orderBy('timestamp', 'asc')
                        .startAfter(doc);

                    newerThanDoc.get().then(commentsSnap => {
                        if (commentsSnap.docs.length > 0) {
                            let commentsData = commentsSnap.docs.map(
                                commentDoc => ({
                                    comment: commentDoc.data(),
                                    commentKey: commentDoc.id,
                                }),
                            );

                            commentsData = commentsData.filter(
                                ({comment}) =>
                                    comment?.numThreadComments > 0 ||
                                    !comment?.showCommentDeleted,
                            );

                            dispatch({
                                type: 'prependNewerCommentsData',
                                payload: {newData: commentsData.reverse()},
                            });
                            dispatch({type: 'triggerUpdateList'});
                        }

                        // Hide button for newer msgs
                        dispatch({
                            type: 'setLoadedNewerMessages',
                            payload: true,
                        });

                        // Keep message highlighted
                        dispatch({type: 'setDidScroll', payload: false});
                        dispatch({
                            type: 'setCommentSelect',
                            payload: {[scrollToMessageOrThread]: true},
                        });
                    });
                });
        }
    }, [dispatch]);

    const renderCommentsData = useCallback(
        state => {
            let commentsData = state.commentsData || [];

            if (commentsData) {
                commentsData = commentsData.filter(
                    ({comment}) =>
                        comment?.numThreadComments > 0 ||
                        !comment?.showCommentDeleted,
                );

                let threadOnlyData = commentsData.filter(
                    ({comment}) =>
                        comment.hasOwnProperty('latestThreadComment') &&
                        comment?.numThreadComments > 0,
                );

                threadOnlyData = threadOnlyData.sort(
                    (a, b) =>
                        a.comment.latestThreadComment.timestamp -
                        b.comment.latestThreadComment.timestamp,
                );

                commentsData.reverse();
                const [groupedComments, numberSeenPerCommentGroup] =
                    generateCommentGroups(commentsData);

                // console.log('on render', groupedComments);

                commentPayload.current = setCommentPayload(
                    commentsData,
                    threadOnlyData,
                );

                setComments(groupedComments.reverse());
                commentsData.reverse(); // Need to reverse here...not sure why
            }
        },
        [dispatch],
    );

    let now = nowTimestamp || firestore.Timestamp.now();
    let unsubscribeLiveChatSnapshot;
    const liveChatSnapshot = useCallback(() => {
        // console.log('FETCH COMMENTS CALLED');
        const commentsCollectionSnapshotQuery = parentObjPath
            ? firestore()
                  .doc(parentObjPath)
                  .collection(collectionName)
                  .where('deleted', '==', false)
                  .orderBy('timestamp', 'desc')
                  .where('timestamp', '>=', now)
            : null;

        unsubscribeLiveChatSnapshot =
            commentsCollectionSnapshotQuery.onSnapshot(commentsSnap => {
                // console.log('ON SNAPSHOT CALLED');
                let commentData = null;
                commentsSnap?.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        commentData = {
                            comment: change.doc.data(),
                            commentKey: change.doc.id,
                        };
                    }
                });

                if (commentData) {
                    if (
                        commentData.comment?.numThreadComments === 0 ||
                        !commentData.comment?.showCommentDeleted
                    ) {
                        dispatch({
                            type: 'prependLiveCommentsData',
                            payload: {liveComments: commentData},
                        });
                        dispatch({type: 'triggerUpdateList'});
                    }
                }
            });
    }, [dispatch]);

    let unsubscribeOlderChatSnapshot;
    const olderChatSnapshot = useCallback(() => {
        // console.log('FETCH COMMENTS CALLED');
        const liveMessageSnapshotQuery = parentObjPath
            ? firestore()
                  .doc(parentObjPath) // personas/MRqcyXnMe2SpIWerWn6p/chats/all
                  .collection('live')
                  .doc('messageCache')
                  .collection('messagesCache') // messages
                  .orderBy('lastUpdatedAtTimestamp', 'asc')
                  .where('lastUpdatedAtTimestamp', '>=', now)
            : null;

        unsubscribeOlderChatSnapshot = liveMessageSnapshotQuery.onSnapshot(
            async commentsSnap => {
                // console.log('ON SNAPSHOT CALLED');
                let commentsData = await Promise.all(
                    commentsSnap.docs.map(async commentDoc => {
                        return {
                            comment: commentDoc.data(),
                            commentKey: commentDoc.id,
                        };
                    }),
                );
                // commentsData = commentsData.filter(
                //     ({comment}) =>
                //         comment?.numThreadComments > 0 ||
                //         !comment?.showCommentDeleted,
                // );

                dispatch({
                    type: 'updateDoc',
                    payload: {newCommentData: commentsData},
                });
                dispatch({type: 'triggerUpdateList'});
            },
        );
    }, [dispatch]);

    useEffect(() => {
        if (scrollToMessageOrThread) {
            initialLoadWhenScrolling();
        } else {
            getNext(currentState);
        }

        setTimeout(() => {
            liveChatSnapshot();
            olderChatSnapshot();
        }, 300);

        return () => {
            console.log('unsubscribing live and cache snapshots');
            unsubscribeLiveChatSnapshot();
            unsubscribeOlderChatSnapshot();
        };
    }, []);

    const threadPayload = React.useRef(null);
    const [threads, setThreads] = useState({});
    const updateThreads = (_threadId, _threads, numberSeenPerThreadGroup) => {
        setThreads({...threads, [_threadId]: _threads});

        threadPayload.current = {
            firstThreadID:
                _threads.length > 0 ? _threads[1].commentKey : undefined,
            commentsMap: Object.fromEntries(
                _threads
                    .filter(t => t.component === 'comment')
                    .map(item => [
                        item.commentKey,
                        {...item.comment, threadID: item.threadID},
                    ]),
            ),
            numberSeenPerCommentGroup: numberSeenPerThreadGroup,
        };
    };

    const [openThreadSnapshots, setOpenThreadSnapshots] = useState([]);
    useEffect(() => {
        if (openThreadIDs.length > 0 && parentObjPath) {
            for (const tID of openThreadIDs) {
                if (!Object.keys(threads).includes(tID)) {
                    const threadCollection = firestore()
                        .doc(parentObjPath)
                        .collection(collectionName)
                        .doc(tID)
                        .collection('threads')
                        .where('deleted', '==', false)
                        .orderBy('timestamp')
                        .onSnapshot(threadsSnap => {
                            const threadData = threadsSnap.docs.map(
                                threadDoc => {
                                    return {
                                        comment: threadDoc.data(),
                                        commentKey: threadDoc.id,
                                    };
                                },
                            );

                            // In case linter breaks threads again
                            // threadsSnap.docs.map(threadDoc => {
                            //     return {
                            //         comment: threadDoc.data(),
                            //         commentKey: threadDoc.id,
                            //     };
                            // });

                            const [threadComments, numberSeenPerThreadGroup] =
                                generateCommentGroups(threadData, tID);

                            updateThreads(
                                tID,
                                threadComments.reverse(),
                                numberSeenPerThreadGroup,
                            );
                        });

                    setOpenThreadSnapshots(openThreadSnapshots => [
                        ...openThreadSnapshots,
                        threadCollection,
                    ]);
                }
            }
        }

        // unsubscribe from thread snapshots
        return () => {
            openThreadSnapshots.forEach(function (
                unsubscribeFromThreadSnapshot,
            ) {
                console.log('unsubscribing open thread snapshot');
                unsubscribeFromThreadSnapshot();
            });
        };
    }, [generateCommentGroups, openThreadIDs, comments]);

    const displayComments = useMemo(() => {
        if (openThreadIDs.length === Object.keys(threads).length) {
            let commentsWithThread = comments;
            openThreadIDs.forEach(tID => {
                if (threads[tID] !== undefined) {
                    const commentsCutoff = commentsWithThread.find(
                        ({key}) => key === tID,
                    );
                    const cutoffIndex =
                        commentsWithThread.indexOf(commentsCutoff);
                    if (cutoffIndex !== -1) {
                        const threadReply = {
                            component: 'threadReply',
                            key: `thread_reply_${tID}`,
                            comment: {
                                anonymous: commentsCutoff.comment?.anonymous,
                                identityID: commentsCutoff.comment?.identityID,
                                userID: commentsCutoff.comment.userID,
                                timestamp: commentsCutoff.comment.timestamp,
                                isThread: commentsCutoff.comment?.isThread,
                                numThreadComments:
                                    commentsCutoff.comment?.numThreadComments,
                                commentKey: tID,
                                replyUserName: commentsCutoff.replyUserName,
                            },
                        };

                        const threadReplyHeader = {
                            headerCommentKey: commentsCutoff.commentKey,
                            headerKey: `${commentsCutoff.commentKey}reply_header`,
                            component: 'header',
                            comment: {
                                anonymous: commentsCutoff.comment?.anonymous,
                                identityID: commentsCutoff.comment?.identityID,
                                userID: myUserID,
                                timestamp: commentsCutoff.comment.timestamp,
                                isThread: false,
                                isThreadReplyHeader: true,
                                numThreadComments:
                                    commentsCutoff.comment?.numThreadComments,
                            },
                            first: true,
                            commentKey: commentsCutoff.commentKey,
                            key: `${commentsCutoff.commentKey}reply_header`,
                            isThreadReplyHeader: true,
                        };
                        let endIndex = commentsWithThread.length;

                        // if (threadView) {
                        //     // in threadview, just get the thread's parent comment and the header
                        //     endIndex = cutoffIndex + 2;
                        // }

                        const updatedThread = commentsWithThread
                            .slice(0, cutoffIndex)
                            .concat([threadReply, threadReplyHeader])
                            .concat(threads[tID])
                            .concat(
                                commentsWithThread.slice(cutoffIndex, endIndex),
                            );

                        commentsWithThread = [...updatedThread];
                    }
                }
            });
            return commentsWithThread;
        } else {
            return comments;
        }
    }, [comments, threads]);

    useEffect(() => {
        if (commentPayload.current === null) {
            // console.log('set commentPayload loaded FALSE');
            dispatch({type: 'setCommentsLoaded', payload: false});
            return;
        }

        setTimeout(() => {
            const payload = {...commentPayload.current};
            payload.commentsMap = {
                ...payload.commentsMap,
                ...(threadPayload?.current?.commentsMap || {}),
            };

            if (threadPayload?.current !== null) {
                payload.numberSeenPerCommentGroup = {
                    ...payload.numberSeenPerCommentGroup,
                    ...threadPayload.current.numberSeenPerCommentGroup,
                };

                payload.firstThreadID = threadPayload.current.firstThreadID;
            }
            if (threadID !== null) {
                const commentsCutoff = comments.find(
                    ({key}) => key === threadID,
                );
                const cutoffIndex = comments.indexOf(commentsCutoff);
                if (cutoffIndex !== -1) {
                    payload.numHiddenComments = comments
                        .slice(0, cutoffIndex)
                        .filter(
                            ({component}) => component === 'comment',
                        ).length;
                }
            }
            payload.numberUnseenCommentsAtEnd =
                getNumberUnseenAtEnd(displayComments);
            dispatch({
                type: 'receivedNewComments',
                payload,
            });
            dispatch({type: 'setCommentsLoaded', payload: true});
            // console.log('set commentPayload loaded TRUE');
        }, 100);
    }, [
        // displayComments,
        getNumberUnseenAtEnd,
        dispatch,
        myUserID,
        comments,
        threads,
        // threadID,
        // openThreadIDs,
        // updateThreads,
    ]);

    const [modalVisible, setModalVisible] = useState(false);
    const canShowModal = true;
    const toggleModalVisibility = useCallback(() => {
        if (canShowModal) {
            setModalVisible(!modalVisible);
        }
    }, [canShowModal, modalVisible]);

    const overallHeight = React.useRef();
    overallHeight.current =
        (Dimensions.get('window').height +
            (modal ? -1 * 50 : 0) +
            (heightOffset + 4)) *
        heightScaleFactor;
    const animatedKeyboardHeight = useSharedValue(safeAreaOffset);

    const animatedKeyboardAvoidingStyle = useAnimatedStyle(() => {
        return {
            height: overallHeight.current - animatedKeyboardOffset.value,
        };
    });

    function keyboardWillShow(e) {
        console.log('=====keyboard show');
        if (Platform.OS === 'ios') {
            Keyboard.scheduleLayoutAnimation(e);
        } else {
            Keyboard.scheduleLayoutAnimation({
                duration: 250,
                easing: 'easeOut',
            });
        }
        animatedKeyboardOffset.value =
            e.endCoordinates.height + safeAreaOffsetKeyboardOpen;
        animatedKeyboardHeight.value = e.endCoordinates.height;
        if (animatedHeaderOptions) {
            animatedHeaderOptions.hideHeader();
        }
    }

    function keyboardWillHide(e) {
        if (Platform.OS === 'ios') {
            Keyboard.scheduleLayoutAnimation(e);
        } else {
            Keyboard.scheduleLayoutAnimation({
                duration: 250,
                easing: 'easeOut',
            });
        }
        animatedKeyboardOffset.value = safeAreaOffset;
        animatedKeyboardHeight.value = safeAreaOffset;

        if (animatedHeaderOptions) {
            animatedHeaderOptions.resetHeader();
        }
    }

    React.useEffect(() => {
        const subscriptions = [];
        if (Platform.OS === 'ios') {
            const willShow = Keyboard.addListener(
                'keyboardWillShow',
                keyboardWillShow,
            );
            const willHide = Keyboard.addListener(
                'keyboardWillHide',
                keyboardWillHide,
            );
            subscriptions.push(willShow, willHide);
        } else {
            const willShow = Keyboard.addListener(
                'keyboardDidShow',
                keyboardWillShow,
            );
            const willHide = Keyboard.addListener(
                'keyboardDidHide',
                keyboardWillHide,
            );
            subscriptions.push(willShow, willHide);
        }
        return () => {
            subscriptions.forEach(subscription => {
                subscription.remove();
            });
        };
    }, []);

    return (
        <Animated.View
            style={[
                Platform.OS === 'ios'
                    ? {...animatedKeyboardAvoidingStyle, ...style}
                    : {flex: 1, ...style},
                ,
            ]}>
            <DiscussionCommentList
                offsetY={animatedHeaderOptions?.scrollY}
                animatedKeyboardOffset={animatedKeyboardOffset}
                transparentBackground={transparentBackground}
                renderFromTop={renderFromTop}
                renderGoUpArrow={renderGoUpArrow}
                header={header}
                hideFirstTimelineSegment={hideFirstTimelineSegment}
                comments={displayComments}
                getFirebaseCommentsCollection={getFirebaseCommentsCollection}
                getFirebaseCommentsLiveCache={getFirebaseCommentsLiveCache}
                parentObjPath={parentObjPath}
                extraData={extraData}
                headerType={headerType}
                headerProps={headerProps}
                showThread={threadID !== null}
                isDM={isDM}
                // openToIndex={openToIndex}
                openToThreadID={openToThreadID}
                scrollToMessageID={scrollToMessageOrThread}
                getNext={getNext}
                renderCommentsData={renderCommentsData}
                canTextChat={canTextChat}
                loadNewerMessages={loadNewerMessages}
            />
            {!isDM && (
                <UserAutoCompleteWrapped
                    animatedKeyboardOffset={animatedKeyboardOffset}
                    animatedKeyboardHeight={animatedKeyboardHeight}
                    isDM={isDM}
                    personaID={personaKey}
                />
            )}
            {modal ? (
                <BottomModalComponent
                    headerProps={headerProps}
                    animatedKeyboardAvoidingStyle={
                        animatedKeyboardAvoidingStyle
                    }
                    safeAreaOffset={safeAreaOffset}
                    communityMap={communityMap}
                    parentObjPath={parentObjPath}
                    animatedKeyboardOffset={animatedKeyboardOffset}
                    animatedKeyboardHeight={animatedKeyboardHeight}
                    getFirebaseCommentsCollection={
                        getFirebaseCommentsCollection
                    }
                    getFirebaseCommentsLiveCache={getFirebaseCommentsLiveCache}
                    discussionTitle={discussionTitle}
                    modalVisible={modalVisible}
                    toggleModalVisibility={toggleModalVisibility}
                />
            ) : (
                <BottomComponent
                    headerProps={headerProps}
                    safeAreaOffset={safeAreaOffset}
                    communityMap={communityMap}
                    parentObjPath={parentObjPath}
                    animatedKeyboardOffset={animatedKeyboardOffset}
                    animatedKeyboardHeight={animatedKeyboardHeight}
                    getFirebaseCommentsCollection={
                        getFirebaseCommentsCollection
                    }
                    getFirebaseCommentsLiveCache={getFirebaseCommentsLiveCache}
                    discussionTitle={discussionTitle}
                    modalVisible={modalVisible}
                    toggleModalVisibility={toggleModalVisibility}
                />
            )}
            {isDM ? <View style={{height: 10}} /> : null}
            <OptionsModal navigation={navigation} />
            <RemixPulloutModal navigation={navigation} />
        </Animated.View>
    );
}

const BottomModalComponent = React.memo(
    BottomModalComponentMemo,
    propsAreEqual,
);
function BottomModalComponentMemo({
    safeAreaOffset,
    parentObjPath,
    animatedKeyboardOffset,
    animatedKeyboardHeight,
    getFirebaseCommentsCollection,
    getFirebaseCommentsLiveCache,
    discussionTitle,
    headerProps,
}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const replyComment = state.replyComment;

    const animatedKeyboardAvoidingStyle2 = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY:
                        animatedKeyboardOffset.value === safeAreaOffset
                            ? Platform.OS === 'ios'
                                ? -animatedKeyboardHeight.value + 44
                                : -animatedKeyboardHeight.value + 16
                            : 0,
                },
            ],
        };
    });

    const {
        current: {personaMap},
    } = React.useContext(GlobalStateRefContext);

    let personaKey = headerProps?.personaID;

    let canTextChat =
        personaKey && personaMap && personaMap[personaKey]
            ? personaMap[personaKey].publicCanChat ||
              (personaKey &&
                  personaMap[personaKey]?.authors?.includes(
                      auth().currentUser.uid,
                  ))
            : true;

    const isDM = parentObjPath.includes(SYSTEM_DM_PERSONA_ID);

    return (
        <Animated.View style={[animatedKeyboardAvoidingStyle2]}>
            {true && (
                <View
                    style={{
                        marginTop: 0,
                        width: Dimensions.get('window').width,
                        borderColor: 'blue',
                        borderWidth: 0,
                        top: -22,
                        height: !canTextChat ? 40 : 40,
                        zIndex: 999999999999999,
                        elevation: 999999999999999,
                        backgroundColor: 'transparent',
                    }}>
                    <DiscussionTypingIndicators
                        parentObjPath={parentObjPath}
                        replyComment={replyComment}
                        isDM={isDM}
                    />
                </View>
            )}
            {Platform.OS === 'android' ? (
                <Animated.View
                    blurType={'chromeMaterialDark'}
                    blurRadius={11}
                    blurAmount={1}
                    reducedTransparencyFallbackColor="black"
                    style={[
                        {
                            position: 'absolute',
                            bottom: 0,
                            zIndex: 9999999999999999,
                            elevation: 9999999999999999,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            opacity: 1,
                            borderWidth: 0,
                            borderColor: 'yellow',
                            width: Dimensions.get('window').width,
                        },
                    ]}>
                    <CreateDiscussionComment
                        animatedKeyboardOffset={animatedKeyboardOffset}
                        getDiscussionCollection={getFirebaseCommentsCollection}
                        getFirebaseCommentsLiveCache={
                            getFirebaseCommentsLiveCache
                        }
                        discussionTitle={discussionTitle}
                        parentObjPath={parentObjPath}
                    />
                    {/*parentObjPath && Object.keys(communityMap).length > 0 && (
                    <RoomsSmallStatus
                        rootParentObjPath={parentObjPath}
                        modalVisible={modalVisible}
                        toggleModalVisibility={toggleModalVisibility}
                    />
                )*/}
                </Animated.View>
            ) : (
                <AnimatedBlurView
                    blurType={'chromeMaterialDark'}
                    blurRadius={11}
                    blurAmount={1}
                    reducedTransparencyFallbackColor="black"
                    style={[
                        {
                            position: 'absolute',
                            bottom: 0,
                            zIndex: 9999999999999999,
                            elevation: 9999999999999999,
                            backgroundColor: 'transparent',
                            opacity: 1,
                            borderWidth: 0,
                            borderColor: 'yellow',
                            width: Dimensions.get('window').width,
                        },
                    ]}>
                    <CreateDiscussionComment
                        animatedKeyboardOffset={animatedKeyboardOffset}
                        getDiscussionCollection={getFirebaseCommentsCollection}
                        getFirebaseCommentsLiveCache={
                            getFirebaseCommentsLiveCache
                        }
                        discussionTitle={discussionTitle}
                        parentObjPath={parentObjPath}
                    />
                    {/*parentObjPath && Object.keys(communityMap).length > 0 && (
                    <RoomsSmallStatus
                        rootParentObjPath={parentObjPath}
                        modalVisible={modalVisible}
                        toggleModalVisibility={toggleModalVisibility}
                    />
                )*/}
                </AnimatedBlurView>
            )}
        </Animated.View>
    );
}

const BottomComponent = React.memo(BottomComponentMemo, propsAreEqual);
function BottomComponentMemo({
    safeAreaOffset,
    parentObjPath,
    animatedKeyboardOffset,
    animatedKeyboardHeight,
    getFirebaseCommentsCollection,
    getFirebaseCommentsLiveCache,
    discussionTitle,
    headerProps,
}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const replyComment = state.replyComment;
    const animatedKeyboardAvoidingStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY:
                        animatedKeyboardOffset.value === safeAreaOffset
                            ? Platform.OS === 'ios'
                                ? -animatedKeyboardHeight.value + 44
                                : -animatedKeyboardHeight.value + 16
                            : 0,
                },
            ],
        };
    });

    const {
        current: {personaMap},
    } = React.useContext(GlobalStateRefContext);

    let personaKey = headerProps?.personaID;

    let canTextChat =
        personaKey && personaMap && personaMap[personaKey]
            ? personaMap[personaKey].publicCanChat ||
              (personaKey &&
                  personaMap[personaKey]?.authors?.includes(
                      auth().currentUser.uid,
                  ))
            : true;

    const isDM = parentObjPath.includes(SYSTEM_DM_PERSONA_ID);

    return (
        <Animated.View style={[animatedKeyboardAvoidingStyle]}>
            {true && (
                <View
                    style={{
                        marginTop: 0,
                        width: Dimensions.get('window').width,
                        borderColor: 'blue',
                        borderWidth: 0,
                        top: -22,
                        height: !canTextChat ? 0 : 40,
                        zIndex: 999999999999999,
                        elevation: 999999999999999,
                        backgroundColor: 'transparent',
                    }}>
                    <DiscussionTypingIndicators
                        parentObjPath={parentObjPath}
                        replyComment={replyComment}
                        isDM={isDM}
                    />
                </View>
            )}
            {Platform.OS === 'android' ? (
                <Animated.View
                    blurType={'chromeMaterialDark'}
                    blurRadius={11}
                    blurAmount={1}
                    reducedTransparencyFallbackColor="black"
                    style={[
                        {
                            position: 'absolute',
                            bottom: 0,
                            zIndex: 9999999999999999,
                            elevation: 9999999999999999,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            opacity: 1,
                            borderWidth: 0,
                            borderColor: 'yellow',
                            width: Dimensions.get('window').width,
                        },
                    ]}>
                    <CreateDiscussionComment
                        animatedKeyboardOffset={animatedKeyboardOffset}
                        getDiscussionCollection={getFirebaseCommentsCollection}
                        getFirebaseCommentsLiveCache={
                            getFirebaseCommentsLiveCache
                        }
                        discussionTitle={discussionTitle}
                        parentObjPath={parentObjPath}
                    />
                    {/*parentObjPath && Object.keys(communityMap).length > 0 && (
                    <RoomsSmallStatus
                        rootParentObjPath={parentObjPath}
                        modalVisible={modalVisible}
                        toggleModalVisibility={toggleModalVisibility}
                    />
                )*/}
                </Animated.View>
            ) : (
                <AnimatedBlurView
                    blurType={'chromeMaterialDark'}
                    blurRadius={11}
                    blurAmount={1}
                    reducedTransparencyFallbackColor="black"
                    style={[
                        {
                            position: 'absolute',
                            bottom: 0,
                            zIndex: 9999999999999999,
                            elevation: 9999999999999999,
                            backgroundColor: 'transparent',
                            opacity: 1,
                            borderWidth: 0,
                            borderColor: 'yellow',
                            width: Dimensions.get('window').width,
                        },
                    ]}>
                    <CreateDiscussionComment
                        animatedKeyboardOffset={animatedKeyboardOffset}
                        getDiscussionCollection={getFirebaseCommentsCollection}
                        getFirebaseCommentsLiveCache={
                            getFirebaseCommentsLiveCache
                        }
                        discussionTitle={discussionTitle}
                        parentObjPath={parentObjPath}
                    />
                    {/*parentObjPath && Object.keys(communityMap).length > 0 && (
                    <RoomsSmallStatus
                        rootParentObjPath={parentObjPath}
                        modalVisible={modalVisible}
                        toggleModalVisibility={toggleModalVisibility}
                    />
                )*/}
                </AnimatedBlurView>
            )}
        </Animated.View>
    );
}

function UserAutoCompleteWrapped({
    animatedKeyboardOffset,
    animatedKeyboardHeight,
    isDM,
    personaID,
}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const editingPost = state.editingPost;
    const createDiscussionHeight = state.createDiscussionHeight;
    const animatedKeyboardAvoidingStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY:
                        animatedKeyboardOffset.value === safeAreaOffset
                            ? -animatedKeyboardHeight.value + 44
                            : 0,
                },
            ],
        };
    });
    return editingPost ? (
        <Animated.View
            style={[
                {
                    width: '100%',
                    position: 'absolute',
                    zIndex: 9999999999999999,
                    elevation: 9999999999999999,
                },
                animatedKeyboardAvoidingStyle,
            ]}>
            <UserAutocomplete personaID={personaID} isDM={isDM} />
        </Animated.View>
    ) : (
        <UserAutocomplete
            showPings={false}
            style={{
                position: 'absolute',
                bottom: createDiscussionHeight,
                width: 230,
                left: 140,
                borderRadius: 10,
                borderColor: colors.seperatorLineColor,
                borderWidth: 1,
                zIndex: 9999999999999999,
                elevation: 9999999999999999,
            }}
            personaID={personaID}
            isDM={isDM}
        />
    );
}
