import React, {useMemo} from 'react';
import {ENDORSEMENT_FONT_SIZE} from 'components/EndorsementsConstants';
import baseText from 'resources/text';
import {FlatList, View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import colors from 'resources/colors';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineStateContext,
} from './DiscussionEngineContext';
import isEqual from 'lodash.isequal';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(DiscussionEmojiList, propsAreEqual);

function DiscussionEmojiList(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const identityID = state.identityID;
    // const threadID = state.threadID;

    return useMemo(
        () => (
            <DiscussionEmojiListMemo
                {...props}
                identityID={identityID}
                // threadID={threadID}
            />
        ),
        [props, identityID],
    );
}

function DiscussionEmojiListMemo({
    commentKey,
    endorsements,
    getFirebaseCommentsCollection,
    getFirebaseCommentsLiveCache,
    endorsementsMap,
    identityID,
    threadID,
}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);

    function toggleEndorsement(key, emoji, userMarked) {
        // dispatch({type: 'clearEndorsementMenu'});
        const fieldValue = firestore.FieldValue;
        const fieldUpdate = userMarked
            ? fieldValue.arrayRemove(identityID)
            : fieldValue.arrayUnion(identityID);
        let docRef = getFirebaseCommentsCollection();
        let liveRef = getFirebaseCommentsLiveCache();
        if (threadID) {
            docRef = docRef.doc(threadID).collection('threads');
            docRef
                .doc(key)
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
                .doc(key)
                .set(
                    {
                        endorsements: {[`${emoji}`]: fieldUpdate},
                    },
                    {merge: true},
                )
                .then(() => {
                    return docRef.doc(key).get();
                })
                .then(doc => {
                    if (doc.exists) {
                        liveRef.doc(doc.id).set(
                            {
                                ...doc.data(),
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
        }
    }

    const keyExtractor = (item, index) => index.toString();

    const renderEmojiList = ({item: endorsement}) => {
        const [emoji, userIDs] = endorsement;
        const isMyEndorsement = userIDs.includes(identityID);

        const onLongPressEndorsement = event => {
            const showEndorsements = {
                key: commentKey,
                endorsers: endorsementsMap,
                emoji,
                pressY: event.nativeEvent.pageY,
            };
            dispatch({
                type: 'toggleShowEndorsementsMenu',
                payload: showEndorsements,
            });
        };

        const onPressEndorsement = () => {
            toggleEndorsement(
                commentKey,
                emoji,
                (endorsementsMap[emoji] || []).includes(identityID),
            );
        };

        const count = userIDs.length;

        const bgcolor = isMyEndorsement ? '#324180' : '#292A40';
        return (
            <TouchableOpacity
                onLongPress={onLongPressEndorsement}
                delayLongPress={200}
                onPress={onPressEndorsement}>
                <View
                    style={{
                        ...Styles.commentEndorsements,
                        backgroundColor: bgcolor,
                    }}>
                    <Text style={Styles.commentEmoji}>{emoji}</Text>
                    <Text style={Styles.commentEmojiCount}>{count}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={Styles.endorsementsContainer}>
            <FlatList
                bounces={false}
                data={endorsements}
                // numColumns={6}
                horizontal
                keyExtractor={keyExtractor}
                renderItem={renderEmojiList}
            />
        </View>
    );
}

const Styles = StyleSheet.create({
    endorsementsContainer: {
        borderColor: 'yellow',
        borderWidth: 0,
        flexDirection: 'row',
        marginTop: 8,
    },
    endorsementBtn: {
        marginLeft: 7,
        marginRight: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.topBackground,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        opacity: 1,
        shadowOpacity: 0.23,
        shadowRadius: 1,
        height: 42,
        width: 42,
        borderRadius: 40,
    },
    endorsementsMenuIos: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        height: 60,
        paddingLeft: 5,
        paddingRight: 6,
        borderRadius: 30,
    },
    endorsementsMenuAndroid: {
        alignSelf: 'center',
        top: 200,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        elevation: 6,
        height: 60,
        paddingLeft: 5,
        paddingRight: 6,
        borderRadius: 30,
        backgroundColor: '#919191',
        opacity: 0.8,
    },
    commentEndorsements: {
        alignItems: 'center',
        flexDirection: 'row',
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255, 0.15)',
        paddingVertical: 4,
        paddingHorizontal: 6,
        marginTop: 4,
        marginBottom: 2,
        marginEnd: 8,
    },
    commentEmoji: {
        fontSize: 13,
        marginRight: 4,
    },
    commentEmojiCount: {
        fontSize: 14,
        color: '#D0D3D6',
    },
});
