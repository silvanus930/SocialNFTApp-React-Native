import React, {useRef, useState} from 'react';
import {
    Platform,
    FlatList,
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import colors from 'resources/colors';

import _ from 'lodash';
import {
    FeedMenuDispatchContext,
    FeedMenuStateContext,
} from 'state/FeedStateContext';
import auth from '@react-native-firebase/auth';
import {PresenceStateRefContext} from 'state/PresenceStateRef';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EmojiSelector from 'react-native-emoji-selector';
import BottomSheet from './BottomSheet';

export default function FeedEndorsementsMenu() {
    const myUserID = auth().currentUser?.uid;
    const {state} = React.useContext(FeedMenuStateContext);

    const presenceContextRef = React.useContext(PresenceStateRefContext);
    const identityID =
        presenceContextRef.current.identityID &&
        presenceContextRef.current.identityID.startsWith('PERSONA')
            ? presenceContextRef.current.identityID.split('::')[1]
            : myUserID;
    return (
        <>
            <EndorsementMenuMemo identityID={identityID} />
        </>
    );
}

function EndorsementMenuMemo({identityID}) {
    const {dispatch} = React.useContext(FeedMenuDispatchContext);
    const {state} = React.useContext(FeedMenuStateContext);
    const [viewAllEmojis, setViewAllEmojis] = useState(false);

    function toggleEndorsement(emoji, userMarked) {
        dispatch({type: 'closeEndorsementsMenu'});
        const docRef = firestore()
            .collection('personas')
            .doc(state.endorsementsMenu.personaKey)
            .collection('posts')
            .doc(state.endorsementsMenu.postKey)
            .collection('live')
            .doc('endorsements');
        const fieldValue = firestore.FieldValue;
        const fieldUpdate = userMarked
            ? fieldValue.arrayRemove(identityID)
            : fieldValue.arrayUnion(identityID);
        docRef.set(
            {
                endorsements: {[`${emoji}`]: fieldUpdate},
            },
            {merge: true},
        );
    }

    const emojiData = ['❤️', '👍', '🔥', '💯', '🤣', 'plus'];
    const [endorsements, setEndorsements] = React.useState([]);

    React.useEffect(() => {
        return firestore()
            .collection('personas')
            .doc(state.endorsementsMenu.personaKey)
            .collection('posts')
            .doc(state.endorsementsMenu.postKey)
            .collection('live')
            .doc('endorsements')
            .onSnapshot(snap => {
                setEndorsements(snap.data()?.endorsements || {});
            });
    }, [state.endorsementsMenu.personaKey, state.endorsementsMenu.postKey]);

    const renderAllEmojis = emoji => {
        toggleEndorsement(
            emoji,
            (endorsements[emoji] || []).includes(identityID),
        );
    };

    const renderEmojiFlatList = () => {
        const renderItem = ({item: emoji}) => {
            const onPress = () => {
                if (emoji === 'plus') {
                    setViewAllEmojis(true);
                } else {
                    toggleEndorsement(
                        emoji,
                        (endorsements[emoji] || []).includes(identityID),
                    );
                }
            };
            return (
                <TouchableOpacity onPress={onPress}>
                    <View
                        style={{
                            ...Styles.endorsementBtn,
                        }}>
                        <Text style={{fontSize: 24}}>
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
            <>
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
            </>
        );
    };

    return (
        <BottomSheet
            snapPoints={['50%']}
            toggleModalVisibility={() => {
                dispatch({type: 'closeEndorsementsMenu'});
            }}
            // TODO: Fix
            style={{
                height: '50%',
            }}
            showToggle={state.endorsementsMenu.open}>
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
                                onEmojiSelected={emoji =>
                                    renderAllEmojis(emoji)
                                }
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
                                onEmojiSelected={emoji =>
                                    renderAllEmojis(emoji)
                                }
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
        </BottomSheet>
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
