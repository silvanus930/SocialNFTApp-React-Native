import React, {useMemo} from 'react';
import {
    Platform,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Clipboard,
    View,
    Text,
    Alert,
} from 'react-native';
import {RemixRenderStateRefContext} from 'state/RemixRenderStateRef';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import {BlurView} from '@react-native-community/blur';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import colors from 'resources/colors';
import {timestampToDateString} from 'utils/helpers';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineFrameStateContext,
    DiscussionEngineStateContext,
} from './DiscussionEngineContext';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Feather';
import isEqual from 'lodash.isequal';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CommunityStateContext} from 'state/CommunityState';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(DiscussionEditCommentMenu, propsAreEqual);

function DiscussionEditCommentMenu(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );

    const {commentListRef} = props;
    const showEditMenuKey = state.showEditMenuKey;
    // const frame = frameState?.listFrames?.[showEditMenuKey];
    // const frame = commentListRef?.current?.commentIndexMap?.[showEditMenuKey];
    const commentsMap = state.commentsMap;
    const invertedFlatlist = state.invertedFlatlist;
    const contentVisibleHeight = frameState.contentVisibleHeight;
    const threadID = state.threadID;
    const commentsSelected = state.commentsSelected;
    const openThreadIDs = state.openThreadIDs;

    return useMemo(
        () => (
            <>
                {showEditMenuKey && (
                    <DiscussionEditCommentMenuMemo
                        {...props}
                        showEditMenuKey={showEditMenuKey}
                        invertedFlatlist={invertedFlatlist}
                        contentVisibleHeight={contentVisibleHeight}
                        commentsMap={commentsMap}
                        threadID={threadID}
                        commentsSelected={commentsSelected}
                        openThreadIDs={openThreadIDs}
                        commentListRef={commentListRef}
                    />
                )}
            </>
        ),
        [
            props,
            showEditMenuKey,
            invertedFlatlist,
            contentVisibleHeight,
            commentsMap,
            threadID,
            commentsSelected,
            openThreadIDs,
            commentListRef,
        ],
    );
}

const MODERATING_USERS = {
    will: '94hKmQP9DEhZICfZEebFq5rl8VZ2',
    willdev: 'zGYZvbB1HxcZH5rb6C4fymRc0yp2',
    raeez: 'PHobeplJLROyFlWhXPINseFVkK32',
    kafischer: '3Ednpc8IKwgweGdoyhY8M8WeOJj2',
};

function DiscussionEditCommentMenuMemo({
    invertedFlatlist,
    contentVisibleHeight,
    commentsMap,
    threadID,
    commentsSelected,
    getFirebaseCommentsCollection,
    getFirebaseCommentsLiveCache,
    // animatedOffset,
    // headerType,
    personaID,
    postID,
    openThreadIDs,
    commentListRef,
    viewAllEmojis,
}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const myUserID = auth().currentUser.uid;
    const {
        current: {userMap, personaList, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const communityContext = React.useContext(CommunityStateContext);
    const myPersonaIDs = useMemo(
        () => personaList.map(p => p?.pid),
        [personaList],
    );
    const amAuthor = personaMap[personaID]?.authors?.includes(myUserID);

    const renderEditsMenu = () => {
        const selectedComments = Object.entries(commentsSelected)
            .filter(([key, show]) => show)
            .map(([key, show]) => key);
        const cantSelectYet = selectedComments.some(
            commentID => !commentsMap?.hasOwnProperty(commentID),
        );

        if (cantSelectYet) {
            return null;
        }
        const selectedCommentsAreMyOwn = !selectedComments.some(commentID => {
            const selectedComment = commentsMap[commentID];
            const commentIdentityID = selectedComment?.anonymous
                ? selectedComment?.identityID
                : selectedComment.userID;
            return !myPersonaIDs.concat(myUserID).includes(commentIdentityID);
        });
        const onlyOneCommentSelected = selectedComments.length === 1;

        const firstSelectedComment = {
            ...commentsMap[selectedComments[0]],
            id: selectedComments[0],
        };

        const onPressThread = () => {
            dispatch({
                type: 'setReplyUserName',
                payload: userMap[firstSelectedComment.userID]?.userName,
            });
            dispatch({type: 'setThreadID', payload: firstSelectedComment.id});
            dispatch({type: 'clearSelectedComments'});
            dispatch({type: 'clearShowEditMenu'});
        };

        const onPressQuote = () => {
            dispatch({
                type: 'setReplyComment',
                payload: firstSelectedComment,
            });
            dispatch({type: 'clearSelectedComments'});
            dispatch({type: 'clearShowEditMenu'});
            dispatch({type: 'toggleKeyboard'});
        };

        const onPressCopy = () => {
            if (onlyOneCommentSelected) {
                Clipboard.setString(firstSelectedComment.text);
            } else {
                const text = selectedComments.map(key => {
                    const newComment = commentsMap[key];
                    const userName = userMap[newComment.userID]?.userName;
                    const time = newComment.timestamp?.seconds
                        ? timestampToDateString(newComment.timestamp.seconds)
                        : '';
                    return `[${time}] ${userName} - ${newComment.text}`;
                });
                Clipboard.setString(text.join('\n'));
            }
            dispatch({type: 'clearSelectedComments'});
            dispatch({type: 'clearShowEditMenu'});
        };

        const remixRenderStateRefContext = React.useContext(
            RemixRenderStateRefContext,
        );

        const onPressReport = async () => {
            const reportsRef = firestore().collection('reports');

            // eslint-disable-next-line no-alert
            Alert.alert('Report message', 'Are you sure?', [
                {text: 'no', onPress: null, style: 'cancel'},
                {
                    text: 'yes',
                    onPress: () => {
                        reportsRef
                            .add({
                                userID: auth().currentUser.uid,
                                timestamp: firestore.Timestamp.now(),
                                title: 'Message Report',
                                comment: firstSelectedComment,
                            })
                            .then(() => {
                                // eslint-disable-next-line no-alert
                                Alert.alert(
                                    "Successfully reported! We'll follow up with you by contacting you directl!",
                                );
                            });
                    },
                },
            ]);

            dispatch({type: 'clearSelectedComments'});
            dispatch({type: 'clearShowEditMenu'});
        };

        const onPressRemix = async () => {
            // TODO implement comment remix
            console.log(']]]]]]]]]', commentsSelected);

            const selectedCommentsText = Object.entries(commentsSelected)
                .filter(([key, show]) => show)
                .map(([key, show]) => commentsMap[key].text + '\n');
            console.log('onPressRemix:', ''.concat(selectedCommentsText));
            console.log('onPressRemix:', personaID, postID);

            let post;
            if (personaID !== SYSTEM_DM_PERSONA_ID) {
                const postRef = await firestore()
                    .collection('personas')
                    .doc(personaID)
                    .collection('posts')
                    .doc(postID)
                    .get();
                post = postRef.data();
            } else {
                post = {text: '', title: 'DM', name: 'DM'};
            }

            console.log('remixPostButton: setting post', post);
            remixRenderStateRefContext.current.csetState({
                showToggle: true,
                personaID: personaID,
                post: {
                    ...post,
                    text: selectedCommentsText + '\n\n' + post.text,
                },
                persona: personaMap[personaID],
                postID: postID,
            });

            dispatch({type: 'clearSelectedComments'});
            dispatch({type: 'clearShowEditMenu'});
            dispatch({type: 'toggleKeyboard'});
        };

        const onPressEdit = () => {
            dispatch({
                type: 'setEditComment',
                payload: firstSelectedComment,
            });
            if (firstSelectedComment?.replyComment) {
                dispatch({
                    type: 'setReplyComment',
                    payload: firstSelectedComment.replyComment,
                });
            }
            dispatch({type: 'clearSelectedComments'});
            dispatch({type: 'clearShowEditMenu'});
            dispatch({type: 'toggleKeyboard'});
        };

        const onPressDelete = () => {
            // for each comment, both delete and decrement cached counts depending on
            // whether the comment is in the main thread or a side thread
            const newDeleted = Object.fromEntries(
                selectedComments.map(key => [key, true]),
            );
            dispatch({type: 'addCommentsDeleted', payload: newDeleted});
            selectedComments.forEach(key => {
                const batch = firestore().batch();
                let collection = getFirebaseCommentsCollection();
                if (commentsMap[key]?.isThread) {
                    batch.set(
                        collection.doc(commentsMap[key].threadID),
                        {numThreadComments: firestore.FieldValue.increment(-1)},
                        {merge: true},
                    );
                    collection = collection
                        .doc(commentsMap[key].threadID)
                        .collection('threads');
                }
                batch.set(
                    collection.parent.collection('live').doc('discussion'),
                    {
                        numCommentsAndThreads:
                            firestore.FieldValue.increment(-1),
                    },
                    {merge: true},
                );
                const currentCommunity = communityContext?.currentCommunity;
                batch.set(
                    firestore()
                        .collection('communities')
                        .doc(currentCommunity)
                        .collection('live')
                        .doc('activity'),
                    {
                        chats: {
                            [collection.path]: {
                                messageCount:
                                    firestore.FieldValue.increment(-1),
                            },
                        },
                    },
                    {merge: true},
                );
                const commentsDocRef = collection.doc(key);
                const keepThreadAfterDelete =
                    commentsMap[key]?.latestThreadComment !== undefined;
                batch.set(
                    commentsDocRef,
                    {
                        deleted: !keepThreadAfterDelete,
                        showCommentDeleted: keepThreadAfterDelete,
                        deletedAt: firestore.Timestamp.now(),
                    },
                    {merge: true},
                );
                batch.commit();

                const selectedComment = commentsMap[key];
                let liveRef = getFirebaseCommentsLiveCache();
                let docRef = getFirebaseCommentsCollection();
                if (!selectedComment?.isThread) {
                    docRef
                        .doc(key)
                        .get()
                        .then(doc => {
                            if (doc.exists) {
                                // store it to live cache
                                liveRef.doc(doc.id).set(
                                    {
                                        ...doc.data(),
                                        deleted: !keepThreadAfterDelete,
                                        showCommentDeleted:
                                            keepThreadAfterDelete,
                                        deletedAt: firestore.Timestamp.now(),
                                        lastUpdatedAtTimestamp:
                                            firestore.Timestamp.now(),
                                    },
                                    {merge: true},
                                );
                            }
                        })
                        .catch(error => {
                            //handle error updating and getting doc
                        });
                    dispatch({type: 'triggerUpdateList'});
                }
            });
            dispatch({type: 'clearSelectedComments'});
            dispatch({type: 'clearShowEditMenu'});
        };

        if (viewAllEmojis) {
            return <></>;
        }

        return (
            <>
                {/* Edit Message */}
                {onlyOneCommentSelected && selectedCommentsAreMyOwn && (
                    <>
                        <TouchableOpacity
                            style={Styles.endorsementBtn}
                            // blurType={
                            //     Platform.OS === 'android' ? 'dark' : 'extraDark'
                            // }
                            // blurAmount={2}
                            // reducedTransparencyFallbackColor="black"
                            onPress={onPressEdit}>
                            <View
                                style={{
                                    marginLeft: 2,
                                    // marginTop: -2,
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                }}>
                                <MaterialCommunityIcons
                                    name="pencil"
                                    size={30}
                                    color={colors.navSubProminent}
                                    style={{marginLeft: 2}}
                                />
                                <Text
                                    style={{
                                        ...Styles.menuText,
                                    }}>
                                    Edit Message
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <View style={Styles.lineBreak} />
                    </>
                )}
                {/* Reply aka Quote Message */}
                {onlyOneCommentSelected && (
                    <>
                        <TouchableOpacity
                            style={Styles.endorsementBtn}
                            // blurType={
                            //     Platform.OS === 'android' ? 'dark' : 'extraDark'
                            // }
                            // blurAmount={2}
                            // reducedTransparencyFallbackColor="black"
                            onPress={onPressQuote}>
                            <View
                                style={{
                                    marginLeft: 2,
                                    // marginTop: -2,
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                }}>
                                <MaterialCommunityIcons
                                    name="reply"
                                    size={34}
                                    color={colors.navSubProminent}
                                    style={{marginLeft: 2}}
                                />
                                <Text
                                    style={{
                                        ...Styles.menuText,
                                        marginLeft: 20,
                                    }}>
                                    Reply Message
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <View style={Styles.lineBreak} />
                    </>
                )}
                {/* Copy Message */}
                <>
                    <TouchableOpacity
                        onPress={onPressCopy}
                        style={Styles.endorsementBtn}
                        // blurType={Platform.OS === 'android' ? 'dark' : 'extraDark'}
                        // blurAmount={2}
                        // reducedTransparencyFallbackColor="black"
                    >
                        <View
                            style={{
                                marginLeft: 2,
                                // marginTop: -2,
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                            }}>
                            <MaterialCommunityIcons
                                name="content-copy"
                                size={30}
                                color={colors.navSubProminent}
                                style={{marginLeft: 2}}
                            />
                            <Text
                                style={{
                                    ...Styles.menuText,
                                }}>
                                Copy Message
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <View style={Styles.lineBreak} />
                </>

                {/* Copy Link To Message */}
                {/* todo implement this */}

                {/* Start Thread / threaded message */}
                {onlyOneCommentSelected && !firstSelectedComment.isThread && (
                    <>
                        <TouchableOpacity
                            style={Styles.endorsementBtn}
                            // blurType={
                            //     Platform.OS === 'android' ? 'dark' : 'extraDark'
                            // }
                            // blurAmount={2}
                            // reducedTransparencyFallbackColor="black"
                            onPress={onPressThread}>
                            <View
                                style={{
                                    marginLeft: 2,
                                    // marginTop: -2,
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                }}>
                                <MaterialCommunityIcons
                                    name="forum"
                                    size={30}
                                    color={colors.navSubProminent}
                                    style={{marginLeft: 2}}
                                />
                                <Text
                                    style={{
                                        ...Styles.menuText,
                                    }}>
                                    Start thread
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <View style={Styles.lineBreak} />
                    </>
                )}

                {/* Share Message */}
                {/* todo implement this */}

                {/* Report */}
                {onlyOneCommentSelected && (
                    <>
                        <TouchableOpacity
                            style={Styles.endorsementBtn}
                            // blurType={
                            //     Platform.OS === 'android' ? 'dark' : 'extraDark'
                            // }
                            // blurAmount={2}
                            // reducedTransparencyFallbackColor="black"
                            onPress={onPressReport}>
                            <View
                                style={{
                                    marginLeft: 2,
                                    // marginTop: -2,
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                }}>
                                <MaterialCommunityIcons
                                    name="flag"
                                    size={30}
                                    color={colors.navSubProminent}
                                    style={{marginLeft: 2}}
                                />
                                <Text
                                    style={{
                                        ...Styles.menuText,
                                    }}>
                                    Report Message
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <View style={Styles.lineBreak} />
                    </>
                )}

                {/* Remix */}
                {/* todo make this work */}

                {/* <TouchableOpacity */}
                {/*     style={Styles.endorsementBtn} */}
                {/*     blurType={Platform.OS === 'android' ? 'dark' : 'extraDark'} */}
                {/*     blurAmount={2} */}
                {/*     reducedTransparencyFallbackColor="black" */}
                {/*     onPress={onPressRemix}> */}
                {/*     <Icon */}
                {/*         name="refresh-ccw" */}
                {/*         size={17} */}
                {/*         color={colors.actionText} */}
                {/*         style={{marginLeft: 2, marginTop: -2}} */}
                {/*     /> */}
                {/* </TouchableOpacity> */}

                {/* Delete Message */}
                {(selectedCommentsAreMyOwn ||
                    amAuthor ||
                    Object.values(MODERATING_USERS).includes(myUserID)) && (
                    <TouchableOpacity
                        style={Styles.endorsementBtn}
                        // blurType={
                        //     Platform.OS === 'android' ? 'dark' : 'extraDark'
                        // }
                        // blurAmount={2}
                        // reducedTransparencyFallbackColor="black"
                        onPress={onPressDelete}>
                        <View
                            style={{
                                marginLeft: 2,
                                // marginTop: -2,
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                            }}>
                            <MaterialCommunityIcons
                                name="trash-can-outline"
                                size={30}
                                color={colors.fadedRed}
                                style={{marginLeft: 2}}
                            />
                            <Text
                                style={{
                                    ...Styles.menuText,
                                    color: colors.fadedRed,
                                }}>
                                Delete message
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </>
        );
    };

    return (
        <>
            {Platform.OS === 'ios' ? (
                <View
                    style={{
                        // ...animatedStyle,
                        // position: 'absolute',
                        width: '100%',
                        // borderWidth: 1,
                        // borderColor: 'orange',
                        ...Styles.endorsementsMenuIos,
                    }}>
                    {renderEditsMenu()}
                </View>
            ) : (
                <View
                    style={{
                        ...Styles.endorsementsMenuAndroid,
                        // ...animatedStyle,
                    }}>
                    {renderEditsMenu()}
                </View>
            )}
        </>
    );
}

export const Styles = StyleSheet.create({
    endorsementsContainer: {
        flexDirection: 'column',
        marginLeft: 10,
    },
    endorsementBtn: {
        marginLeft: 7,
        marginRight: 7,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',

        opacity: 1,

        height: 50,
        marginTop: 10,
        // width: 42,
        // borderRadius: 40,
    },
    endorsementsMenuIos: {
        alignSelf: 'flex-start',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        // position: 'absolute',
        // height: 60,
        padding: 10,
        marginLeft: 10,
        marginTop: 0,
        borderRadius: 0,
    },
    endorsementsMenuAndroid: {
        alignSelf: 'flex-start',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        // position: 'absolute',
        // height: 60,
        padding: 10,
        marginLeft: 10,
        marginTop: 0,
        borderRadius: 0,

        // elevation: 6,
        opacity: 1,
    },
    lineBreak: {
        marginLeft: 10,
        borderBottomWidth: 0.5,
        width: '90%',
        borderBottomColor: colors.navSubProminent,
        marginBottom: 6,
        opacity: 0.2,
    },
    menuText: {
        fontSize: 18,
        color: colors.navSubProminent,
        marginTop: 6,
        marginLeft: 22,
    },
});
