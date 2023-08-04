import React, {useCallback, useContext, memo} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import Animated, {
    Layout,
    FadeInLeft,
    FadeOutLeft,
} from 'react-native-reanimated';

import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import UserBubble from 'components/UserBubble';
import {images} from 'resources';
import getResizedImageUrl from 'utils/media/resize';

import {
    useNavToCommunityChat,
    useNavToPersonaChat,
} from 'hooks/navigationHooks';
import {
    useNavToCommunityPostDiscussion,
    useNavToPostDiscussion,
} from 'hooks/navigationHooks';
import {propsAreEqual} from 'utils/propsAreEqual';
import styles from './styles';
import {selectLayout} from 'utils/helpers';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const RoomItem = ({
    small = false,
    item,
    closeRightDrawer,
    style = {},
    navigation,
}) => {
    //console.log('RENDERING ROOMITEM', item);
    let personaKey = item?.personaID;
    let communityID = item?.communityID;
    let postKey = item?.postID;
    let communityContextRef = useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;

    const globalStateRefContext = useContext(GlobalStateRefContext);
    const navToCommunityChat = useNavToCommunityChat(navigation);
    const navToPersonaChat = useNavToPersonaChat(navigation);
    const navToPostDiscussion = useNavToPostDiscussion(navigation);
    const navToCommunityPostDiscussion =
        useNavToCommunityPostDiscussion(navigation);
    let userMap = globalStateRefContext.current.userMap;
    let personaMap = globalStateRefContext.current.personaMap;

    const navToPostDiscussionWrap = useCallback(() => {
        closeRightDrawer?.();
        if (!postKey) {
            if (item?.communityID) {
                navToCommunityChat({
                    communityID: item?.communityID,
                    chatDocPath: item?.chatDocPath,
                });
            } else if (item?.personaID) {
                navToPersonaChat({
                    personaKey,
                    communityID: personaMap[personaKey]?.communityID,
                });
            }
        } else {
            if (communityID) {
                navToCommunityPostDiscussion({
                    communityID,
                    postKey,
                });
            } else {
                navToPostDiscussion({
                    personaKey: personaKey,
                    personaName: '',
                    personaProfileImgUrl: '',
                    postKey: postKey,
                });
            }
        }
    }, [
        closeRightDrawer,
        postKey,
        item?.communityID,
        item?.personaID,
        item?.chatDocPath,
        navToCommunityChat,
        navToPersonaChat,
        personaKey,
        personaMap,
        communityID,
        navToCommunityPostDiscussion,
        navToPostDiscussion,
    ]);

    const participants = item?.participants;

    const keyExtractor = useCallback(item => item, []);

    const renderItem = useCallback(
        // eslint-disable-next-line no-shadow
        ({item}) => {
            let uid = item;

            let userObject = userMap[uid];

            return (
                <Animated.View
                    layout={selectLayout(Layout)}
                    entering={selectLayout(FadeInLeft)}
                    exiting={selectLayout(FadeOutLeft)}>
                    <UserBubble
                        showName={!small}
                        bubbleSize={small ? 15 : 26}
                        user={{...userObject}}
                    />
                    <View style={{height: small ? 0 : 42}} />
                </Animated.View>
            );
        },
        [userMap, small],
    );

    const liveChannelFullTitle = communityID
        ? communityMap[communityID]?.name
        : personaMap[personaKey]?.name;

    const liveChannelAbbreviatedTitle =
        liveChannelFullTitle.substring(0, 24) +
        (liveChannelFullTitle.length > 24 ? '...' : '');

    let TITLE_CUTTOFF = 10;

    let abbreviatedTitle =
        item?.postTitle?.substring(0, TITLE_CUTTOFF) +
        (item?.postTitle?.length > TITLE_CUTTOFF ? '...' : '');

    return (
        //!someoneNotPresent &&
        //filtered.length ? (
        item === 'roomsep' ? null : (
            <AnimatedTouchable
                layout={selectLayout(Layout)}
                onPress={navToPostDiscussionWrap}
                style={styles.roomsepContainer(style)}>
                <View style={styles.roomsepSubContainer}>
                    <FastImage
                        source={{
                            uri: (
                                communityID
                                    ? communityMap[communityID]?.profileImgUrl
                                    : personaMap[personaKey]?.profileImgUrl
                            )
                                ? getResizedImageUrl({
                                      origUrl: communityID
                                          ? communityMap[communityID]
                                                ?.profileImgUrl
                                          : personaMap[personaKey]
                                                ?.profileImgUrl
                                          ? personaMap[personaKey]
                                                ?.profileImgUrl
                                          : images.personaDefaultProfileUrl,
                                      width: styles.profileImage.width,
                                      height: styles.profileImage.height,
                                  })
                                : images.personaDefaultProfileUrl,
                        }}
                        style={styles.profileImage}
                    />

                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>
                            {liveChannelAbbreviatedTitle +
                                ' (' +
                                (abbreviatedTitle || 'untitled post') +
                                ')'}
                        </Text>
                        <View style={styles.userListContainer}>
                            <FlashList
                                estimatedItemSize={80}
                                numColumns={8}
                                data={participants}
                                contentContainerStyle={
                                    styles.contentContainerStyle
                                }
                                keyExtractor={keyExtractor}
                                renderItem={renderItem}
                            />
                        </View>
                    </View>
                </View>
            </AnimatedTouchable>
        )
    );
};

export default memo(RoomItem, propsAreEqual);
