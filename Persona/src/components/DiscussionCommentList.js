import React, {
    useCallback,
    useEffect,
    useRef,
    useMemo,
    createContext,
    useState,
} from 'react';
import RoomsSmallStatus from 'components/RoomsSmallStatus';
import {heightOffset} from 'components/NotchSpacer';
import getResizedImageUrl from 'utils/media/resize';
import baseText from 'resources/text';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
    View,
    Animated as RNAnimated,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    TextInput,
} from 'react-native';
import {AnimatedFlashList, CellContainer} from '@shopify/flash-list';
import colors from 'resources/colors';
import DiscussionCommentButtons from './DiscussionCommentButtons';
import DiscussionCommentItem from './DiscussionCommentItem';
import DiscussionCommentReply from './DiscussionCommentReply';
import DiscussionCommentHeader from './DiscussionCommentHeader';
import DiscussionHeader from './DiscussionHeader';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineFrameDispatchContext,
    DiscussionEngineStateContext,
    DiscussionEngineFrameStateContext,
} from './DiscussionEngineContext';
import DiscussionEndorsementUsers from './DiscussionEndorsementUsers';
import isEqual from 'lodash.isequal';
import auth from '@react-native-firebase/auth';
import {getServerTimestamp} from 'actions/constants';
import FeedEndorsementsMenu from './FeedEndorsementMenu';
import FeedEndorsementUsersMenu from './FeedEndorsementUserMenu';
import {withTiming, useSharedValue} from 'react-native-reanimated';
import DiscussionInlineProposal from './DiscussionInlineProposal';
import DiscussionInlinePost from './DiscussionInlinePost';
import FloatingHeader from './FloatingHeader';
import EndorsementsModal from 'components/EndorsementsModal';
import {GlobalStateContext} from 'state/GlobalState';
import {DateTime} from 'luxon';
import DateSeperatorListItem from 'components/DateSeperatorListItem';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CommunityStateContext} from 'state/CommunityState';
import FastImage from 'react-native-fast-image';
import {makeRegisterMediaPlayer} from 'utils/media/helpers';
import firestore from '@react-native-firebase/firestore';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export const CommentListRefContext = createContext();

export default React.memo(DiscussionEngineCommentList, propsAreEqual);

function DiscussionEngineCommentList(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    const invertedFlatlist = state.invertedFlatlist;
    // const commentsLoaded = state.commentsLoaded;
    const openThreadIDs = state.openThreadIDs;
    const toggleScrollToIndex = state.toggleScrollToIndex;
    // const toggleScrollToItem = state.toggleScrollToItem;
    const contentLength = frameState.contentLength;
    const contentVisibleHeight = frameState.contentVisibleHeight;
    const postHeight = frameState.postHeight;
    // const offsetY = frameState.offsetY;
    const threadID = state.threadID;
    const noMoreDocs = state.noMoreDocs;
    const didScroll = state.didScroll;

    return useMemo(
        () => (
            <DiscussionEngineCommentListMemo
                {...props}
                invertedFlatlist={invertedFlatlist}
                // commentsLoaded={commentsLoaded}
                openThreadIDs={openThreadIDs}
                toggleScrollToIndex={toggleScrollToIndex}
                // toggleScrollToItem={toggleScrollToItem}
                contentLength={contentLength}
                // offsetY={offsetY}
                threadID={threadID}
                contentVisibleHeight={contentVisibleHeight}
                postHeight={postHeight}
                noMoreDocs={noMoreDocs}
                didScroll={didScroll}
            />
        ),
        [
            props,
            invertedFlatlist,
            openThreadIDs,
            toggleScrollToIndex,
            noMoreDocs,
            didScroll,
        ],
    );
}

export function DiscussionEngineCommentListMemo({
    animatedKeyboardOffset,
    header = true,
    parentObjPath,
    extraData = null,
    renderFromTop = false,
    renderGoUpArrow = false,
    hideFirstTimelineSegment,
    transparentBackground = false,
    comments,
    headerType,
    headerProps,
    getFirebaseCommentsCollection,
    getFirebaseCommentsLiveCache,
    invertedFlatlist,
    isDM,
    // commentsLoaded,
    openThreadIDs,
    toggleScrollToIndex,
    // toggleScrollToItem,
    openToThreadID,
    contentLength,
    contentVisibleHeight,
    postHeight,
    offsetY,
    threadID,
    scrollToMessageID,
    getNext,
    renderCommentsData,
    noMoreDocs,
    canTextChat,
    didScroll,
    loadNewerMessages,
}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {dispatch: frameDispatch} = React.useContext(
        DiscussionEngineFrameDispatchContext,
    );
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const communityContext = React.useContext(CommunityStateContext);

    let scrollToMessage = null;
    if (!didScroll && comments.length > 0) {
        scrollToMessage = scrollToMessageID;
        dispatch({type: 'setDidScroll', payload: true});
    }

    if (scrollToMessage) {
        dispatch({
            type: 'setCommentSelect',
            payload: {[scrollToMessageID]: true},
        });
    }

    const [mediaArtifactRegistry, setMediaArtifactRegistry] = React.useState(
        {},
    );

    const myUserID = auth().currentUser.uid;
    const handleViewableItemsChanged = global.HANDLE_VIEWABLE_ITEMS_CHANGED
        ? useCallback(
              items => {
                  items.changed.forEach(({key, isViewable}) => {
                      if (mediaArtifactRegistry[key]) {
                          if (!isViewable) {
                              mediaArtifactRegistry[key].stop();
                          } else if (
                              mediaArtifactRegistry[key].startPaused === false
                          ) {
                              mediaArtifactRegistry[key].start();
                          }
                      }
                  });

                  items.changed
                      .filter(({item}) => item?.component === 'comment')
                      .filter(({isViewable}) => isViewable)
                      .filter(
                          ({item}) =>
                              (item.comment?.seen || {})[myUserID] ===
                              undefined,
                      )
                      .forEach(({item}) => {
                          let docRef = getFirebaseCommentsCollection();
                          if (item?.threadID) {
                              docRef = docRef
                                  .doc(item.threadID)
                                  .collection('threads');
                          }
                          docRef.doc(item.commentKey).set(
                              {
                                  seen: {
                                      [myUserID]: getServerTimestamp(),
                                  },
                              },
                              {merge: true},
                          );
                      });
              },
              [myUserID],
          )
        : null;

    const commentListRef = useRef();
    const headerRef = useRef();
    const animatedOffset = useRef(new RNAnimated.Value(0)).current;

    // const [offsetY, setOffsetY] = useState(0);
    // const [contentHeight, setContentHeight] = useState(1000); // default to 1k
    // const personaHeaderOpacity = useSharedValue(0);

    const onPressGoDownArrow = React.useCallback(() => {
        dispatch({type: 'setInvertedFlatlist', payload: true});
        // dispatch({type: 'clearEndorsementMenu'});
        dispatch({type: 'clearSelectedComments'});
        dispatch({type: 'clearShowEditMenu'});
        commentListRef.current.scrollToOffset({
            animated: true,
            offset: 0,
        });
    }, [dispatch, commentListRef]);

    const onPressGoUpArrow = React.useCallback(() => {
        // console.log('_/|\\_ ON PRESS GO UP ARROW _/|\\_');
        // first, invert the flash/flat list
        // dispatch({ type: 'setInvertedFlatlist', payload: false });

        // flag to clear selected comments when scrolling, depending on where this function is being called

        dispatch({type: 'clearSelectedComments'});

        // I think we can remove this...commenting out for now
        // dispatch({ type: 'clearShowEditMenu' });

        // I think we can remove this...commenting out for now
        // dispatch({ type: 'clearShowEditMenu' });

        // last step, scroll to zero which, when not invertedFlatlist, is the top
        let scrollComments = comments || [];
        if (commentListRef?.current && scrollComments?.length > 0) {
            commentListRef?.current?.scrollToIndex({
                index: comments.length - 1,
                animated: true,
            });
        }
    }, [dispatch, commentListRef, comments]);

    // Unsure if we need this anymore
    // useEffect(() => {
    //     commentListRef?.current?.scrollToEnd({
    //         animated: true,
    //     });
    // },[invertedFlatlist]);

    const flippedRenderFromTop = React.useRef(false);

    useEffect(() => {
        if (renderFromTop && !flippedRenderFromTop.current) {
            dispatch({type: 'setInvertedFlatlist', payload: false});
        }
        // purposefully outside of if
        flippedRenderFromTop.current = true;
    }, []);

    // Calc number of lines of text
    const numLinesText = line => {
        let totalLineCount = 1;
        let currentLineCount = 0;
        const shortChars = /([.,!()*{}|/'`:; \\])/g;
        const lowerCaseChars = /([a-z])/g;
        const upperCaseChars = /([A-Z])/g;
        const emojiChars =
            /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
        for (const char of line) {
            // add to currentLineCount (how long is the current line)
            if (char.match(shortChars)) {
                currentLineCount += 0.575;
            } else if (char.match(lowerCaseChars)) {
                currentLineCount += 1.15;
            } else if (char.match(upperCaseChars)) {
                currentLineCount += 1.45;
            } else if (char.match(emojiChars)) {
                currentLineCount += 2.8;
            } else {
                currentLineCount += 1;
            }

            // Add newline when lineCount adds up to 31
            if (currentLineCount >= 31.295) {
                totalLineCount += 1;
                currentLineCount = 0;
            }
        }

        return totalLineCount;
        // return Math.ceil(line.length / 31);
    };

    // Estimate length of List
    const getItemHeight = (item, index) => {
        // let item = data;
        if (item?.comment?.messageType === 'proposal') {
            item.component = 'proposal';
        }
        if (item?.comment?.messageType === 'transfer') {
            item.component = 'transfer';
        }
        if (item?.comment?.messageType === 'post') {
            item.component = 'post';
        }

        // if(item.component === 'startOfMessages') {
        //     console.log('di9ng ding ding start of messages');
        // }

        let height = 0;

        switch (item.component) {
            case 'header':
                height = 56;
                break;
            case 'dateSeparator':
                height = 10;
                break;
            case 'footer':
                height = 5;
                break;
            case 'proposal':
                height = 262 + 100;
                break;
            case 'transfer':
                height = 51 + 100;
                break;
            case 'post':
                height = 252 + 200;
                break;
            case 'threadReply':
                height = 47 + 50;
                break;
            case 'comment':
                // BASE height for zero line comment = 39-21 = 18
                height = 18;

                // Is it an image?
                if (
                    item.comment?.mediaUrl?.length > 0 &&
                    !item.comment?.replyComment
                ) {
                    // console.log('comment has an image and is not a quote. Zero lines of text');
                    height = 221;
                }

                // Is it a quote?
                if (item.comment?.replyComment) {
                    // console.log('comment is quoted');
                    height = 54; // a single line quote with single line text response = 96, so 96-21-21 = 54

                    if (
                        item.comment?.replyComment?.mediaUrl?.length > 0 &&
                        item.comment?.mediaUrl?.length > 0
                    ) {
                        // console.log('orig quoted comment AND new msg both have images in them. No text.');
                        height = 410;
                    } else if (
                        item.comment?.replyComment?.mediaUrl?.length > 0 &&
                        item.comment?.mediaUrl?.length === 0
                    ) {
                        // console.log('orig quoted comment has an image in it, but no img in new msg');
                        height = 207; // No text. will always have at least 1 line but will add later, 228-21 = 207
                    }
                }

                // Is it a thread?
                if (item.comment?.numThreadComments > 0) {
                    // console.log('is a thread (parent)');
                    if (!openThreadIDs.includes(item.commentKey)) {
                        // console.log('closed thread, rendered parent + closed 1st thread');
                        height += 77; // size of thread base with zero lines (will always have 1 but will add later) 98-21=77

                        // Does thread contain an image? If so +103
                        if (
                            item.comment?.latestThreadComment?.mediaUrl
                                ?.length > 0
                        ) {
                            height += 103;
                        }
                    } else {
                        if (item.comment?.mediaUrl?.length > 0) {
                            height = 221 + 200;
                        } else {
                            height = 20; // 41-21 = 20; Zero lines of text in open parent. Will add lines of text later. Threaded msgs will be their own comments
                        }
                        // console.log('open thread, this is rendered parent');
                    }
                }

                // Calculate the lines:
                let linesOfText = 0;

                // Quoted text
                if (item.comment?.replyComment?.text?.length > 0) {
                    let textLines = item.comment?.replyComment?.text.substring(
                        0,
                        100,
                    );
                    textLines = item.comment?.replyComment?.text.split('\n');
                    textLines.forEach(line => {
                        const numLines = numLinesText(line);
                        linesOfText += numLines;
                    });
                }

                // Closed thread text
                if (
                    item.comment?.latestThreadComment?.text?.length > 0 &&
                    item.comment?.numThreadComments > 0 &&
                    !openThreadIDs.includes(item.commentKey)
                ) {
                    const textLines =
                        item.comment?.latestThreadComment?.text.split('\n');
                    textLines.forEach(line => {
                        const numLines = numLinesText(line);
                        linesOfText += numLines;
                    });
                }

                // Comment text
                if (item.comment?.text?.length > 0) {
                    const textLines = item.comment?.text.split('\n');
                    textLines.forEach(line => {
                        const numLines = numLinesText(line);
                        linesOfText += numLines;
                    });
                }

                height += linesOfText * 21;

                // Last, figure out if there are endorsements and/or edits
                if (
                    item?.comment?.endorsements &&
                    Object.keys(item.comment.endorsements).length > 0
                ) {
                    // console.log('has endorsement');
                    height += 27;
                }

                if (item.comment?.editTimestamp?.seconds) {
                    // console.log('is edited');
                    height += 10;
                }

                break;
        }
        return {length: height, index};
    };

    // Flashlist implementation
    const getItemLayout = (layout, item, index) => {
        const {length} = getItemHeight(item, index);
        layout.size = length;
    };

    const THREAD_OFFSET = 32;
    const scaleY = React.useMemo(
        () => (Platform.OS === 'ios' ? null : invertedFlatlist ? -1 : null),
        [invertedFlatlist],
    );

    // const { fontScale } = useWindowDimensions(); //toRemove or consider for accessibility settings
    const onPressLoadNewerMessages = React.useCallback(
        state => {
            loadNewerMessages(state);
        },
        [state],
    );

    const onLongPressComment = React.useCallback(
        (isSelf, item, index) => {
            const personaID = headerProps?.personaID;
            let canChat =
                personaID &&
                personaMap &&
                personaMap[personaID] &&
                personaMap[personaID].authors
                    ? personaMap[personaID].authors?.includes(
                          auth().currentUser.uid,
                      ) || personaMap[personaID].publicCanChat
                    : true;
            canChat = !canChat ? isDM : canChat;
            if (canChat) {
                // dispatch({type: 'commentPress', payload: item.commentKey});
                const options = {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                };

                Platform.OS === 'ios'
                    ? ReactNativeHapticFeedback.trigger('impactHeavy', options)
                    : ReactNativeHapticFeedback.trigger('impactLight', options);

                dispatch({type: 'commentLongPress', payload: item.commentKey});
                dispatch({
                    type: 'setEndorsementsModalProps',
                    payload: {
                        isSelf,
                        item,
                        index,
                    },
                });

                commentListRef.current?.scrollToIndex({
                    animated: true,
                    index: index,
                    viewOffset: 180,
                });
            } else {
                return null;
            }
        },
        [dispatch],
    );

    const onPressComment = key => {
        dispatch({type: 'expandComment', payload: key});
    };

    function ReportContentBox() {
        const userContext = React.useContext(GlobalStateContext);
        const [newReport, setNewReport] = React.useState('');
        const submitReport = () => {
            log('submitting report', newReport);

            const reportsRef = firestore().collection('reports');

            reportsRef
                .add({
                    userID: auth().currentUser.uid,
                    timestamp: firestore.Timestamp.now(),
                    report: newReport,
                    title: 'ProfileMenuScreen Report',
                })
                .then(() => {
                    setNewReport('');
                    Keyboard.dismiss();
                    alert(
                        "Report sent! We'll follow up with you by contacting you directl!",
                    );
                });
        };

        return (
            <>
                <Text
                    style={{
                        ...baseText,
                        color: colors.text,
                        marginStart: 20,
                        marginTop: 20,
                        marginBottom: 20,
                    }}>
                    Please describe to us the content you find concerning{' '}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        marginTop: 0,
                        paddingTop: 10,
                        paddingLeft: 15,
                        paddingBottom: 15,
                        alignItems: 'center',
                        borderTopWidth: 1,
                        borderBottomWidth: 1,
                        borderTopColor: colors.seperatorLineColor,
                        borderBottomColor: colors.seperatorLineColor,
                        width: '100%',
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            color: colors.text,
                            fontWeight: 'bold',
                        }}>
                        {' '}
                    </Text>
                    <FastImage
                        source={{
                            uri: getResizedImageUrl({
                                origUrl:
                                    userContext.user.profileImgUrl ||
                                    images.personaDefaultProfileUrl,
                                height: Styles.personImage.height,
                                width: Styles.personImage.width,
                            }),
                        }}
                        style={Styles.personImage}
                    />
                    <TextInput
                        multiline={true}
                        style={Styles.textInput}
                        placeholder={'Post a report on content...'}
                        placeholderTextColor={colors.textFaded2}
                        editable={true}
                        clearTextOnFocus={false}
                        onChangeText={setNewReport}
                        spellCheck={true}
                        value={newReport}
                        keyboardAppearance="dark"
                        maxLength={300}
                    />
                    <TouchableOpacity
                        style={Styles.postAction}
                        onPress={submitReport}
                        disabled={!newReport}>
                        <View style={Styles.sendIcon}>
                            <Icon
                                name="send"
                                size={24}
                                color={colors.actionText}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </>
        );
    }

    const renderCommentsItem = React.useCallback(
        ({item, index}) => {
            if (item?.comment?.messageType === 'proposal') {
                item.component = 'proposal';
            }
            if (item?.comment?.messageType === 'transfer') {
                item.component = 'transfer';
            }
            if (item?.comment?.messageType === 'post') {
                item.component = 'post';
            }

            let isChat = parentObjPath.includes('chat');
            let isPost = parentObjPath.includes('posts');

            let isThreadParent = item?.comment?.numThreadComments > 0;
            let isThread = item?.comment?.isThread;
            let isSelf =
                !item?.comment?.isThread &&
                item?.comment?.userID === auth().currentUser.uid;
            let isPrevSelf =
                !item?.comment?.isThread &&
                item?.comment?.prevUserID === auth().currentUser.uid;
            let chatArrangement =
                !item?.comment?.isThread && (isChat || isPost)
                    ? {
                          justifyContent:
                              !isSelf || isThreadParent
                                  ? 'flex-start'
                                  : 'flex-end',
                      }
                    : {
                          borderWidth: 0,
                          borderColor: 'red',
                          marginLeft: isThread ? 32 : 0,
                      };
            let isSelfModify =
                !item?.comment?.isThread && isChat
                    ? isSelf && !isThreadParent
                        ? {
                              justifyContent: 'flex-end',
                              marginStart: 55,
                          }
                        : {
                              width: '95%',
                          }
                    : {};

            const {length} = getItemHeight(item, index);

            if (
                item?.comment?.deleted === true &&
                !item?.comment?.showCommentDeleted
            ) {
                console.log(
                    'item is deleted AND showCommentDeleted is false or undefined',
                );
                return <></>;
            }

            const currentComment = {
                ...item.comment,
                id: item.commentKey,
            };

            const triggerQuote = () => {
                dispatch({
                    type: 'setReplyComment',
                    payload: currentComment,
                });
                dispatch({type: 'clearSelectedComments'});
                dispatch({type: 'clearShowEditMenu'});
                dispatch({type: 'toggleKeyboard'});
            };

            const user = userMap[item.comment?.userID];

            switch (item.component) {
                case 'dateSeparator':
                    return (
                        <View style={{margin: 10}}>
                            <DateSeperatorListItem date={item?.date} />
                        </View>
                    );
                case 'header':
                    if (item?.comment?.userID === 'system') {
                        return (
                            <View
                                onLayout={onLayoutComponent(item)}
                                style={{
                                    scaleY,
                                    borderColor: 'orange',
                                    borderWidth: 0,
                                    flexDirection: 'row',
                                    ...chatArrangement,
                                    height: 10,
                                }}
                            />
                        );
                    }

                    return (
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent:
                                    isSelf || !isChat
                                        ? 'flex-end'
                                        : 'flex-start',
                                alignItems: 'baseline',
                                borderWidth: 0,
                                borderColor: 'red',
                                marginTop: 13,
                                marginLeft:
                                    isChat && !isDM && !isPrevSelf
                                        ? 60 + (isThread ? 24 : 0)
                                        : isPost
                                        ? 28
                                        : 10,
                            }}>
                            <Text
                                style={{
                                    marginRight: 4,
                                    color: '#82878C',
                                    fontSize: 13,
                                    zIndex: 99999,
                                }}>
                                {item.comment?.anonymous
                                    ? identity?.name
                                    : user?.userName}{' '}
                                ·
                            </Text>
                            <CommentTimestamp
                                seconds={item?.comment?.timestamp?.seconds}
                                isSelf={isSelf}
                            />
                        </View>
                    );
                case 'comment':
                    return (
                        <TouchableOpacity
                            activeOpacity={1}
                            onLongPress={() =>
                                onLongPressComment(isSelf, item, index)
                            }
                            onPress={() => {
                                onPressComment(item.commentKey);
                            }}
                            delayLongPress={200}>
                            <View
                                style={{
                                    scaleY,
                                    borderColor: 'green',
                                    borderWidth: 0,
                                    flexDirection: 'row',
                                    alignItems: 'flex-end',
                                    ...chatArrangement,
                                    paddingBottom: isThreadParent ? 8 : 0,
                                    marginLeft: isPost
                                        ? 38
                                        : isThread
                                        ? 32 + 6
                                        : 0,
                                }}
                                onLayout={onLayoutComponent(item)}>
                                {!isDM && !isSelf && (
                                    <View
                                        style={
                                            {
                                                // flexDirection: 'row',
                                                // flex: 1,
                                                // width: '50%',
                                            }
                                        }>
                                        <DiscussionCommentHeader
                                            isSelf={isSelf}
                                            openFromTop={renderFromTop}
                                            parentObjPath={parentObjPath}
                                            transparentBackground={
                                                transparentBackground
                                            }
                                            hideFirstTimelineSegment={
                                                hideFirstTimelineSegment
                                            }
                                            item={item}
                                            THREAD_OFFSET={THREAD_OFFSET}
                                        />
                                    </View>
                                )}
                                <DiscussionCommentItem
                                    headerProps={headerProps}
                                    isSelf={isSelf}
                                    parentObjPath={parentObjPath}
                                    transparentBackground={
                                        transparentBackground
                                    }
                                    item={item}
                                    getFirebaseCommentsCollection={
                                        getFirebaseCommentsCollection
                                    }
                                    getFirebaseCommentsLiveCache={
                                        getFirebaseCommentsLiveCache
                                    }
                                    THREAD_OFFSET={THREAD_OFFSET}
                                    commentListRef={commentListRef}
                                    index={index}
                                    registerMediaPlayer={makeRegisterMediaPlayer(
                                        mediaArtifactRegistry,
                                        setMediaArtifactRegistry,
                                        'DiscussionCommentItem',
                                    )}
                                    triggerQuote={triggerQuote}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                case 'proposal':
                    return (
                        <View
                            onLayout={onLayoutComponent(item)}
                            style={{
                                scaleY,
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: 1,
                                width: '100%',
                                borderColor: 'orange',
                                borderWidth: 0,
                                flexDirection: 'row',
                                padding: 10,
                                paddingTop: 20,
                                paddingBottom: 20,
                                // height: 262
                            }}>
                            <DiscussionInlineProposal
                                post={item?.comment?.post}
                                proposal={item?.comment?.proposal}
                            />
                        </View>
                    );
                case 'transfer':
                    return (
                        <View
                            onLayout={onLayoutComponent(item)}
                            style={{
                                scaleY,
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: 1,
                                width: '100%',
                                borderColor: 'orange',
                                borderWidth: 0,
                                flexDirection: 'row',
                                paddingLeft: 10,
                                paddingRight: 10,
                                paddingTop: 25,
                                paddingBottom: 15,
                                height: 81,
                            }}>
                            <Text
                                style={{
                                    ...baseText,
                                    color: colors.textFaded2,
                                    fontSize: 12,
                                }}>
                                {item?.comment?.text}
                            </Text>
                        </View>
                    );
                case 'post':
                    return (
                        <View
                            onLayout={onLayoutComponent(item)}
                            style={{
                                // scaleY,
                                justifyContent: 'center',
                                alignItems: 'center',
                                // flex: 1,
                                // width: '100%',
                                borderColor: 'red',
                                borderWidth: 0,
                                // flexDirection: 'row',
                                // padding: 10,
                                // paddingTop: 10,
                                // paddingBottom: 0,
                                // marginEnd: 5,
                                // height: 252,
                            }}>
                            <DiscussionInlinePost
                                parentObjPath={parentObjPath}
                                post={item?.comment?.post}
                            />
                        </View>
                    );
                case 'footer':
                    return (
                        false && (
                            <View
                                // key={`footer_${item.commentKey}`}
                                onLayout={onLayoutComponent(item)}
                                style={{
                                    borderColor: 'green',
                                    borderWidth: 0,
                                    marginLeft:
                                        isChat && !isDM && !isPrevSelf
                                            ? 38 + (isThread ? 24 : 0)
                                            : isPost
                                            ? 28
                                            : 10,
                                    alignItems: isPrevSelf
                                        ? 'flex-end'
                                        : 'flex-start',
                                }}>
                                <CommentTimestamp
                                    seconds={
                                        item?.comment?.prevTimestamp?.seconds
                                    }
                                    isSelf={isPrevSelf}
                                />
                            </View>
                        )
                    );
                case 'threadReply':
                    if (canTextChat) {
                        return (
                            <View
                                onLayout={onLayoutComponent(item)}
                                style={{
                                    scaleY,
                                    borderColor: 'orange',
                                    borderWidth: 0,
                                    flexDirection: 'row',
                                    marginStart: 3,
                                    height: 47,
                                }}>
                                <DiscussionCommentReply
                                    commentListRef={commentListRef}
                                    headerProps={headerProps}
                                    isSelf={isSelf}
                                    parentObjPath={parentObjPath}
                                    transparentBackground={
                                        transparentBackground
                                    }
                                    item={item}
                                    THREAD_OFFSET={THREAD_OFFSET}
                                    index={index}
                                />
                            </View>
                        );
                    } else {
                        return <></>;
                    }
                case 'startOfMessages':
                    return (
                        <>
                            <View
                                onLayout={onLayoutComponent(item)}
                                style={{
                                    scaleY,
                                    borderColor: 'orange',
                                    borderWidth: 0,
                                    flexDirection: 'row',
                                    marginStart: 3,
                                    height: 26,
                                }}
                            />
                        </>
                    );
            }
        },
        [
            getFirebaseCommentsCollection,
            headerProps,
            hideFirstTimelineSegment,
            parentObjPath,
            scaleY,
            transparentBackground,
            invertedFlatlist,
            comments,
            setMediaArtifactRegistry,
            mediaArtifactRegistry,
        ],
    );

    const onLayoutComponent = React.useCallback(
        item => e => {
            // todo determine if we need this
            if (Platform.OS === 'ios') {
                // commentListRef.current.commentIndexMap[item.key].length =
                //     e.nativeEvent.layout.height;
            }
        },
        [commentListRef],
    );

    const onLayout = React.useCallback(
        e => {
            frameDispatch({
                type: 'setContentVisibleHeight',
                payload: e.nativeEvent.layout.height,
            });
        },
        [frameDispatch],
    );

    const onScrollListener = React.useCallback(
        e => {
            frameDispatch({
                type: 'setListOffset',
                payload: e.nativeEvent.contentOffset.y,
            });
            frameDispatch({
                type: 'setContentLength',
                payload:
                    e.nativeEvent.contentSize.height -
                    e.nativeEvent.layoutMeasurement.height,
            });
        },
        [frameDispatch],
    );

    const onScroll = RNAnimated.event(
        [
            {
                nativeEvent: {
                    contentOffset: {y: offsetY ? offsetY : animatedOffset},
                },
            },
        ],
        {
            useNativeDriver: true,
            listener: onScrollListener,
        },
    );

    const keyExtractor = React.useCallback(
        (item, index) => index,
        [invertedFlatlist],
    );
    const onLayoutHeader = React.useCallback(
        e => {
            dispatch({
                type: 'setHeaderHeight',
                payload: e.nativeEvent.layout.height,
            });
        },
        [dispatch],
    );

    const data = invertedFlatlist ? comments : [...comments].reverse();

    const [initialScrollIndex, setInitialScrollIndex] = useState(0);
    const [initialScrollOffset, setInitialScrollOffset] = useState(0);

    // Handle scroll to message from notifications
    //     useEffect(() => {
    //         if (scrollToMessageID) {
    //             // setTimeout(() => {
    //                 const commentToOpenTo = comments.find(
    //                     c => c.key === scrollToMessageID,
    //                 );
    //                 const index = comments.indexOf(commentToOpenTo);
    //                 if (index !== -1) {
    //                     setInitialScrollIndex(index);
    //
    //                     // TODO this initial offset behaves oddly when the initialScrollIndex is near the top
    //
    //                     let offset = 0;
    //                     for (let i = 0; i <= index; i++) {
    //                         const {length} = getItemHeight(comments[i], i);
    //                         offset += length;
    //                     }
    //                     setInitialScrollOffset(offset);

    // dispatch({
    //     type: 'toggleScrollToIndex',
    //     payload: index,
    // });

    // Uncomment below if we want to show message that we are scrolling to from navigation in a modal
    // after clicking the notification or ActivityEvent notification
    // dispatch({type: 'commentLongPress', payload: scrollToMessage});
    // dispatch({
    //     type: 'setEndorsementsModalProps',
    //     payload: {
    //         isSelf: false,
    //         item: comments[index],
    //         index,
    //         shouldDeselectComment: false,
    //     },
    // });
    // }
    // }, 200);
    //     }
    // }, [scrollToMessageID, comments]);

    // const inverted = Platform.OS === 'ios' ? invertedFlatlist : null;
    const inverted = invertedFlatlist;
    const [modalVisible, setModalVisible] = useState(false);
    const canShowModal = true;
    const toggleModalVisibility = useCallback(() => {
        if (canShowModal) {
            setModalVisible(!modalVisible);
        }
    }, [canShowModal, modalVisible]);

    // const onScrollEndDrag = useCallback(() => {
    //     console.log('scroll ends', state.fullHeaderVisible);
    //     if(!state.fullHeaderVisible) {
    //         dispatch({type:'setFullHeaderVisible', payload: true});
    //     }
    //
    // },[dispatch]);

    const [scrollEnabled, setScrollEnabled] = useState(true);

    // const [flashListLoaded, setFlashListLoaded] = useState(false);
    const onLoadFlashList = info => {
        // dispatch({
        //     type: 'setFlashlistLoaded',
        //     payload: true,
        // });
    };

    if (!flippedRenderFromTop.current) {
        dispatch({
            type: 'setFlashlistLoaded',
            payload: true,
        });
    }

    const onEndReached = () => {
        if (
            flippedRenderFromTop.current &&
            !noMoreDocs &&
            ((scrollToMessageID && didScroll) || !scrollToMessageID)
        ) {
            getNext(state);
        }
    };

    // need to re-render list when new data e.g. new chat message comes through
    useEffect(() => {
        // console.log('get next first load'); // don't need this
        // getNext(state);
    }, []);

    useEffect(() => {
        renderCommentsData(state);
        try {
            const myUserID = auth().currentUser.uid;
            let docRef = getFirebaseCommentsCollection();

            // NOTE: instead of pulling communityActivity every time we mark a chat seen,
            // we could make communityActivity always subscribed and globally available
            firestore().runTransaction(async tx => {
                const update = {
                    lastSeen: getServerTimestamp(),
                };

                const currentCommunity = communityContext?.currentCommunity;
                if (!isDM && currentCommunity) {
                    const communityActivity = (
                        await tx.get(
                            firestore()
                                .collection('communities')
                                .doc(currentCommunity)
                                .collection('live')
                                .doc('activity'),
                        )
                    ).data();

                    const messageCount =
                        communityActivity?.chats[docRef.path]?.messageCount;
                    if (messageCount) {
                        update.messageCount = messageCount;
                    }
                }

                tx.set(
                    firestore()
                        .collection('users')
                        .doc(myUserID)
                        .collection('live')
                        .doc('seen'),
                    {
                        [docRef.path]: update,
                    },
                    {merge: true},
                );
            });
            // TODO: LastSeen will be deprecated
            // Do not set the `LastSeen` doc for DMs, as this breaks
            // cacheLatestChatOnMessageUpdate -> `draftchatCaching` logic
            if (!(SYSTEM_DM_PERSONA_ID === headerProps?.personaID || isDM)) {
                docRef.doc('LastSeen').set(
                    {
                        [myUserID]: getServerTimestamp(),
                    },
                    {merge: true},
                );
            }
        } catch (e) {
            console.log(e);
        }
    }, [state.updateList]);

    useEffect(() => {
        if (toggleScrollToIndex) {
            const index = toggleScrollToIndex;
            if (index && index >= 0 && state.flashListLoaded) {
                const msgHeight = getItemHeight(comments[index], index);
                commentListRef.current.scrollToIndex({
                    animated: true,
                    index: index,
                    viewOffset: 120,
                    viewPosition: invertedFlatlist ? 0 : 1,
                });
                dispatch({
                    type: 'toggleScrollToIndex',
                    payload: false,
                });
            }
        }
    }, [toggleScrollToIndex]);

    return (
        <>
            {Platform.OS === 'ios' ? (
                <View style={{flex: 1}}>
                    <AnimatedFlashList
                        inverted={inverted}
                        extraData={extraData}
                        ref={commentListRef}
                        initialScrollIndex={initialScrollIndex}
                        estimatedFirstItemOffset={initialScrollOffset}
                        ListFooterComponentStyle={{
                            justifyContent: 'flex-start',
                        }}
                        ListHeaderComponentStyle={{justifyContent: 'flex-end'}}
                        contentInset={{top: 0, left: 0, bottom: 0, right: 0}}
                        scrollIndicatorInsets={{
                            top: 0,
                            left: 20,
                            bottom: 0,
                            right: 0,
                        }}
                        showsVerticalScrollIndicator={true}
                        ListHeaderComponent={
                            <>
                                {flippedRenderFromTop.current &&
                                    // Post Header
                                    (!parentObjPath.includes('all') &&
                                    !invertedFlatlist ? (
                                        <View
                                            style={{scaleY}}
                                            onLayout={onLayoutHeader}>
                                            <View
                                                style={{
                                                    height: 104 + heightOffset,
                                                }}
                                            />
                                            <CommentListRefContext.Provider
                                                value={commentListRef}>
                                                <DiscussionHeader
                                                    animatedKeyboardOffset={
                                                        animatedKeyboardOffset
                                                    }
                                                    headerType={headerType}
                                                    headerProps={headerProps}
                                                />
                                            </CommentListRefContext.Provider>
                                        </View>
                                    ) : !invertedFlatlist ? (
                                        <View style={{height: 245}} />
                                    ) : (
                                        // Chat footer
                                        <>
                                            {parentObjPath && (
                                                <RoomsSmallStatus
                                                    rootParentObjPath={
                                                        parentObjPath
                                                    }
                                                    modalVisible={modalVisible}
                                                    toggleModalVisibility={
                                                        toggleModalVisibility
                                                    }
                                                />
                                            )}
                                            <View
                                                style={{
                                                    borderWidth: 0,
                                                    borderColor: 'pink',
                                                    height: isDM ? 100 : 20,
                                                }}
                                            />
                                        </>
                                    ))}
                            </>
                        }
                        ListFooterComponent={
                            <>
                                {flippedRenderFromTop.current &&
                                !parentObjPath.includes('all') &&
                                invertedFlatlist ? (
                                    noMoreDocs || data?.length < 40 ? (
                                        // Post Header when invertedFlatlist is toggled
                                        <View
                                            style={{scaleY}}
                                            onLayout={onLayoutHeader}>
                                            <View
                                                style={{
                                                    height: 104 + heightOffset,
                                                }}
                                            />
                                            <CommentListRefContext.Provider
                                                value={commentListRef}>
                                                <DiscussionHeader
                                                    animatedKeyboardOffset={
                                                        animatedKeyboardOffset
                                                    }
                                                    headerType={headerType}
                                                    headerProps={headerProps}
                                                />
                                            </CommentListRefContext.Provider>
                                        </View>
                                    ) : (
                                        <ActivityIndicator
                                            size="large"
                                            style={{
                                                marginTop: 200,
                                                marginBottom: 60,
                                            }}
                                            color={colors.text}
                                        />
                                    )
                                ) : parentObjPath.includes('all') &&
                                  invertedFlatlist ? (
                                    noMoreDocs || data?.length < 30 ? (
                                        // Chat header
                                        <View
                                            style={{
                                                scaleY,
                                                height: 240 + heightOffset,
                                                borderColor: 'pink',
                                                borderWidth: 0,
                                            }}
                                        />
                                    ) : (
                                        <ActivityIndicator
                                            size="large"
                                            style={{
                                                marginTop: 200,
                                                marginBottom: 60,
                                            }}
                                            color={colors.text}
                                        />
                                    )
                                ) : noMoreDocs || data?.length < 30 ? (
                                    // Post Footer
                                    <>
                                        {parentObjPath && (
                                            <RoomsSmallStatus
                                                rootParentObjPath={
                                                    parentObjPath
                                                }
                                                modalVisible={modalVisible}
                                                toggleModalVisibility={
                                                    toggleModalVisibility
                                                }
                                            />
                                        )}
                                        <View
                                            style={{
                                                borderColor: 'magenta',
                                                borderWidth: 0,
                                                height: 40,
                                            }}
                                        />
                                    </>
                                ) : (
                                    <ActivityIndicator
                                        size="large"
                                        style={{
                                            marginTop: 200,
                                            marginBottom: 60,
                                        }}
                                        color={colors.text}
                                    />
                                )}
                            </>
                        }
                        bounces={true}
                        keyExtractor={keyExtractor}
                        data={data}
                        renderItem={renderCommentsItem}
                        onLayout={onLayout}
                        onScroll={onScroll}
                        onViewableItemsChanged={handleViewableItemsChanged}
                        estimatedItemSize={300}
                        overrideItemLayout={getItemLayout}
                        // onBlankArea={(blankeAreaEvent)=> {
                        //     console.log(blankeAreaEvent);
                        // }}
                        drawDistance={3000}
                        // disableIntervalMomentum={true}
                        decelerationRate={Platform.OS === 'ios' ? 0.995 : 0.958}
                        scrollEnabled={scrollEnabled}
                        // onContentSizeChange={onContentSizeChange}
                        onLoad={onLoadFlashList}
                        onEndReached={onEndReached}
                        onEndReachedThreshold={0.5}
                        // scrollEventThrottle={16}
                    />
                </View>
            ) : (
                // ANDROID ------------------------- //
                <RNAnimated.FlatList
                    inverted={inverted}
                    extraData={extraData}
                    ref={commentListRef}
                    ListFooterComponentStyle={{justifyContent: 'flex-start'}}
                    ListHeaderComponentStyle={{justifyContent: 'flex-end'}}
                    contentInset={{top: 0, left: 0, bottom: 0, right: 0}}
                    scrollIndicatorInsets={{
                        top: 0,
                        left: 20,
                        bottom: 0,
                        right: 0,
                    }}
                    showsVerticalScrollIndicator={true}
                    ListHeaderComponent={
                        <>
                            {flippedRenderFromTop.current &&
                                // Post Header
                                (!parentObjPath.includes('all') &&
                                !invertedFlatlist ? (
                                    <View
                                        style={{scaleY}}
                                        onLayout={onLayoutHeader}>
                                        <View
                                            style={{height: 104 + heightOffset}}
                                        />
                                        <CommentListRefContext.Provider
                                            value={commentListRef}>
                                            <DiscussionHeader
                                                animatedKeyboardOffset={
                                                    animatedKeyboardOffset
                                                }
                                                headerType={headerType}
                                                headerProps={headerProps}
                                            />
                                        </CommentListRefContext.Provider>
                                    </View>
                                ) : !invertedFlatlist ? (
                                    <View style={{height: 245}} />
                                ) : (
                                    // Chat footer
                                    <>
                                        {parentObjPath && (
                                            <RoomsSmallStatus
                                                rootParentObjPath={
                                                    parentObjPath
                                                }
                                                modalVisible={modalVisible}
                                                toggleModalVisibility={
                                                    toggleModalVisibility
                                                }
                                            />
                                        )}
                                        <View
                                            style={{
                                                borderWidth: 0,
                                                borderColor: 'pink',
                                                height: isDM ? 80 : 20,
                                            }}
                                        />
                                    </>
                                ))}
                        </>
                    }
                    ListFooterComponent={
                        <>
                            {flippedRenderFromTop.current &&
                            !parentObjPath.includes('all') &&
                            invertedFlatlist ? (
                                noMoreDocs ? (
                                    // Post Header when invertedFlatlist is toggled
                                    <View
                                        style={{scaleY}}
                                        onLayout={onLayoutHeader}>
                                        <View
                                            style={{height: 104 + heightOffset}}
                                        />
                                        <CommentListRefContext.Provider
                                            value={commentListRef}>
                                            <DiscussionHeader
                                                animatedKeyboardOffset={
                                                    animatedKeyboardOffset
                                                }
                                                headerType={headerType}
                                                headerProps={headerProps}
                                            />
                                        </CommentListRefContext.Provider>
                                    </View>
                                ) : (
                                    <ActivityIndicator
                                        size="large"
                                        style={{
                                            marginTop: 200,
                                            marginBottom: 60,
                                        }}
                                        color={colors.text}
                                    />
                                )
                            ) : parentObjPath.includes('all') &&
                              invertedFlatlist ? (
                                noMoreDocs || data?.length < 30 ? (
                                    // Chat header
                                    <View
                                        style={{
                                            scaleY,
                                            height: 300 + heightOffset,
                                            borderColor: 'pink',
                                            borderWidth: 0,
                                        }}
                                    />
                                ) : (
                                    <ActivityIndicator
                                        size="large"
                                        style={{
                                            marginTop: 200,
                                            marginBottom: 60,
                                        }}
                                        color={colors.text}
                                    />
                                )
                            ) : noMoreDocs ? (
                                // Post Footer
                                <>
                                    {parentObjPath && (
                                        <RoomsSmallStatus
                                            rootParentObjPath={parentObjPath}
                                            modalVisible={modalVisible}
                                            toggleModalVisibility={
                                                toggleModalVisibility
                                            }
                                        />
                                    )}
                                    <View
                                        style={{
                                            borderColor: 'magenta',
                                            borderWidth: 0,
                                            height: 40,
                                        }}
                                    />
                                </>
                            ) : (
                                <ActivityIndicator
                                    size="large"
                                    style={{
                                        marginTop: 200,
                                        marginBottom: 60,
                                    }}
                                    color={colors.text}
                                />
                            )}
                        </>
                    }
                    bounces={true}
                    keyExtractor={keyExtractor}
                    data={data}
                    renderItem={renderCommentsItem}
                    onLayout={onLayout}
                    onScroll={onScroll}
                    initialNumToRender={20}
                    // maxToRenderPerBatch={200}
                    onViewableItemsChanged={handleViewableItemsChanged}
                    decelerationRate={Platform.OS === 'ios' ? 0.995 : 0.978}
                    scrollEnabled={scrollEnabled}
                    // onContentSizeChange={onContentSizeChange}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.75}
                />
            )}

            {header && (
                <FloatingHeader
                    headerProps={headerProps}
                    back={
                        !parentObjPath?.includes('communities') &&
                        !parentObjPath?.includes('all')
                    }
                    animatedOffset={animatedOffset}
                    postID={headerProps?.postID}
                    personaID={headerProps?.personaID}
                    onPressGoUpArrow={onPressGoUpArrow}
                    invertedFlatlist={invertedFlatlist}
                    parentObjPath={parentObjPath}
                />
            )}

            <DiscussionCommentButtons
                parentObjPath={parentObjPath}
                personaID={headerProps?.personaID}
                renderGoUpArrow={renderGoUpArrow}
                animatedOffset={offsetY || animatedOffset}
                onPressGoDownArrow={onPressGoDownArrow}
                onPressGoUpArrow={onPressGoUpArrow}
                invertedFlatlist={invertedFlatlist}
                commentListRef={commentListRef}
                isDM={isDM}
                scrollToMessageID={scrollToMessageID}
                loadNewerMessages={loadNewerMessages}
                // contentHeight={contentHeight}
            />

            <DiscussionEndorsementUsers commentListRef={commentListRef} />
            <HandleScrollToEnd commentListRef={commentListRef} />
            <HandleScrollWhenClosingThread commentListRef={commentListRef} />
            {/* <HandleScrollToIndex */}
            {/*     commentListRef={commentListRef} */}
            {/*     invertedFlatlist={invertedFlatlist} */}
            {/*     scrollToMessageID={scrollToMessageID} */}
            {/*     toggleScrollToIndex={toggleScrollToIndex} */}
            {/* /> */}
            <FeedEndorsementsMenu offset={50} />
            <FeedEndorsementUsersMenu />
            <EndorsementsModal
                // animatedOffset={animatedOffset}
                getFirebaseCommentsCollection={getFirebaseCommentsCollection}
                getFirebaseCommentsLiveCache={getFirebaseCommentsLiveCache}
                // headerType={headerType}
                personaID={headerProps.personaID}
                postID={headerProps.postID}
                commentListRef={commentListRef}
                THREAD_OFFSET={THREAD_OFFSET}
                headerProps={headerProps}
                parentObjPath={parentObjPath}
                transparentBackground={transparentBackground}
            />
        </>
    );
}

function HandleScrollWhenClosingThread({commentListRef}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    const offsetY = frameState.offsetY;
    const toggleScrollWhenCancelingThreadReply =
        state.toggleScrollWhenCancelingThreadReply;

    useEffect(() => {
        if (toggleScrollWhenCancelingThreadReply !== undefined) {
            commentListRef.current.scrollToOffset({
                animated: true,
                offset: offsetY + 30,
            });
        }
    }, [toggleScrollWhenCancelingThreadReply]);
    return <></>;
}

function HandleScrollToEnd({commentListRef}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const toggleScrollToStart = state.toggleScrollToStart;
    useEffect(() => {
        if (toggleScrollToStart !== undefined) {
            commentListRef.current.scrollToOffset({
                animated: true,
                offset: 0,
            });
        }
    }, [toggleScrollToStart]);
    return <></>;
}

export const CommentTimestamp = ({seconds, isSelf}) => {
    let dateTime;
    let timeString;
    if (seconds) {
        dateTime = DateTime.fromSeconds(seconds);
        timeString = dateTime.toFormat('h:mm a').toLowerCase();
    }

    if (!timeString) {
        return null;
    }

    return (
        <View
            style={{
                marginTop: 4,
                marginRight: isSelf ? 0 : 0,
                marginLeft: isSelf ? 0 : 0,
                borderWidth: 0,
                borderColor: 'blue',
                padding: 0,
            }}>
            <Text style={{color: '#868B8F', fontSize: 11}}>{timeString}</Text>
        </View>
    );
};

const Styles = StyleSheet.create({
    loadingText: {
        color: colors.text,
        marginStart: 40,
        marginEnd: 40,
        marginTop: 60,
    },
    reportContentContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 0,
        paddingTop: 10,
        paddingLeft: 15,
        paddingBottom: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: colors.seperatorLineColor,
        borderBottomColor: colors.seperatorLineColor,
        width: Dimensions.get('window').width - 10,
    },
    textInput: {
        ...baseText,
        color: 'white',
        fontSize: 14,
        marginLeft: 10,
        flex: 12,
        backgroundColor: colors.seperatorLineColor,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 8,
        borderRadius: 5,
    },
    personImage: {
        width: 30,
        height: 30,
        borderRadius: 30,
    },
});
