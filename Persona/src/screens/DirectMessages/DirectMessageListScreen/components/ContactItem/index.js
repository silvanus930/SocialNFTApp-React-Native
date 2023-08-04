import React, {useContext, useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';

import {images} from 'resources';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';

import {InviteStateContext} from 'state/InviteState';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

import {useNavToDMChat} from 'hooks/navigationHooks';
import styles, {USER_ICON_SIZE} from './styles';

const ContactItem = ({item, navigation}) => {
    const {
        current: {user: currentUser},
    } = useContext(GlobalStateRefContext);
    const inviteContext = useContext(InviteStateContext);

    const {id, profileImgUrl} = item;

    const navToDMChat = useNavToDMChat(navigation);

    const profileModalContextRef = useContext(ProfileModalStateRefContext);

    const navToProfile = useCallback(() => {
        profileModalContextRef.current.csetState({
            userID: id,
            showToggle: true,
        });
    }, [profileModalContextRef, id]);

    const navToChat = useCallback(async () => {
        const chatContext = Object.assign(
            await inviteContext.pushChatStateToFirebaseAsync(
                [],
                [
                    {...currentUser, uid: currentUser.id},
                    {...item, uid: id},
                ],
                SYSTEM_DM_PERSONA_ID,
                'DM',
            ),
            {title: 'DM (2)', text: 'DM'},
        );
        console.log(
            'navigating to a chatContext for persona',
            SYSTEM_DM_PERSONA_ID,
            'with chat chatContext',
        );
        navToDMChat(chatContext.chatID, item);
    }, [id, navToDMChat, item, inviteContext, currentUser]);

    return (
        <TouchableOpacity
            onPress={navToChat}
            onLongPress={navToProfile}
            style={styles.container}>
            <FastImage
                source={{
                    uri: profileImgUrl || images.userDefaultProfileUrl,
                    width: USER_ICON_SIZE,
                    height: USER_ICON_SIZE,
                }}
                style={styles.userIcon}
            />
            <View
                style={{
                    marginTop: 3,
                }}>
                <Text numberOfLines={1} style={styles.usernameText}>
                    {item.userName}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default ContactItem;
