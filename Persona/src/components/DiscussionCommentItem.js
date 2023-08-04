import React, {useState, useMemo} from 'react';
import auth from '@react-native-firebase/auth';
import baseText from 'resources/text';
import fonts from 'resources/fonts';
import {
    Animated,
    Dimensions,
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import colors from 'resources/colors';
import {timestampToDateString} from 'utils/helpers';
import images from 'resources/images';
import palette from 'resources/palette';
import ParseText from 'components/ParseText';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineStateContext,
    DiscussionEngineFrameStateContext,
} from './DiscussionEngineContext';
import isEqual from 'lodash.isequal';
import DiscussionEmojiList from './DiscussionEmojiList';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {
    LongPressGestureHandler,
    State,
    TapGestureHandler,
} from 'react-native-gesture-handler';
import {FullScreenMediaDispatchContext} from 'state/FullScreenMediaState';
import Pinchable from 'react-native-pinchable';
import getResizedImageUrl from 'utils/media/resize';
import DiscussionTypingIndicators from './DiscussionTypingIndicators';
import ChatVideo from './ChatVideo';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import {LeftRightSwipable} from './LeftRightSwipable';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(DiscussionCommentItem, propsAreEqual);

function DiscussionCommentItem({
    transparentBackground = false,
    item,
    isSelf,
    parentObjPath,
    getFirebaseCommentsCollection,
    getFirebaseCommentsLiveCache,
    headerProps,
    THREAD_OFFSET,
    commentListRef,
    index,
    registerMediaPlayer,
    triggerQuote,
}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    const commentSelected = state.commentsSelected[item.commentKey];

    const showCommentEndorsementOptions =
        state.showCommentEndorsementOptions[item.commentKey];
    const beingDeleted = state.commentsDeleted[item.commentKey];
    const beingEdited = state.editComment?.id === item.commentKey;
    const possiblyShowThreadComment =
        item.commentKey !== state.threadID &&
        !state.openThreadIDs.includes(item.commentKey);
    const contentVisibleHeight = frameState.contentVisibleHeight;
    // console.log('contentVisibleHeight',contentVisibleHeight);
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const possibleReplyUserID = item.comment.replyComment?.userID;
    const possibleReplyUser = possibleReplyUserID
        ? userMap[possibleReplyUserID]
        : undefined;
    const possibleReplyIdentityID = item.comment.replyComment?.identityID;
    const possibleReplyIdentity = possibleReplyIdentityID
        ? personaMap[possibleReplyIdentityID]
        : undefined;
    const possibleThreadUserID = item.comment.latestThreadComment?.userID;
    const possibleThreadUser = possibleThreadUserID
        ? userMap[possibleThreadUserID]
        : undefined;
    const possibleThreadIdentityID =
        item.comment.latestThreadComment?.identityID;
    const possibleThreadIdentity = possibleThreadIdentityID
        ? personaMap[possibleThreadIdentityID]
        : undefined;

    const expandItemReplyComment =
        state.expandItemReplyComment[item.commentKey] ?? false;

    return useMemo(
        () => (
            <DiscussionCommentItemMemo
                getFirebaseCommentsCollection={getFirebaseCommentsCollection}
                getFirebaseCommentsLiveCache={getFirebaseCommentsLiveCache}
                item={item}
                commentSelected={commentSelected}
                showCommentEndorsementOptions={showCommentEndorsementOptions}
                headerProps={headerProps}
                beingDeleted={beingDeleted}
                beingEdited={beingEdited}
                parentObjPath={parentObjPath}
                possibleReplyUser={possibleReplyUser}
                possibleThreadUser={possibleThreadUser}
                possibleThreadIdentity={possibleThreadIdentity}
                possibleReplyIdentity={possibleReplyIdentity}
                isSelf={isSelf}
                transparentBackground={transparentBackground}
                possiblyShowThreadComment={possiblyShowThreadComment}
                THREAD_OFFSET={THREAD_OFFSET}
                commentListRef={commentListRef}
                index={index}
                contentVisibleHeight={contentVisibleHeight}
                registerMediaPlayer={registerMediaPlayer}
                expandItemReplyComment={expandItemReplyComment}
                triggerQuote={triggerQuote}
            />
        ),
        [
            getFirebaseCommentsCollection,
            getFirebaseCommentsLiveCache,
            item,
            commentSelected,
            showCommentEndorsementOptions,
            headerProps,
            beingDeleted,
            beingEdited,
            parentObjPath,
            possibleReplyUser,
            possibleThreadUser,
            possibleThreadIdentity,
            possibleReplyIdentity,
            isSelf,
            transparentBackground,
            possiblyShowThreadComment,
            THREAD_OFFSET,
            commentListRef,
            index,
            contentVisibleHeight,
            registerMediaPlayer,
            expandItemReplyComment,
            triggerQuote,
        ],
    );
}

function DiscussionCommentItemMemo({
    item,
    commentSelected,
    transparentBackground = false,
    showCommentEndorsementOptions,
    isSelf,
    headerProps,
    parentObjPath,
    getFirebaseCommentsCollection,
    getFirebaseCommentsLiveCache,
    beingDeleted,
    beingEdited,
    possibleReplyUser,
    possibleReplyIdentity,
    possibleThreadUser,
    possibleThreadIdentity,
    possiblyShowThreadComment,
    THREAD_OFFSET,
    commentListRef,
    index,
    contentVisibleHeight,
    registerMediaPlayer,
    expandItemReplyComment,
    triggerQuote,
}) {
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    let personaID = headerProps?.personaID;

    const isDM = personaID === SYSTEM_DM_PERSONA_ID;

    let canChat =
        personaID &&
        personaMap &&
        personaMap[personaID] &&
        personaMap[personaID].authors
            ? personaMap[personaID].authors?.includes(auth().currentUser.uid) ||
              personaMap[personaID].publicCanChat
            : true;
    canChat = !canChat ? isDM : canChat;

    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);

    const IMAGE_WIDTH = 270;

    let isChat = parentObjPath.includes('chat');
    let backgroundColor = 'transparent';
    const commentOpacity = React.useRef(new Animated.Value(1)).current;
    let opacity = commentOpacity;
    if (beingDeleted) {
        opacity = 0.6;
        backgroundColor = colors.beingDeleted;
    }
    if (beingEdited) {
        backgroundColor = colors.textBeingEdited;
    }

    const itemReplyComment = item.comment?.replyComment;
    const itemThreadComment = item.comment?.latestThreadComment;

    const onPressComment = React.useCallback(() => {
        dispatch({type: 'clearSelectedComments'});
    }, [dispatch]);

    const onBlurComment = React.useCallback(() => {
        dispatch({type: 'clearEndorsementMenu'});
    }, [dispatch]);

    const endorsements = Object.entries(item.comment?.endorsements || [])
        .filter(([emoji, authors]) => authors.length > 0)
        .sort((a, b) => a[0].localeCompare(b[0], 'en'));

    //console.log('DiscussionCommentItem endorsements->', endorsements.length);

    const timestamp =
        item.comment.timestamp?.seconds &&
        timestampToDateString(item.comment.timestamp.seconds);
    const editTimestamp =
        item.comment.editTimestamp?.seconds &&
        timestampToDateString(item.comment.editTimestamp.seconds);
    const deletedTimestamp =
        item.comment.deletedAt?.seconds &&
        timestampToDateString(item.comment.deletedAt.seconds);

    const {dispatch: mediaDispatch} = React.useContext(
        FullScreenMediaDispatchContext,
    );
    const manageOpacity = nativeEvent => {
        if (nativeEvent.state === State.BEGAN) {
            Animated.timing(commentOpacity, {
                toValue: 0.5,
                duration: 20,
                useNativeDriver: true,
            }).start();
        }
        if (
            [
                State.END,
                State.FAILED,
                State.CANCELLED,
                State.UNDETERMINED,
            ].includes(nativeEvent.state)
        ) {
            commentOpacity.stopAnimation(() =>
                Animated.timing(commentOpacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }).start(),
            );
        }
    };
    const onMediaSingleTapHandlerStateChange = ({nativeEvent}) => {
        if (nativeEvent.oldState === State.ACTIVE) {
            const post = item.comment;
            mediaDispatch({type: 'setMediaPost', payload: post});
        }
    };
    const onMediaDoubleTapHandlerStateChange = ({nativeEvent}) => {
        manageOpacity(nativeEvent);
        if (nativeEvent.state === State.ACTIVE) {
            onPressComment();
        }
    };
    const onMediaLongPressHandlerStateChange = ({nativeEvent}) => {
        manageOpacity(nativeEvent);
    };
    const doubleTapHandler = React.useRef(null);
    const longPressTapHandler = React.useRef(null);
    const singleTapHandler = React.useRef(null);

    const isMedia = item.comment?.mediaUrl?.length > 0;
    const imageWidth = isMedia ? 270 : 0;
    const imageHeight =
        isMedia &&
        item.comment &&
        item.comment?.mediaHeight &&
        item.comment?.mediaWidth
            ? (item.comment?.mediaHeight * 270) / item.comment?.mediaWidth
            : 0;

    const [layout, setLayout] = useState(null);

    const onLayout = e => {
        setLayout(e.nativeEvent.layout);
    };

    // Standard render of comment in chat:
    return (
        <LeftRightSwipable
            onLeftTrigger={triggerQuote}
            onRightTrigger={triggerQuote}
            layout={layout}
            isDM={isDM}>
            <View
                onLayout={onLayout}
                style={[
                    {
                        ...Styles.infoContainer,
                        flex: 0,
                    },
                    isSelf
                        ? [
                              Styles.infoContainerRight,
                              {borderWidth: 5, borderColor: 'red'},
                          ]
                        : [
                              Styles.infoContainerLeft({
                                  isDM,
                                  isChat,
                                  isThread: item.comment?.isThread,
                                  threadOffset: THREAD_OFFSET,
                              }),
                              {borderWidth: 5, borderColor: 'green'},
                              ,
                          ],
                    {
                        borderColor: colors.yellowHighlight,
                        borderWidth: commentSelected ? 1 : 0,
                    },
                ]}>
                <Animated.View
                    style={[
                        Styles.textContainer,
                        isSelf
                            ? Styles.textContainerRight
                            : Styles.textContainerLeft,
                    ]}>
                    {item.comment?.showCommentDeleted ? (
                        <View
                            style={{
                                ...Styles.textBlob,
                                // width: '50%',
                                marginLeft: 10,
                            }}>
                            <Text
                                style={{
                                    ...baseText,
                                    color: colors.weakEmphasisOrange,
                                    fontStyle: 'italic',
                                }}>
                                [ Deleted {deletedTimestamp} ago ]
                            </Text>
                        </View>
                    ) : (
                        <Animated.View
                            style={{
                                backgroundColor: backgroundColor,
                                opacity,
                                flex: 0,
                                ...Styles.textBlob,
                                borderColor: colors.yellowHighlight,
                                borderWidth: 0,
                                marginEnd: !isChat ? 10 : 0,
                            }}>
                            <ItemReplyComment
                                itemReplyComment={itemReplyComment}
                                possibleReplyUser={possibleReplyUser}
                                possibleReplyIdentity={possibleReplyIdentity}
                                expanded={expandItemReplyComment}
                                registerMediaPlayer={registerMediaPlayer}
                                index={index}
                            />
                            {item.comment?.mediaUrl?.length > 0 && (
                                <LongPressGestureHandler
                                    ref={longPressTapHandler}
                                    onHandlerStateChange={
                                        onMediaLongPressHandlerStateChange
                                    }>
                                    <Animated.View
                                        style={{
                                            borderWidth: 0,
                                            borderColor: 'teal',
                                        }}>
                                        {item.comment?.mediaUrl?.slice(-3) ===
                                        'mp4' ? (
                                            <ChatVideo
                                                post={item.comment}
                                                navigation={null}
                                                fixedWidth={imageWidth}
                                                style={{
                                                    marginBottom: 5,
                                                    borderRadius: 7,
                                                    height: 400,
                                                    maxWidth: imageWidth,
                                                }}
                                                registerMe={registerMediaPlayer}
                                                index={index}
                                            />
                                        ) : (
                                            <TapGestureHandler
                                                ref={singleTapHandler}
                                                onHandlerStateChange={
                                                    onMediaSingleTapHandlerStateChange
                                                }>
                                                <Animated.View>
                                                    <Pinchable>
                                                        <FastImage
                                                            source={{
                                                                uri: getResizedImageUrl(
                                                                    {
                                                                        origUrl:
                                                                            item
                                                                                .comment
                                                                                ?.mediaUrl,
                                                                        width: item
                                                                            .comment
                                                                            ?.mediaWidth,
                                                                    },
                                                                ),
                                                            }}
                                                            style={{
                                                                borderRadius: 5,
                                                                height: imageHeight,
                                                                width: imageWidth,
                                                                marginTop: 1,
                                                                marginLeft: 20,
                                                                marginRight: 20,
                                                                marginBottom: 2,
                                                                right: 18,
                                                            }}
                                                            resizeMode={'cover'}
                                                        />
                                                    </Pinchable>
                                                </Animated.View>
                                            </TapGestureHandler>
                                        )}
                                    </Animated.View>
                                </LongPressGestureHandler>
                            )}
                            {!(item.comment?.text?.length > 0) && (
                                <View style={Styles.noTextCorrection} />
                            )}
                            <View
                                style={{
                                    borderWidth: 0,
                                    borderColor: 'pink',
                                    flex: 1,
                                }}>
                                <ParseText
                                    style={{
                                        lineHeight: 21.86,
                                        padding: 0,
                                        color: '#AAAEB2',
                                        fontSize: 17,
                                    }}
                                    text={item.comment?.text || ''}>
                                    {item.comment?.text || ''}
                                </ParseText>
                            </View>

                            {item.comment?.editTimestamp?.seconds && (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'flex-end',
                                    }}>
                                    <Text
                                        style={{
                                            ...baseText,
                                            fontSize: 10,
                                            marginRight: 10,
                                            marginTop: 5,
                                            marginBottom: -5,
                                            fontFamily: fonts.timestamp,
                                            lineHeight: null,
                                            color: colors.textFaded2,
                                        }}>
                                        edited{' '}
                                        {editTimestamp === '0m'
                                            ? 'now'
                                            : editTimestamp}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </Animated.View>

                {endorsements.length > 0 &&
                    !item.comment?.showCommentDeleted &&
                    !possiblyShowThreadComment && (
                        <View>
                            <DiscussionEmojiList
                                commentKey={item.commentKey}
                                endorsements={endorsements}
                                endorsementsMap={item.comment?.endorsements}
                                getFirebaseCommentsCollection={
                                    getFirebaseCommentsCollection
                                }
                                getFirebaseCommentsLiveCache={
                                    getFirebaseCommentsLiveCache
                                }
                                threadID={item?.threadID}
                            />
                        </View>
                    )}
                {endorsements.length > 0 &&
                    !item.comment?.showCommentDeleted &&
                    possiblyShowThreadComment && (
                        <View>
                            <DiscussionEmojiList
                                commentKey={item.commentKey}
                                endorsements={endorsements}
                                endorsementsMap={item.comment?.endorsements}
                                getFirebaseCommentsCollection={
                                    getFirebaseCommentsCollection
                                }
                                getFirebaseCommentsLiveCache={
                                    getFirebaseCommentsLiveCache
                                }
                                threadID={item?.threadID}
                            />
                        </View>
                    )}
                {
                    <ThreadComment
                        commentKey={item.commentKey}
                        possiblyShowThreadComment={possiblyShowThreadComment}
                        itemThreadComment={itemThreadComment}
                        possibleThreadUser={possibleThreadUser}
                        possibleThreadIdentity={possibleThreadIdentity}
                        numThreadComments={item.comment?.numThreadComments}
                        parentObjPath={item.parentObjPath}
                        replyUserName={item?.replyUserName}
                        commentListRef={commentListRef}
                        commentSelected={commentSelected}
                    />
                }
            </View>
        </LeftRightSwipable>
    );
}

function ThreadComment(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const threadView = state.threadView;

    return useMemo(
        () => <ThreadCommentMemo {...props} threadView={threadView} />,
        [props, threadView],
    );
}

function ThreadCommentMemo({
    commentKey,
    possiblyShowThreadComment,
    itemThreadComment,
    possibleThreadUser,
    possibleThreadIdentity,
    numThreadComments,
    threadView,
    parentObjPath,
    replyUserName,
    commentListRef,
    commentSelected,
}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const onPressThread = () => {
        if (Platform.OS === 'ios') {
            commentListRef?.current?.prepareForLayoutAnimationRender();
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        dispatch({type: 'clearEndorsementMenu'});
        dispatch({type: 'clearSelectedComments'});
        dispatch({type: 'setOpenThreadIDs', payload: commentKey});
        dispatch({type: 'setReplyUserName', payload: replyUserName});
    };
    const [threadHeight, setThreadHeight] = useState(45);
    const onLayout = e => setThreadHeight(e.nativeEvent.layout.height);
    const displayName = itemThreadComment?.anonymous
        ? possibleThreadIdentity?.name
        : possibleThreadUser?.userName;
    const profileUri = itemThreadComment?.anonymous
        ? possibleThreadIdentity?.profileImgUrl ||
          images.personaDefaultProfileUrl
        : possibleThreadUser?.profileImgUrl || images.userDefaultProfileUrl;
    const timelineColors = threadView
        ? ['black', colors.timeline]
        : ['black', colors.timeline, 'black'];
    const height = threadView ? 22 : threadHeight + 25;
    const timestamp =
        itemThreadComment?.timestamp?.seconds &&
        timestampToDateString(itemThreadComment.timestamp.seconds);
    return (
        <>
            {numThreadComments > 0 &&
                Boolean(itemThreadComment) &&
                possiblyShowThreadComment && (
                    <>
                        <View
                            style={{
                                elevation: 9999999999,
                                zIndex: 999999999,
                            }}>
                            <DiscussionTypingIndicators
                                parentObjPath={parentObjPath}
                                threadID={commentKey}
                                tiny={true}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={onPressThread}
                            style={{left: 5}}>
                            <View style={Styles.threadBreakoutStyle} />
                            <View
                                style={{
                                    ...Styles.threadTextBox,
                                    borderColor: colors.yellowHighlight,
                                    borderWidth: commentSelected ? 0 : 0,
                                }}
                                onLayout={onLayout}>
                                <View style={Styles.replyTextHeader}>
                                    <FastImage
                                        source={{
                                            uri:
                                                profileUri !==
                                                images.userDefaultProfileUri
                                                    ? getResizedImageUrl({
                                                          origUrl: profileUri,
                                                          width: Styles
                                                              .tinyPersonImage
                                                              .width,
                                                          height: Styles
                                                              .tinyPersonImage
                                                              .height,
                                                      })
                                                    : images.userDefaultProfileUri,
                                        }}
                                        style={Styles.tinyPersonImage}
                                    />
                                    <View
                                        style={{
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                        }}>
                                        <Text style={Styles.replyHeaderText}>
                                            <Text
                                                style={{
                                                    ...baseText,
                                                    lineHeight: null,
                                                    fontSize: 14,
                                                    color: colors.textFaded2,
                                                }}>
                                                {displayName}
                                            </Text>
                                            <Text
                                                style={{
                                                    ...baseText,
                                                    lineHeight: null,
                                                    fontSize: 10,
                                                    fontFamily: fonts.timestamp,
                                                    color: colors.maxFaded,
                                                }}>
                                                {' · '}
                                                {timestamp === '0m'
                                                    ? 'Now'
                                                    : timestamp}
                                            </Text>
                                        </Text>
                                    </View>
                                </View>
                                {itemThreadComment.text.length > 0 && (
                                    <View style={{paddingLeft: 17.5}}>
                                        <ParseText
                                            style={Styles.replyText}
                                            text={itemThreadComment.text}
                                        />
                                    </View>
                                )}
                                {itemThreadComment?.mediaUrl?.length > 0 && (
                                    <FastImage
                                        source={{
                                            uri: getResizedImageUrl({
                                                origUrl:
                                                    itemThreadComment?.mediaUrl,
                                                height: 100,
                                            }),
                                        }}
                                        style={{
                                            borderRadius: 5,
                                            height: 100,
                                            width: 100,
                                            marginTop: 1,
                                            marginLeft: 43,
                                            marginRight: 43,
                                            marginBottom: 2,
                                            opacity: 0.9,
                                        }}
                                        resizeMode={'contain'}
                                    />
                                )}
                            </View>
                            <Text style={Styles.threadBoxInfo}>
                                View {numThreadComments}{' '}
                                {numThreadComments === 1 ? 'reply' : 'replies'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
        </>
    );
}

function ItemReplyComment({
    itemReplyComment,
    possibleReplyUser,
    possibleReplyIdentity,
    expanded = false,
    registerMediaPlayer,
    index,
}) {
    const [replyHeight, setReplyHeight] = useState(45);
    const onLayout = e => setReplyHeight(e.nativeEvent.layout.height);
    const displayName = itemReplyComment?.anonymous
        ? possibleReplyIdentity?.name
        : possibleReplyUser?.userName;
    const profileUri = itemReplyComment?.anonymous
        ? possibleReplyIdentity?.profileImgUrl ||
          images.personaDefaultProfileUrl
        : possibleReplyUser?.profileImgUrl || images.userDefaultProfileUrl;
    const timestamp =
        itemReplyComment?.timestamp?.seconds &&
        timestampToDateString(itemReplyComment.timestamp.seconds);
    const displayString = expanded
        ? itemReplyComment?.text
        : itemReplyComment?.text?.length < 100
        ? itemReplyComment?.text
        : itemReplyComment?.text?.substring(0, 100) + '...';
    const isMedia = itemReplyComment?.mediaUrl?.length > 0;
    const imageWidth = isMedia ? 230 : 0;
    const imageHeight = isMedia
        ? (itemReplyComment?.mediaHeight * 230) / itemReplyComment?.mediaWidth
        : 0;

    return (
        <>
            {itemReplyComment && (
                <View style={{left: 0}}>
                    <View style={Styles.replyTextBox} onLayout={onLayout}>
                        <View style={Styles.replyTextHeader}>
                            <FastImage
                                source={{
                                    uri:
                                        profileUri !==
                                        images.userDefaultProfileUri
                                            ? getResizedImageUrl({
                                                  origUrl: profileUri,
                                                  width: Styles.tinyPersonImage
                                                      .width,
                                                  height: Styles.tinyPersonImage
                                                      .height,
                                              })
                                            : images.useDefaultProfileUri,
                                }}
                                style={Styles.tinyPersonImage}
                            />
                            <View
                                style={{
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                }}>
                                <Text style={Styles.replyHeaderText}>
                                    <Text
                                        style={{
                                            ...baseText,
                                            lineHeight: null,
                                            color: colors.textFaded2,
                                            fontSize: 14,
                                        }}>
                                        {displayName}
                                    </Text>
                                    <Text
                                        style={{
                                            ...baseText,
                                            lineHeight: null,
                                            color: colors.maxFaded,
                                            top: -4,
                                            fontSize: 10,
                                        }}>
                                        {' · '}
                                        {timestamp === '0m' ? 'Now' : timestamp}
                                    </Text>
                                </Text>
                            </View>
                        </View>
                        {itemReplyComment?.mediaUrl?.length > 0 && (
                            <Animated.View>
                                {itemReplyComment?.mediaUrl?.slice(-3) ===
                                'mp4' ? (
                                    <ChatVideo
                                        post={itemReplyComment}
                                        navigation={null}
                                        fixedWidth={imageWidth}
                                        style={{
                                            borderRadius: 7,
                                            opacity: 0.7,
                                            height: imageHeight,
                                            maxWidth: imageWidth, // IMAGE_WIDTH
                                        }}
                                        registerMe={registerMediaPlayer}
                                        index={index}
                                    />
                                ) : (
                                    <Pinchable>
                                        <FastImage
                                            source={{
                                                uri: getResizedImageUrl({
                                                    origUrl:
                                                        itemReplyComment?.mediaUrl,
                                                    width: itemReplyComment?.mediaWidth,
                                                }),
                                            }}
                                            style={{
                                                borderRadius: 5,
                                                height: imageHeight,
                                                width: imageWidth,
                                                marginTop: 1,
                                                marginLeft: 20,
                                                marginRight: 20,
                                                marginBottom: 2,
                                                right: 15,
                                                opacity: 0.5,
                                            }}
                                            resizeMode={'cover'}
                                        />
                                    </Pinchable>
                                )}
                            </Animated.View>
                        )}
                        {itemReplyComment.text.length > 0 && (
                            <View style={{paddingLeft: 17.5}}>
                                <ParseText
                                    style={Styles.replyText}
                                    text={displayString}
                                />
                            </View>
                        )}
                    </View>
                </View>
            )}
        </>
    );
}

const Styles = StyleSheet.create({
    threadBreakoutStyle: {
        marginLeft: palette.timeline.line.marginLeft - 5,
        width: 30,
        height: 30,
        zIndex: 0,
        marginTop: 7,
        borderBottomLeftRadius: 15,
        borderLeftWidth: 0.5,
        borderBottomWidth: 0.5,
        borderLeftColor: colors.seperatorLineColor,
        borderBottomColor: colors.seperatorLineColor,
        position: 'absolute',
    },
    threadTextBox: {
        marginLeft: 40,
        maxWidth: 250,
        marginRight: 20,
        fontSize: 14,
        borderRadius: 5,
        borderWidth: 0.5,
        borderColor: colors.seperatorLineColor,
        // paddingLeft: 8,
        paddingRight: 9,
        paddingBottom: 7,
        paddingTop: 4,
        marginBottom: 12,
        marginTop: 12,
        backgroundColor: colors.homeBackground,
    },
    timelineContinues: {
        ...palette.timeline.line,
        marginLeft: palette.timeline.line.marginLeft,
        position: 'absolute',
        height: 20,
        top: 0,
        backgroundColor: colors.timeline,
    },
    postSpacer: {
        height: 6,
    },
    likeMessage: {
        flex: 8,
    },
    container: {
        flexDirection: 'column',
        alignContent: 'space-between',
        flex: 1,
    },
    postImage: {
        marginTop: -9,
        marginBottom: 0,
        borderRadius: 7,
        height: 200,
        maxWidth: 270, // IMAGE_WIDTH
    },
    text: {
        color: colors.text,
        marginLeft: 10,
        marginRight: 10,
        fontSize: 14,
    },
    replyTextBox: {
        fontStyle: 'italic',
        marginLeft: 10,
        marginRight: 20,
        fontSize: 14,
        borderRadius: 5,
        borderWidth: 0,
        borderColor: colors.red,
        paddingLeft: 8,
        paddingRight: 9,
        paddingBottom: 7,
        paddingTop: 4,
        marginBottom: 5,
    },
    replyText: {
        fontStyle: 'italic',
        color: colors.textFaded2,
        fontSize: 14,
        paddingLeft: 17.5,
    },
    replyHeaderText: {
        ...baseText,
        lineHeight: null,
        color: colors.textFaded2,
        fontSize: 14,
        marginTop: Platform.OS === 'ios' ? 0 : -1.5,
    },
    replyTextHeader: {
        borderColor: 'orange',
        color: colors.textFaded2,
        borderWidth: 0,
        height: 13,
        marginTop: 3,
        marginBottom: 4,
        flexDirection: 'row',
    },
    userButton: {
        paddingRight: 10,
        alignSelf: 'flex-start',
        flex: 4,
    },
    textContainer: {
        flexDirection: 'row',
        flex: 1,
        borderWidth: 0,
        borderColor: 'yellow',
        alignItems: 'center',
    },

    textContainerLeft: {
        justifyContent: 'flex-start',
    },
    textContainerRight: {
        justifyContent: 'flex-end',
    },

    textContainerForModal: {
        borderWidth: 0,
        borderColor: 'yellow',
        alignItems: 'center',
    },

    infoContainer: {
        marginTop: 4, // DM 4, chat 8 ??
        borderColor: 'purple',
        borderWidth: 5,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        backgroundColor: '#1B1D1F',
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderRadius: 16,
        zIndex: 1000,
    },
    infoContainerLeft: ({isDM, isChat, isThread, threadOffset}) => {
        let marginLeft;

        if (isChat) {
            marginLeft = 0;
        }

        if (isDM) {
            marginLeft = 0;
        }

        if (isThread) {
            marginLeft = 0;
        }

        return {
            backgroundColor: '#1B1D1F',
            // borderBottomLeftRadius: 4, // AROTH: TODO based on grouping
            marginLeft: marginLeft,
            // zIndex: -1,
        };
    },
    infoContainerRight: {
        backgroundColor: '#203349',
        // borderBottomRightRadius: 4, // AROTH: TODO based on grouping
        // marginRight: 16,
        // marginLeft: 16,
    },
    personName: {
        color: colors.text,
        fontSize: 14,
        marginStart: 10,
    },
    tinyPersonImage: {
        width: 13,
        height: 13,
        borderRadius: 13,
        marginRight: 4,
    },
    textBlob: {
        justifyContent: 'flex-start',
        flex: 0,
        marginBottom: 0,
        maxWidth: 280,
    },
    noTextCorrection: {marginBottom: -19},
    threadBoxInfo: {
        ...baseText,
        marginLeft: 61,
        fontSize: 14,
        color: colors.textFaded2,
        marginTop: -7,
        height: 20,
    },
});
