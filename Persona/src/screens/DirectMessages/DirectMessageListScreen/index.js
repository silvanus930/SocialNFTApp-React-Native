import React, {useCallback, useMemo, useEffect, useState} from 'react';
import {Text, View, Pressable, TextInput} from 'react-native';
import auth from '@react-native-firebase/auth';
import {FlashList} from '@shopify/flash-list';
import FastImage from 'react-native-fast-image';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {useFocusEffect} from '@react-navigation/native';

import Loading from 'components/Loading';
import useDirectMessagesForUser from 'hooks/useDirectMessagesForUser';
import BlurContainer from 'components/BlurContainer';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateContext} from 'state/GlobalState';
import {images} from 'resources';
import {propsAreEqual} from 'utils/propsAreEqual';

import ListItem from './components/ListItem';
import ContactItem from './components/ContactItem';

import sharedStyles from '../styles';
import styles, {HEADER_HEIGHT} from './styles';

const DirectMessageListScreen = ({route, navigation}) => {
    const {
        setToggleBottom,
        tabNavigation,
        chatID,
        userToDM,
        scrollToMessageID,
        openToThreadID,
    } = route.params;
    const currentUserId = auth().currentUser.uid;
    const userContext = React.useContext(GlobalStateContext);
    const communityContext = React.useContext(CommunityStateContext);
    let communityMap = communityContext?.communityMap;
    const paddingBottom = useBottomTabBarHeight();

    const [{userLists, latestMessageLists}, setUserLists] = useState({
        latestMessageLists: [],
        userLists: [],
    });
    const [searchText, setSearchText] = useState('');
    const {directMessages} = useDirectMessagesForUser({
        userId: currentUserId,
    });

    useEffect(() => {
        let membersId = [
            ...new Set(
                Object.values(communityMap).flatMap(
                    community => community.members || [],
                ),
            ),
        ];

        const dmUsersId = [];
        const latestMessages = [];

        if (directMessages && directMessages.length > 0) {
            directMessages.forEach(item => {
                const cid = item.data.involved.filter(
                    id => id !== currentUserId,
                )[0];

                if (cid) {
                    dmUsersId.push(cid);
                    latestMessages.push({
                        userId: cid,
                        ...item,
                        message: item.data.latestMessage?.data?.text,
                    });
                }
            });
        }

        const entireUsers = membersId.map(userId => {
            if (
                userContext.userMap[userId] &&
                auth().currentUser.uid !== userId
            ) {
                return userContext.userMap[userId];
            }
        });

        setUserLists({
            userLists: entireUsers,
            latestMessageLists: latestMessages,
        });
    }, [communityMap, directMessages, currentUserId, userContext]);

    useEffect(() => {
        if (chatID || userToDM) {
            tabNavigation.popToTop();
            setTimeout(() => {
                tabNavigation.navigate('DM_Chat', {
                    userToDM,
                    chatID,
                    scrollToMessageID,
                    openToThreadID,
                });
            }, 0);
        }
    }, [
        chatID,
        userToDM,
        openToThreadID,
        scrollToMessageID,
        route,
        tabNavigation,
        navigation,
    ]);

    useFocusEffect(
        useCallback(() => {
            setToggleBottom(true, tabNavigation);
        }, [chatID, userToDM]),
    );

    const handleAltSearch = useCallback(() => {
        if (searchText) {
            setSearchText('');
        }
    }, [searchText]);

    const filteredUsers = useMemo(
        () =>
            userLists?.filter(draft => {
                const matchRegEx = new RegExp(searchText, 'gi');
                return draft?.userName?.match(matchRegEx);
            }),
        [userLists, searchText],
    );

    const filteredMessages = useMemo(() => {
        if (searchText) {
            return latestMessageLists?.filter(draft => {
                const matchRegEx = new RegExp(searchText, 'gi');
                return (
                    draft?.message?.match(matchRegEx) ||
                    draft?.username?.match(matchRegEx)
                );
            });
        } else {
            return directMessages;
        }
    }, [latestMessageLists, directMessages, searchText]);

    const renderContent = useCallback(() => {
        const renderDirectMessageItem = ({item}) => {
            return (
                <ListItem
                    navigation={navigation}
                    item={item}
                    searchText={searchText}
                />
            );
        };

        const renderConnectionLists = () => {
            if (!searchText || filteredUsers.length === 0) {
                return <View style={{height: HEADER_HEIGHT}} />;
            } else {
                return (
                    <View style={styles.connectionContainer}>
                        {filteredUsers.slice(0, 4).map(item => (
                            <ContactItem item={item} navigation={navigation} />
                        ))}
                    </View>
                );
            }
        };

        return (
            <FlashList
                removeClippedSubviews={false}
                bounces={true}
                data={filteredMessages}
                ListEmptyComponent={
                    !searchText ? (
                        <View style={styles.noResultContainer}>
                            <Text style={styles.noResultText}>No DMs yet</Text>
                        </View>
                    ) : (
                        <View style={styles.noResultContainer}>
                            <Text style={styles.noResultText}>No results</Text>
                        </View>
                    )
                }
                ListHeaderComponent={renderConnectionLists}
                keyExtractor={item => item.id}
                renderItem={renderDirectMessageItem}
            />
        );
    }, [navigation, searchText, filteredMessages, filteredUsers]);

    if (directMessages === null) {
        return <Loading />;
    } else {
        return (
            <View
                style={[
                    sharedStyles.container,
                    {paddingBottom: paddingBottom},
                ]}>
                <View style={styles.listContainer}>{renderContent()}</View>

                <BlurContainer
                    blurType={'chromeMaterialDark'}
                    blurRadius={11}
                    blurAmount={1}
                    reducedTransparencyFallbackColor="black"
                    style={styles.headerBlurContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerText}>Direct messages</Text>
                        <View style={styles.headerSearchContainer}>
                            <TextInput
                                style={styles.headerSearchTextInput}
                                autoComplete={'off'}
                                autoCapitalize={'none'}
                                placeholder="Search"
                                placeholderTextColor="#D0D3D6"
                                onChangeText={setSearchText}
                                value={searchText}
                            />
                            <Pressable
                                onPress={handleAltSearch}
                                style={styles.headerSearchIconContainer}>
                                <FastImage
                                    style={styles.headerSearchIcon}
                                    source={
                                        searchText
                                            ? images.close
                                            : images.magnifyingGlass
                                    }
                                />
                            </Pressable>
                        </View>
                    </View>
                </BlurContainer>
            </View>
        );
    }
};

export default React.memo(DirectMessageListScreen, propsAreEqual);
