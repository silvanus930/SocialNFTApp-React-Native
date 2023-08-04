import React, {useCallback, useContext} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/core';
import ParsedText from 'react-native-parsed-text';

import {images} from 'resources';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import {useNavToDMChat} from 'hooks/navigationHooks';

import {InviteStateContext} from 'state/InviteState';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

import styles from './styles';

const PeopleItem = ({data, regexPattern}) => {
    const navigation = useNavigation();
    const {
        current: {user: currentUser},
    } = useContext(GlobalStateRefContext);
    const inviteContext = useContext(InviteStateContext);
    const navToDMChat = useNavToDMChat(navigation);
    const profileModalContextRef = useContext(ProfileModalStateRefContext);

    const handleViewProfile = useCallback(
        item => {
            profileModalContextRef.current.csetState({
                userID: item.id,
                showToggle: true,
            });
        },
        [profileModalContextRef],
    );

    const handleMessageUser = useCallback(
        async item => {
            const {id} = item;
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
            navToDMChat(chatContext.chatID, item);
        },
        [navToDMChat, inviteContext, currentUser],
    );

    const renderPeopleItem = useCallback(
        ({item, index}) => {
            const {profileImgUrl, fullName} = item;

            return (
                <TouchableOpacity
                    style={styles.container}
                    onLongPress={() => handleViewProfile(item)}>
                    <FastImage
                        source={{
                            uri: profileImgUrl || images.userDefaultProfileUrl,
                        }}
                        style={styles.userIcon}
                    />
                    <View style={styles.contentContainer}>
                        <ParsedText
                            numberOfLines={1}
                            style={styles.userName}
                            parse={[
                                {
                                    pattern: regexPattern,
                                    style: styles.highlightedText,
                                },
                            ]}
                            childrenProps={{allowFontScaling: false}}>
                            {fullName}
                        </ParsedText>
                        <Text numberOfLines={1} style={styles.userDetail}>
                            380 followers{' '}
                        </Text>
                    </View>
                    {index !== 1 ? (
                        <TouchableOpacity
                            style={[
                                styles.actionContainer,
                                styles.actionPrimary,
                            ]}
                            onPress={() => handleMessageUser(item)}>
                            <Text style={styles.actionText}>Follow</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.actionContainer,
                                styles.actionSecondary,
                            ]}
                            onPress={() => handleMessageUser(item)}>
                            <Text style={styles.actionText}>Message</Text>
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            );
        },
        [handleMessageUser, regexPattern, handleViewProfile],
    );

    return renderPeopleItem({item: data});
};

export default React.memo(PeopleItem);
