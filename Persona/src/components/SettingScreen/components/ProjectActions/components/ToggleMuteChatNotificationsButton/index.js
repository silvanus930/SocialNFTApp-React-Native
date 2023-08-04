import React, {useEffect, useState, useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {colors} from 'resources';
import {CommunityStateContext} from 'state/CommunityState';

import styles from './styles';

function ToggleMuteChatNotificationsButton({persona}) {
    const myUserID = auth().currentUser.uid;

    const communityContext = useContext(CommunityStateContext);
    let communityID = communityContext.currentCommunity;

    let chatDocPath = persona?.pid
        ? `personas/${persona.pid}/chats/all`
        : `communities/${communityID}/chat/all`;

    console.log('RUNDER CommunityProjectNotif  chatDocPath', chatDocPath);
    const [areNotificationsMuted, setAreNotificationsMuted] = useState(null);

    const handleToggleMuteChatNotifications = () => {
        if (areNotificationsMuted) {
            firestore()
                .doc(chatDocPath)
                .set(
                    {
                        notificationsMutedUsers:
                            firestore.FieldValue.arrayRemove(myUserID),
                    },
                    {merge: true},
                );
        } else {
            firestore()
                .doc(chatDocPath)
                .set(
                    {
                        notificationsMutedUsers:
                            firestore.FieldValue.arrayUnion(myUserID),
                    },
                    {merge: true},
                );
        }
    }; //, [chatDocPath, areNotificationsMuted]);

    console.log('RENDER CommunityProjectNotif', chatDocPath);

    useEffect(() => {
        console.log('CommunityProjectNotif running useEffect', chatDocPath);
        if (chatDocPath) {
            return firestore()
                .doc(chatDocPath)
                .onSnapshot(chatDocSnap => {
                    const notificationsMutedUsers = chatDocSnap.get(
                        'notificationsMutedUsers',
                    );
                    const nextAreNotificationsMuted =
                        notificationsMutedUsers?.includes(myUserID) ?? false;
                    if (nextAreNotificationsMuted !== areNotificationsMuted) {
                        setAreNotificationsMuted(nextAreNotificationsMuted);
                    }
                });
        }
    }, [areNotificationsMuted, chatDocPath, myUserID]);

    return (
        <View style={styles.view}>
            <TouchableOpacity
                onPress={handleToggleMuteChatNotifications}
                style={styles.container}>
                <FontAwesome
                    name={areNotificationsMuted ? 'bell-slash' : 'bell'}
                    color={colors.textFaded}
                    size={18}
                />
                <Text style={styles.text}>chat notifications</Text>
                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>
                        {areNotificationsMuted ? 'off' : 'on'}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default ToggleMuteChatNotificationsButton;
