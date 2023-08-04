import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import ViewPostsButton from 'components/DiscussionChatHeader/ViewPostsButton';
import React, {useEffect, useMemo, useRef} from 'react';
import {
    Animated,
    Dimensions,
    LayoutAnimation,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import colors from 'resources/colors';
import baseText from 'resources/text';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import AddPostButton from './AddPostButton';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineFrameStateContext,
    DiscussionEngineStateContext,
} from './DiscussionEngineContext';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

export default function DiscussionCommentButtons(props) {
    return (
        <>
            {/* <ThreadButtons {...props} /> */}
            <GoToButtons {...props} />
        </>
    );
}

function ThreadButtons(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    const contentVisibleHeight = frameState.contentVisibleHeight;
    const threadView = state.threadView;
    const numberUnseenCommentsAtEndAbsolute =
        state.numberUnseenCommentsAtEndAbsolute;
    const numberUnseenThreadsAtEnd = state.numberUnseenThreadsAtEnd;
    const threadID = state.threadID;
    const numberThreads = state.numberThreads;
    return useMemo(
        () => (
            <ThreadButtonsMemo
                {...props}
                contentVisibleHeight={contentVisibleHeight}
                threadView={threadView}
                numberUnseenCommentsAtEndAbsolute={
                    numberUnseenCommentsAtEndAbsolute
                }
                numberUnseenThreadsAtEnd={numberUnseenThreadsAtEnd}
                threadID={threadID}
                numberThreads={numberThreads}
            />
        ),
        [
            props,
            contentVisibleHeight,
            threadView,
            numberUnseenThreadsAtEnd,
            numberUnseenCommentsAtEndAbsolute,
            threadID,
            numberThreads,
        ],
    );
}

function ThreadButtonsMemo({
    contentVisibleHeight,
    threadView,
    numberUnseenThreadsAtEnd,
    numberUnseenCommentsAtEndAbsolute,
    threadID,
    numberThreads,
    commentListRef,
}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);

    const viewingThreadOrThreadView = threadView || threadID !== null;

    const onPress = () => {
        commentListRef.current?.prepareForLayoutAnimationRender();
        LayoutAnimation.configureNext({
            duration: 300,
            create: {
                type: LayoutAnimation.Types.easeInEaseOut,
                property: LayoutAnimation.Properties.opacity,
            },
            update: {
                type: LayoutAnimation.Types.easeInEaseOut,
            },
        });
        dispatch({type: 'setThreadView', payload: !viewingThreadOrThreadView});
        dispatch({type: 'clearThread'});
    };
    const numberToDisplay = viewingThreadOrThreadView
        ? numberUnseenCommentsAtEndAbsolute
        : numberUnseenThreadsAtEnd;
    const name = viewingThreadOrThreadView ? 'message-circle' : 'git-merge';
    return (
        <>
            {numberThreads == 0 && (
                <View
                    style={{
                        ...Styles.overlayButton,
                        top: contentVisibleHeight - 100,
                        opacity: 0.7,
                    }}>
                    <TouchableOpacity onPress={onPress}>
                        {false && numberToDisplay > 0 && (
                            <View style={Styles.overlayButtonNumber}>
                                <Text
                                    style={{
                                        ...baseText,
                                        color: 'white',
                                        fontSize: 11,
                                    }}>
                                    {numberToDisplay}
                                </Text>
                            </View>
                        )}
                        <Feather
                            name={name}
                            size={23}
                            color={'black'}
                            style={{paddingLeft: 4.7, paddingTop: 3.5}}
                        />
                    </TouchableOpacity>
                </View>
            )}
        </>
    );
}

function GoToButtons(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    let threadID = state.threadID;
    const contentBeyondScreen = frameState.contentBeyondScreen;
    const contentVisibleHeight = frameState.contentVisibleHeight;
    const numberUnseenCommentsAtEnd = state.numberUnseenCommentsAtEnd;
    const contentLength = frameState.contentLength;
    const replyComment = state.replyComment;

    const loadedNewerMessages = state.loadedNewerMessages;

    return useMemo(
        () => (
            <GoToButtonsMemo
                {...props}
                threadID={threadID}
                contentBeyondScreen={contentBeyondScreen}
                contentVisibleHeight={contentVisibleHeight}
                numberUnseenCommentsAtEnd={numberUnseenCommentsAtEnd}
                contentLength={contentLength}
                loadedNewerMessages={loadedNewerMessages}
                replyComment={replyComment}
            />
        ),
        [
            threadID,
            contentBeyondScreen,
            contentVisibleHeight,
            numberUnseenCommentsAtEnd,
            props,
            contentLength,
            loadedNewerMessages,
            replyComment,
        ],
    );
}

function GoToButtonsMemo({
    personaID,
    threadID,
    renderGoUpArrow,
    parentObjPath,
    animatedOffset,
    onPressGoUpArrow,
    onPressGoDownArrow,
    invertedFlatlist,
    contentBeyondScreen,
    contentVisibleHeight,
    numberUnseenCommentsAtEnd,
    contentLength,
    isDM,
    scrollToMessageID,
    loadedNewerMessages, // boolean. should have better names
    loadNewerMessages, // function
    replyComment,
}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const animatedContentVisible = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (contentBeyondScreen) {
            Animated.timing(animatedContentVisible, {
                toValue: 0.7,
                duration: 350,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(animatedContentVisible, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }).start();
        }
    }, [contentBeyondScreen, invertedFlatlist]);

    const {
        current: {csetState},
    } = React.useContext(ProfileModalStateRefContext);

    React.useEffect(() => {
        csetState({
            invertedFlatlist: invertedFlatlist,
            onPressGoUpArrow: onPressGoUpArrow,
            onPressGoDownArrow: onPressGoDownArrow,
        });
    }, [csetState, invertedFlatlist, onPressGoUpArrow, onPressGoDownArrow]);

    const shouldLoadNewMessages = scrollToMessageID && !loadedNewerMessages;

    const pressDown = () => {
        if (shouldLoadNewMessages) {
            loadNewerMessages();
        }
        onPressGoDownArrow();
    };

    const upArrowOpacity = invertedFlatlist
        ? animatedContentVisible
        : animatedOffset?.interpolate({
              inputRange: [0, 250],
              outputRange: [0, 0.7],
              extrapolate: 'clamp',
          });

    const downbtnOpacityLowerBound =
        contentLength - 200 > 100 ? contentLength - 200 : 100;
    const downbtnOpacityUpperBound = contentLength > 200 ? contentLength : 200;

    let downArrowOpacity = shouldLoadNewMessages
        ? 1
        : invertedFlatlist
        ? animatedOffset?.interpolate({
              inputRange: [650, 700],
              outputRange: [0, 1],
              extrapolate: 'clamp',
          })
        : animatedOffset?.interpolate({
              inputRange: [
                  0,
                  100,
                  downbtnOpacityLowerBound,
                  downbtnOpacityUpperBound,
              ],
              outputRange: [0, 1, 1, 0],
              extrapolate: 'clamp',
          });

    const viewpostsOpacity = Animated.add(
        Animated.divide(downArrowOpacity, 4),
        upArrowOpacity,
    );
    let navigation = useNavigation();

    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const isAuthor = personaMap[personaID]?.authors?.includes(
        auth().currentUser.uid,
    );
    let viewPostConditional = false; /*Boolean(
        parentObjPath.includes('communities') || parentObjPath.includes('all'),
    );*/

    let canChat =
        personaID && personaMap && personaMap[personaID]
            ? personaMap[personaID].publicCanAudioChat
            : true;
    let canTextChat =
        personaID && personaMap && personaMap[personaID]
            ? personaMap[personaID].publicCanChat
            : true;

    let threadIDShift = threadID ? 40 : 0;
    let postShift = viewPostConditional ? 0 : -35;
    let chatShift = !canChat && canTextChat ? 45 : 40;
    let isDMShift = isDM ? 45 : 0;

    let replyCommentShift = replyComment ? 54 : 0;

    let topOffset = shouldLoadNewMessages ? 196 : 160;
    let top =
        contentVisibleHeight -
        topOffset -
        threadIDShift -
        postShift +
        chatShift -
        isDMShift -
        replyCommentShift;

    return (
        <>
            <Animated.View
                style={{
                    ...Styles.overlayButton,
                    top,
                    opacity: downArrowOpacity,
                }}>
                <TouchableOpacity
                    hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
                    onPress={pressDown}>
                    {false && numberUnseenCommentsAtEnd > 0 && (
                        <View style={Styles.overlayButtonNumber}>
                            <Text
                                style={{
                                    ...baseText,
                                    color: 'white',
                                    fontSize: 11,
                                }}>
                                {numberUnseenCommentsAtEnd}
                            </Text>
                        </View>
                    )}
                    <Feather
                        name="arrow-down"
                        size={23}
                        color={'#eee'}
                        style={{
                            paddingLeft: 0,
                            paddingTop: 3.7,
                            alignSelf: 'center',
                        }}
                    />

                    {shouldLoadNewMessages && (
                        <View style={{...Styles.loadNewerMessagesBtn}}>
                            <Text style={{color: 'white'}}>
                                Load Newer Messages...
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {viewPostConditional && (
                <Animated.View
                    style={{
                        marginLeft: 0,
                        ...Styles.overlayButton,
                        position: 'absolute',
                        width: null,
                        height: null,
                        backgroundColor: null,
                        top:
                            contentVisibleHeight -
                            175 -
                            threadIDShift +
                            chatShift,
                        borderColor: 'blue',
                        left:
                            Dimensions.get('window').width -
                            151 -
                            (!isAuthor ? -43 : 0),
                        borderWidth: 0,
                        opacity: viewpostsOpacity,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                    }}>
                    <ViewPostsButton small={false} navigation={navigation} />

                    <View
                        style={{
                            marginStart: 5,
                            borderColor: colors.green,
                            borderWidth: 0,
                        }}>
                        {isAuthor && (
                            <AddPostButton size={30} background={true} />
                        )}
                    </View>
                </Animated.View>
            )}
            {renderGoUpArrow && (
                <Animated.View
                    style={{
                        ...Styles.overlayButton,
                        top: 155,
                        opacity: upArrowOpacity,
                    }}>
                    <TouchableOpacity
                        style={{}}
                        hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
                        onPress={onPressGoUpArrow}>
                        <Feather
                            name="arrow-up"
                            size={23}
                            color={'black'}
                            style={{paddingLeft: 4.7, paddingTop: 3.5}}
                        />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </>
    );
}

const Styles = StyleSheet.create({
    overlayButtonNumber: {
        position: 'absolute',
        backgroundColor: colors.textFaded2,
        width: 17,
        height: 17,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        left: -5,
        top: -5,
    },
    overlayBar: {
        opacity: 0.7,
        position: 'absolute',
        backgroundColor: 'white',
        width: Dimensions.get('window').width,
        height: 32,
        zIndex: 9900,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    overlayButton: {
        opacity: 0.7,
        position: 'absolute',
        // bottom: 40,
        backgroundColor: colors.myTextMessages,
        width: 32,
        height: 32,
        // left: '46%',
        zIndex: 99,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.43,
        shadowRadius: 2.62,
        elevation: 4,
        alignSelf: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    loadNewerMessagesBtn: {
        opacity: 0.7,
        alignSelf: 'center',
        backgroundColor: colors.myTextMessages,
        width: 188,
        padding: 7,
        paddingLeft: 15,
        height: 32,
        zIndex: 99,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.43,
        shadowRadius: 2.62,
        elevation: 4,
        top: 10,
    },
});
