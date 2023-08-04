import React, {useMemo, useRef, useState} from 'react';
import {
    Platform,
    FlatList,
    StyleSheet,
    Text,
    Animated,
    TouchableOpacity,
    View,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import firestore from '@react-native-firebase/firestore';
import colors from 'resources/colors';
import {
    anySelected,
    DiscussionEngineDispatchContext,
    DiscussionEngineStateContext,
} from './DiscussionEngineContext';

import isEqual from 'lodash.isequal';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EmojiSelector from 'react-native-emoji-selector';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(EndorsementMenu, propsAreEqual);

function EndorsementMenu(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const showMenu = anySelected(state.showCommentEndorsementOptions);
    const selectedKey = Object.entries(state.showCommentEndorsementOptions)
        .filter(([key, show]) => show)
        .map(([key, show]) => key)[0];
    const selectedComment = state.commentsMap[selectedKey];
    const {commentListRef} = props;
    const identityID = state.identityID;
    const threadID = state.threadID;

    return useMemo(
        () => (
            <>
                {showMenu && (
                    <EndorsementMenuMemo
                        {...props}
                        selectedKey={selectedKey}
                        selectedComment={selectedComment}
                        identityID={identityID}
                        threadID={threadID}
                        commentListRef={commentListRef}
                    />
                )}
            </>
        ),
        [
            showMenu,
            props,
            selectedKey,
            selectedComment,
            identityID,
            threadID,
            commentListRef,
        ],
    );
}

function EndorsementMenuMemo({
    getFirebaseCommentsCollection,
    getFirebaseCommentsLiveCache,
    selectedKey,
    selectedComment,
    identityID,
    threadID,
    headerType,
    commentListRef,
    viewAllEmojis,
    setViewAllEmojis,
    toggleModalVisibility,
}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);

    function toggleEndorsement(commentKey, emoji, userMarked) {
        // dispatch({type: 'clearEndorsementMenu'});
        const fieldValue = firestore.FieldValue;
        const fieldUpdate = userMarked
            ? fieldValue.arrayRemove(identityID)
            : fieldValue.arrayUnion(identityID);
        let docRef = getFirebaseCommentsCollection();
        let liveRef = getFirebaseCommentsLiveCache();
        if (selectedComment?.isThread) {
            docRef = docRef.doc(selectedComment.threadID).collection('threads');
            liveRef = liveRef.doc(selectedComment.threadID).collection('threads');
            docRef
                .doc(commentKey)
                .set(
                    {
                        endorsements: {[`${emoji}`]: fieldUpdate},
                    },
                    {merge: true},
                )
                .catch(error => {
                    //handle error updating and getting doc
                });
        } else {
            docRef
                .doc(commentKey)
                .set(
                    {
                        endorsements: {[`${emoji}`]: fieldUpdate},
                    },
                    {merge: true},
                )
                .then(() => {
                    return docRef.doc(commentKey).get();
                })
                .then(doc => {
                    if (doc.exists) {
                        // store it to live cache
                        liveRef
                            .doc(doc.id)
                            .set(
                                {
                                    ...doc.data(),
                                    lastUpdatedAtTimestamp: firestore.Timestamp.now(),
                                },
                                {merge: true},
                            );
                    }
                })
                .catch(error => {
                    //handle error updating and getting doc
                });
        }
    }

    const emojiData = ['❤️', '👍', '🔥', '💯', '🤣', 'plus'];

    const renderAllEmojis = (emoji) => {
        const endorsements = selectedComment?.endorsements || {};
        toggleEndorsement(
            selectedKey,
            emoji,
            (endorsements[emoji] || []).includes(identityID),
        );
        toggleModalVisibility();
    }

    const renderEmojiFlatList = () => {
        const endorsements = selectedComment?.endorsements || {};
        const renderItem = ({item: emoji}) => {
            const onPress = () => {
                if(emoji === 'plus') {
                    setViewAllEmojis(true);
                } else {
                    toggleEndorsement(
                        selectedKey,
                        emoji,
                        (endorsements[emoji] || []).includes(identityID),
                    );
                    toggleModalVisibility();
                }
            }
            return (
                <TouchableOpacity onPress={onPress}>
                    <View
                        style={{
                            ...Styles.endorsementBtn,
                        }}
                        >
                        <Text
                            style={{fontSize: 24}}
                        >
                            {emoji === 'plus' ? (
                                <MaterialCommunityIcons
                                    name="plus"
                                    size={34}
                                    color={colors.generalIcon}
                                    style={{marginLeft: 1, marginTop: 2}}
                                />
                            ) : (
                                emoji
                            )}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        };

        return (
            <View>
                <FlatList
                    keyboardShouldPersistTaps="always"
                    bounces={false}
                    horizontal
                    data={emojiData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                />
            </View>
        );
    };

    return (
        <>
            {Platform.OS === 'ios' ? (
                <>
                    {viewAllEmojis ? (
                        <View
                            style={{
                                // ...animatedStyle,
                                // position: 'absolute',
                                width: '100%',
                                ...Styles.allEmojiMenu,
                            }}>
                                <EmojiSelector
                                    onEmojiSelected={emoji => renderAllEmojis(emoji)}
                                    showSearchBar={false}
                                    showTabs={true}
                                    theme={colors.darkBtnBackground}
                                />
                            </View>
                    ) : (
                        <View
                            style={{
                                width: '100%',
                                ...Styles.endorsementsMenuIos,
                            }}>
                                {renderEmojiFlatList()}
                        </View>
                    )}
                </>
            ) : (
                <>
                    {viewAllEmojis ? (
                        <View
                            style={{
                                width: '100%',
                                ...Styles.allEmojiMenu,
                            }}>
                                <EmojiSelector
                                    onEmojiSelected={emoji => renderAllEmojis(emoji)}
                                    showSearchBar={false}
                                    showTabs={true}
                                    theme={colors.darkBtnBackground}
                                />
                            </View>
                    ) : (
                        <View
                            style={{
                                ...Styles.endorsementsMenuAndroid,
                            }}>
                            {renderEmojiFlatList()}
                        </View>
                    )}
                </>
            )}
        </>
    );
}

export const Styles = StyleSheet.create({
    endorsementsContainer: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    endorsementBtn: {
        marginLeft: 4,
        marginRight: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.darkBtnBackground,

        opacity: 1,

        height: 50,
        width: 50,
        borderRadius: 40,

    },
    allEmojiMenu: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        height: 450,
        paddingLeft: 5,
        paddingRight: 6,
        borderRadius: 30,
        // marginTop: 5,
    },
    endorsementsMenuIos: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        paddingLeft: 5,
        paddingRight: 6,
        borderRadius: 30,
    },
    endorsementsMenuAndroid: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        height: 60,
        paddingLeft: 5,
        paddingRight: 6,
        borderRadius: 30,
        opacity: 1,
    },
    text: {
        color: colors.text,
        marginLeft: 10,
        marginRight: 10,
        fontSize: 14,
    },
});
