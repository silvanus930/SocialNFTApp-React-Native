import React, {useCallback, useEffect, useState} from 'react';
import {
    Text,
    View,
    StyleSheet,
    TextInput,
    Pressable,
    Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useFocusEffect} from '@react-navigation/native';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import DiscussionEngine from 'components/DiscussionEngine';
import BlurContainer from 'components/BlurContainer';
import BlurHeader from 'components/BlurHeader';
import {GlobalStateContext} from 'state/GlobalState'; //checks native module use from settings
import MyMapView from 'components/MapView'; //the native chat module, currently titled MyMapView
import ChatOptionsModal from './components/ChatOptionsModal';
import {propsAreEqual} from 'utils/propsAreEqual';
import getResizedImageUrl from 'utils/media/resize';
import {images} from 'resources';

import styles, {USER_ICON_SIZE} from './styles';
import sharedStyles from '../styles';

const HEADER_BUTTONS_HIT_SLOP = {bottom: 30, left: 30, right: 30, top: 30};

const DirectMessageChatScreen = ({route, navigation}) => {
    const {
        cachedChat,
        chatContext,
        chatID,
        userToDM,
        setToggleBottom,
        tabNavigation,
        scrollToMessageID,
        openToThreadID,
    } = route.params;
    const myUserID = auth().currentUser.uid;
    const [showModal, setShowModal] = useState(false);
    const [user, setUser] = useState(userToDM);
    const {useNativeModuleChat} = React.useContext(GlobalStateContext);

    const parentObjPath = `personas/${SYSTEM_DM_PERSONA_ID}/chats/${chatID}`;

    useEffect(() => {
        if (cachedChat) {
            fixLastSeenDataInconsistencyIssue({
                cachedChat: cachedChat,
                chatID: chatID,
            });
        }
    }, [chatID]);

    useFocusEffect(
        useCallback(() => {
            setToggleBottom(false, tabNavigation);
        }, [chatID, userToDM, route, navigation]),
    );

    useEffect(() => {
        const lookupUserToDMviaChatRef = async () => {
            if (!userToDM) {
                const chat = await firestore().doc(parentObjPath).get();
                const attendees = chat.data().attendees;
                const otherUser = attendees.find(a => a.id !== myUserID);
                setUser(otherUser);
            }
        };
        lookupUserToDMviaChatRef();
    }, [chatID, userToDM]);

    const goBack = () => {
        navigation?.popToTop();
    };

    //
    // Remove this sometime next week (2/4/2023)
    //
    const fixLastSeenDataInconsistencyIssue = async ({chatID, cachedChat}) => {
        if (cachedChat?.data?.latestMessage?.id === 'LastSeen') {
            try {
                const messageRef = await firestore()
                    .collection('personas')
                    .doc(SYSTEM_DM_PERSONA_ID)
                    .collection('chats')
                    .doc(chatID)
                    .collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                    .get();

                const first = messageRef.docs[0];
                if (first) {
                    const latestMessage = {
                        timestamp: first.data().timestamp,
                        data: first.data(),
                        id: first.id,
                    };
                    cachedChat.ref.update('latestMessage', latestMessage);
                }
            } catch (e) {
                console.log(e);
            }
        }
    };

    const showOptions = async () => {
        console.log('[DirectMessages] Show DM Modal for', userToDM.userName);
        setShowModal(true);
    };

    const discussionProps = {
        header: false,
        hideFirstTimelineSegment: true,
        parentObjPath: {parentObjPath},
        headerProps: {
            personaID: SYSTEM_DM_PERSONA_ID,
            chatID: chatID,
        },
        openToThreadID: {openToThreadID},
        scrollToMessageID: {scrollToMessageID},
        userID: {myUserID},
        startingInDM: true,
    };

    return (
        <>
            <View style={sharedStyles.container}>
                <View style={styles.discussionEngineContainer}>
                    {Platform.OS === 'ios' && useNativeModuleChat ? (
                        <MyMapView
                            style={{flex: 1}}
                            discussionProps={discussionProps}
                        />
                    ) : (
                        <DiscussionEngine
                            parentObjPath={parentObjPath}
                            collectionName="messages"
                            discussionTitle=""
                            header={false}
                            headerProps={{
                                personaID: SYSTEM_DM_PERSONA_ID,
                                chatID: chatID,
                            }}
                            heightScaleFactor={1.0075}
                            personaID={SYSTEM_DM_PERSONA_ID}
                            renderFromTop={false}
                            showSeenIndicators={true}
                            transparentBackground={true}
                            scrollToMessageID={scrollToMessageID}
                            openToThreadID={openToThreadID}
                        />
                    )}
                </View>
                <BlurHeader
                    onPressGoBack={goBack}
                    onPressShowOptions={showOptions}
                    centerContainerStyle={styles.headerCenterStyleContainer}
                    centerComponent={
                        <>
                            <View style={styles.headerUserIconContainer}>
                                <FastImage
                                    source={{
                                        uri: !user?.profileImgUrl
                                            ? images.userDefaultProfileUrl
                                            : getResizedImageUrl({
                                                  origUrl:
                                                      user?.profileImgUrl ||
                                                      images.userDefaultProfileUrl,
                                                  width: USER_ICON_SIZE,
                                                  height: USER_ICON_SIZE,
                                              }),
                                    }}
                                    style={styles.userIcon}
                                />
                            </View>
                            <View>
                                <Text style={styles.headerUsername}>
                                    {user?.userName}
                                </Text>
                            </View>
                        </>
                    }
                />
            </View>

            {userToDM && (
                <ChatOptionsModal
                    cachedChat={cachedChat}
                    userToDM={userToDM}
                    showModal={showModal}
                    setShowModal={setShowModal}
                />
            )}
        </>
    );
};

export default React.memo(DirectMessageChatScreen, propsAreEqual);
