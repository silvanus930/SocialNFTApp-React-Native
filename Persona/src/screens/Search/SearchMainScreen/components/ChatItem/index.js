import React, {useContext, useCallback} from 'react';
import {View, Text, TouchableOpacity, Linking} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import ParsedText from 'react-native-parsed-text';
import {DateTime} from 'luxon';

import {images} from 'resources';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateContext} from 'state/GlobalState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {ProfileModalStateContext} from 'state/ProfileModalState';

import {
    useNavToCommunityChat,
    useNavToPersonaChat,
    useNavToPostDiscussion,
    useNavToCommunityPostDiscussion,
} from 'hooks/navigationHooks';
import {generateCommunityItemData} from 'screens/Search/utils/helpers';

import styles from './styles';

const ChatItem = ({data, regexPattern}) => {
    const {
        current: {
            user: {id: currentUserId},
            getUserFromUserList,
            getUserFromUserName,
        },
    } = useContext(GlobalStateRefContext);
    const navigation = useNavigation();

    const {communityMap} = useContext(CommunityStateContext);
    const {personaMap} = useContext(GlobalStateContext);
    const profileModalContextRef = useContext(ProfileModalStateRefContext);
    const profileModalContext = useContext(ProfileModalStateContext);
    const navToPersonaChat = useNavToPersonaChat(navigation);
    const navToCommunityChat = useNavToCommunityChat(navigation);
    const navToPostDiscussion = useNavToPostDiscussion(navigation);
    const navToCommunityPostDiscussion =
        useNavToCommunityPostDiscussion(navigation);

    const handleViewUserProfile = useCallback(
        ({userID}) => {
            profileModalContextRef.current.csetState({
                userID,
                showToggle: true,
            });
        },
        [profileModalContextRef],
    );

    const handleOpenLink = useCallback(url => {
        Linking.openURL(url).catch(error =>
            console.error('An error occurred', error),
        );
    }, []);

    const handleOpenPhoneNo = useCallback(number => {
        const tel = number.includes('tel:') ? number : `tel:${number}`;
        Linking.openURL(tel).catch(error =>
            console.error('An error occurred', error),
        );
    }, []);

    const handleOpenEmail = useCallback(mail => {
        const email = mail.includes('mailto:') ? mail : `mailto:${mail}`;
        Linking.openURL(email).catch(error =>
            console.error('An error occurred', error),
        );
    }, []);

    const handleMentionClick = useCallback(
        userName => {
            const userProfile = getUserFromUserName(userName.slice(1));
            if (userProfile) {
                handleViewUserProfile({
                    userID: userProfile?.id,
                });
            }
        },
        [getUserFromUserName, handleViewUserProfile],
    );

    const renderParsedText = useCallback(
        ({text, title}) => (
            <ParsedText
                style={[
                    styles.receiverDetailText,
                    title ? styles.receiverDetailTitle : null,
                ]}
                parse={[
                    {
                        type: 'url',
                        style: styles.externalLink,
                        onPress: handleOpenLink,
                    },
                    {
                        type: 'phone',
                        style: styles.externalLink,
                        onPress: handleOpenPhoneNo,
                    },
                    {
                        type: 'email',
                        style: styles.externalLink,
                        onPress: handleOpenEmail,
                    },
                    {
                        pattern: regexPattern,
                        style: styles.highlightedText,
                    },
                    {
                        pattern: /@(\w+)/g,
                        style: styles.mentions,
                        onPress: handleMentionClick,
                    },
                ]}
                childrenProps={{allowFontScaling: false}}>
                {text}
            </ParsedText>
        ),
        [
            regexPattern,
            handleOpenEmail,
            handleMentionClick,
            handleOpenPhoneNo,
            handleOpenLink,
        ],
    );

    const handleNav = useCallback(
        item => {
            const {
                isCommunityPost,
                isCommunityAllChat,
                isProjectAllChat,
                messageType,
                isProjectPost,
                event_type,
                navData,
            } = item;

            profileModalContext?.closeLeftDrawer &&
                profileModalContext?.closeLeftDrawer();
            if (event_type === 'chat_message') {
                if (isCommunityAllChat) {
                    navToCommunityChat(navData);
                } else if (isProjectAllChat) {
                    navToPersonaChat(navData);
                }
            } else if (messageType === 'post') {
                if (isProjectPost) {
                    navToPostDiscussion(navData);
                } else if (isCommunityPost) {
                    navToCommunityPostDiscussion(navData);
                }
            }
        },
        [
            navToCommunityChat,
            navToPostDiscussion,
            navToCommunityPostDiscussion,
            navToPersonaChat,
            profileModalContext,
        ],
    );

    const renderCommunityItem = useCallback(
        ({item}) => {
            const {created_at, message, messageType, post} = item;

            const {navData, channelData, isMember, createdBy} =
                generateCommunityItemData({
                    item,
                    communityMap,
                    getUserFromUserList,
                    personaMap,
                    currentUserId,
                });

            if (!isMember) {
                return null;
            } else {
                return (
                    <TouchableOpacity
                        style={styles.container}
                        onPress={() =>
                            handleNav({
                                ...item,
                                navData,
                            })
                        }>
                        <View style={styles.topContainer}>
                            <FastImage
                                source={{
                                    uri:
                                        channelData?.profileImgUrl ||
                                        images?.userDefaultProfileUrl,
                                }}
                                style={styles.userIcon}
                            />
                            <View style={styles.channelContainer}>
                                <Text
                                    numberOfLines={1}
                                    style={styles.channelName}>
                                    {channelData?.name}
                                </Text>

                                <Text
                                    numberOfLines={1}
                                    style={styles.channelDetail}>
                                    {channelData?.bio}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.receiverContainer}>
                            {createdBy ? (
                                <TouchableOpacity
                                    style={styles.receiverHeader}
                                    onLongPress={() =>
                                        handleViewUserProfile({
                                            userID: createdBy?.id,
                                        })
                                    }>
                                    <FastImage
                                        source={{
                                            uri:
                                                createdBy?.profileImgUrl ||
                                                images.userDefaultProfileUrl,
                                        }}
                                        style={styles.receiveImg}
                                    />
                                    <Text
                                        style={styles.receiverContentContainer}
                                        numberOfLines={1}>
                                        <Text
                                            numberOfLines={1}
                                            style={styles.receverUserName}>
                                            {createdBy?.userName}
                                        </Text>
                                        {created_at ? (
                                            <>
                                                <View
                                                    style={
                                                        styles.largeDotContainer
                                                    }>
                                                    <View
                                                        style={styles.largeDot}
                                                    />
                                                </View>
                                                <Text
                                                    numberOfLines={1}
                                                    style={styles.date}>
                                                    {DateTime.fromSeconds(
                                                        created_at?._seconds,
                                                    )
                                                        .toFormat(
                                                            'dd/LL/yyyy, h:mm a',
                                                        )
                                                        .toLowerCase()}
                                                </Text>
                                            </>
                                        ) : null}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                            {messageType === 'post' ? (
                                <>
                                    {renderParsedText({
                                        text: post?.data?.title,
                                        title: true,
                                    })}
                                    {renderParsedText({
                                        text: post?.data?.text,
                                    })}
                                </>
                            ) : (
                                renderParsedText({
                                    text: message?.data?.text,
                                })
                            )}
                        </View>
                    </TouchableOpacity>
                );
            }
        },
        [
            communityMap,
            handleNav,
            currentUserId,
            getUserFromUserList,
            renderParsedText,
            handleViewUserProfile,
            personaMap,
        ],
    );

    return renderCommunityItem({item: data});
};

export default React.memo(ChatItem);
