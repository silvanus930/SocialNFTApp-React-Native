import React, {useContext, useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import ParsedText from 'react-native-parsed-text';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';

import Timestamp from 'components/Timestamp';

import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {images} from 'resources';
import getResizedImageUrl from 'utils/media/resize';
import {markDraftAsSeen} from 'actions/posts';

import styles, {USER_ICON_SIZE} from './styles';

const ListItem = ({item, searchText, navigation}) => {
    const {involved, latestMessage} = item.data;
    const seen = item?.seen || false;
    const {
        current: {csetState},
    } = useContext(PersonaStateRefContext);
    const globalRefContext = useContext(GlobalStateRefContext);

    const currentUserId = auth().currentUser.uid;

    const otherUsersInvolved = involved.filter(id => id !== currentUserId);
    const userToDMid = otherUsersInvolved[0];
    const userToDM = globalRefContext.current.userMap[userToDMid];

    const navToProfile = useCallback(() => {
        csetState({
            userID: userToDMid,
            showToggle: true,
        });
    }, [userToDMid, csetState]);

    const navToChat = useCallback(() => {
        markDraftAsSeen(item, currentUserId);
        navigation?.navigate('DM_Chat', {
            cachedChat: item,
            chatID: item.id,
            userToDM,
        });
    }, [currentUserId, navigation, item, userToDM]);

    const debugDM = () => {
        console.log('---------------------------------------------------');
        console.log('   My User ID:', currentUserId);
        console.log('  Other Users:', otherUsersInvolved);
        console.log('Other User ID:', userToDMid);
        console.log('  Cached Chat:', item);
        console.log('   Latest Msg:', latestMessage);
        console.log('---------------------------------------------------');
    };

    const renderLatestMessage = useCallback(() => {
        const regexPattern = new RegExp(searchText, 'i');
        let {text, mediaUrl, userID} = latestMessage?.data || {};

        if (text === '' && mediaUrl) {
            return 'Attachment: 1 Image';
        } else if (searchText && text) {
            return (
                <>
                    {userID === currentUserId && 'You: '}
                    <ParsedText
                        style={styles.messageText(seen)}
                        parse={[
                            {
                                pattern: regexPattern,
                                style: {color: '#fff', fontWeight: '500'},
                            },
                        ]}
                        childrenProps={{allowFontScaling: false}}>
                        {text}
                    </ParsedText>
                </>
            );
        } else {
            return (
                <>
                    {userID === currentUserId && 'You: '}
                    {text}
                </>
            );
        }
    }, [latestMessage, seen, currentUserId, searchText]);

    if (otherUsersInvolved.length !== 1) {
        console.log('[DirectMessageListItem] error, chat id:', item.id);

        return (
            <View>
                <Text style={styles.error}>
                    An error occured, please report: {item.id}
                </Text>
            </View>
        );
    } else {
        return (
            <TouchableOpacity
                onPress={navToChat}
                onLongPress={debugDM}
                style={styles.container}>
                <View style={styles.innerContainer}>
                    <TouchableOpacity onPress={navToProfile}>
                        <FastImage
                            source={{
                                uri: !userToDM?.profileImgUrl
                                    ? images.userDefaultProfileUrl
                                    : getResizedImageUrl({
                                          origUrl:
                                              userToDM?.profileImgUrl ||
                                              images.userDefaultProfileUrl,
                                          width: USER_ICON_SIZE,
                                          height: USER_ICON_SIZE,
                                      }),
                            }}
                            style={styles.userIcon}
                        />
                    </TouchableOpacity>
                    <View style={styles.contentContainer}>
                        <View>
                            <View style={styles.contentContainerUsername}>
                                <View style={{flex: 1}}>
                                    <Text style={styles.usernameText}>
                                        {userToDM?.userName || ''}
                                    </Text>
                                </View>
                                <View>
                                    <Timestamp
                                        seconds={
                                            latestMessage.timestamp?.seconds
                                        }
                                        format={'directMessage'}
                                        style={styles.timestamp}
                                    />
                                </View>
                            </View>
                            <View style={styles.contentContainerMessage}>
                                <View
                                    style={styles.contentContainerMessageInner}>
                                    <Text
                                        numberOfLines={1}
                                        style={styles.messageText(seen)}>
                                        {renderLatestMessage()}
                                    </Text>
                                </View>
                                {!seen && (
                                    <View>
                                        <Text style={styles.notSeenIndiciator}>
                                            ●
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
};

export default ListItem;
