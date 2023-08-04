import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';

import React, {
    useEffect,
    useState,
    useCallback,
    useContext,
    memo,
    useRef,
} from 'react';
import {
    FlatList,
    Text,
    TouchableOpacity,
    View,
    LayoutAnimation,
} from 'react-native';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import RoomItem from './components/RoomItem';

import {propsAreEqual} from 'utils/propsAreEqual';

import styles from './styles';

function WrappedRoomList({
    small = false,
    navigation,
    parentNavigation,
    closeRightDrawer,
    renderHeader = true,
    style = {},
}) {
    return (
        <RoomListMemo
            small={small}
            style={style}
            navigation={navigation}
            parentNavigation={parentNavigation}
            closeRightDrawer={closeRightDrawer}
            renderHeader={renderHeader}
        />
    );
}

function RoomListMemo({
    navigation,
    closeRightDrawer,
    renderHeader = true,
    style = {},
    small = false,
}) {
    const globalStateContextRef = useContext(GlobalStateRefContext);
    const communityContext = useContext(CommunityStateContext);
    const postsCache = useRef({});
    const [roomsPresenceList, setRoomsPresenceList] = useState(null);

    let personaMap = globalStateContextRef.current.personaMap;
    const myUserID = auth().currentUser?.uid;
    let communityMap = communityContext?.communityMap;
    let currentCommunity = communityContext?.currentCommunity;

    // HACK: Sometimes we see a user in multiple live rooms at once. It's
    // unclear what causes this but it might be due to a Firebase RTDB disconnect
    // event taking a while to clear user data. So we filter out users here
    // just in case.
    const usersInLiveSpaces = {};
    const roomsPresenceListWithUniqueUsers = roomsPresenceList?.map(room => {
        const uniqueParticipants = [];
        room?.participants?.forEach(userID => {
            if (!usersInLiveSpaces[userID]) {
                uniqueParticipants.push(userID);
                usersInLiveSpaces[userID] = true;
            }
        });
        room.participants = uniqueParticipants;
        return room;
    });

    const [viewLiveChannelsNum, setViewLiveChannelsNum] = useState(2);
    const viewAllLiveChannels = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setViewLiveChannelsNum(1000); // arbitrarily high
    };

    const collapseLiveChannels = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setViewLiveChannelsNum(2);
    };

    let roomsPList = roomsPresenceListWithUniqueUsers
        ? roomsPresenceList.filter(
              item =>
                  item?.participants?.length > 0 &&
                  (item?.communityID
                      ? item?.communityID === currentCommunity
                      : personaMap[item?.personaID]?.communityID ===
                        currentCommunity),
          )
        : null;

    let roomsPListTrimmed = roomsPList
        ? roomsPList.slice(0, viewLiveChannelsNum)
        : [];

    const canViewContent = useCallback(
        (entityID, entityType) => {
            if (entityType === 'persona') {
                const persona = personaMap[entityID];
                const community = communityMap[persona?.communityID];
                return (
                    persona?.authors?.includes(myUserID) ||
                    (persona?.communityMembers?.includes(myUserID) ?? false) ||
                    (!persona?.private &&
                        community?.members?.includes(myUserID))
                );
            } else if (entityType === 'community') {
                const community = communityMap[entityID];
                return community?.members?.includes(myUserID);
            }
        },
        [personaMap, myUserID, communityMap],
    );

    const renderRoomItem = useCallback(
        ({item}) => {
            if (item === 'roomsep') {
                return null;
            }

            if (item?.isRoom) {
                return (
                    <RoomItem
                        small={small}
                        style={style}
                        closeRightDrawer={closeRightDrawer}
                        item={item}
                        navigation={navigation}
                    />
                );
            }
            return null;
        },
        [closeRightDrawer, navigation, small, style],
    );

    const keyExtractor = useCallback(
        item => (item?.uid ? item.uid + item.place : JSON.stringify(item)),
        [],
    );

    useEffect(() => {
        // TODO: Correctly scope presence data here and debounce
        const db = database();
        const roomsPresenceRef = db.ref('/roomPresence');
        roomsPresenceRef.on('value', async snapshot => {
            const data = snapshot.val();
            if (data) {
                const presenceRoomList = [];
                const usersMaxEnteredRoomAt = {};

                // Handle community-wide chats
                await Promise.all(
                    Object.keys(data?.communities ?? {}).map(
                        async communityID => {
                            await Promise.all(
                                Object.keys(
                                    data?.communities?.[communityID]?.chat ??
                                        {},
                                ).map(async chatID => {
                                    if (
                                        !postsCache.current[
                                            communityID + chatID
                                        ]
                                    ) {
                                        const presenceObjPath = `communities/${communityID}/chat/${chatID}`;
                                        const chatRef = await firestore()
                                            .doc(presenceObjPath)
                                            .get();
                                        const chat = chatRef.data();
                                        postsCache.current[
                                            communityID + chatID
                                        ] = chat;
                                    }
                                    if (
                                        canViewContent(communityID, 'community')
                                    ) {
                                        const participants =
                                            data?.communities[communityID]
                                                ?.chat[chatID] ?? {};
                                        const participantsWithTimestamps =
                                            Object.keys(participants).map(
                                                participantUserID => {
                                                    const enteredRoomAt =
                                                        Math.max(
                                                            Object.keys(
                                                                participants[
                                                                    participantUserID
                                                                ].connections,
                                                            ).map(
                                                                conn =>
                                                                    participants[
                                                                        participantUserID
                                                                    ]
                                                                        ?.connections[
                                                                        conn
                                                                    ]
                                                                        ?.enteredRoomAt ??
                                                                    0,
                                                            ),
                                                        );
                                                    if (
                                                        usersMaxEnteredRoomAt[
                                                            participantUserID
                                                        ]
                                                    ) {
                                                        if (
                                                            usersMaxEnteredRoomAt[
                                                                participantUserID
                                                            ] < enteredRoomAt
                                                        ) {
                                                            usersMaxEnteredRoomAt[
                                                                participantUserID
                                                            ] = enteredRoomAt;
                                                        }
                                                    } else {
                                                        usersMaxEnteredRoomAt[
                                                            participantUserID
                                                        ] = enteredRoomAt;
                                                    }
                                                    return {
                                                        userID: participantUserID,
                                                        enteredRoomAt,
                                                    };
                                                },
                                            );
                                        presenceRoomList.push({
                                            isRoom: true,
                                            chatID,
                                            chatDocPath: `communities/${communityID}/chat/${chatID}`,
                                            postTitle:
                                                postsCache.current[
                                                    communityID + chatID
                                                ]?.title ||
                                                (chatID === 'all'
                                                    ? 'chat'
                                                    : chatID),
                                            communityID,
                                            participants:
                                                participantsWithTimestamps,
                                        });
                                    }
                                }),
                            );

                            // Handle community posts
                            await Promise.all(
                                Object.keys(
                                    data?.communities?.[communityID]?.posts ??
                                        {},
                                ).map(async postID => {
                                    if (!postsCache.current[postID]) {
                                        const presenceObjPath = `communities/${communityID}/posts/${postID}`;
                                        const postRef = await firestore()
                                            .doc(presenceObjPath)
                                            .get();
                                        const post = postRef.data();
                                        postsCache.current[postID] = post;
                                    }
                                    if (
                                        canViewContent(communityID, 'community')
                                    ) {
                                        const participants =
                                            data?.communities[communityID]
                                                ?.posts[postID] ?? {};
                                        const participantsWithTimestamps =
                                            Object.keys(participants).map(
                                                participantUserID => {
                                                    const enteredRoomAt =
                                                        Math.max(
                                                            Object.keys(
                                                                participants[
                                                                    participantUserID
                                                                ].connections,
                                                            ).map(
                                                                conn =>
                                                                    participants[
                                                                        participantUserID
                                                                    ]
                                                                        ?.connections[
                                                                        conn
                                                                    ]
                                                                        ?.enteredRoomAt ??
                                                                    0,
                                                            ),
                                                        );
                                                    if (
                                                        usersMaxEnteredRoomAt[
                                                            participantUserID
                                                        ]
                                                    ) {
                                                        if (
                                                            usersMaxEnteredRoomAt[
                                                                participantUserID
                                                            ] < enteredRoomAt
                                                        ) {
                                                            usersMaxEnteredRoomAt[
                                                                participantUserID
                                                            ] = enteredRoomAt;
                                                        }
                                                    } else {
                                                        usersMaxEnteredRoomAt[
                                                            participantUserID
                                                        ] = enteredRoomAt;
                                                    }
                                                    return {
                                                        userID: participantUserID,
                                                        enteredRoomAt,
                                                    };
                                                },
                                            );
                                        presenceRoomList.push({
                                            isRoom: true,
                                            postID,
                                            postTitle:
                                                postsCache.current[postID]
                                                    ?.title,
                                            communityID,
                                            participants:
                                                participantsWithTimestamps,
                                        });
                                    }
                                }),
                            );
                        },
                    ),
                );

                // Handle persona-wide chats
                await Promise.all(
                    Object.keys(data?.personas ?? {}).map(async personaID => {
                        await Promise.all(
                            Object.keys(
                                data?.personas?.[personaID]?.chats ?? {},
                            ).map(async chatID => {
                                if (!postsCache.current[personaID + chatID]) {
                                    const presenceObjPath = `personas/${personaID}/chats/${chatID}`;
                                    const chatRef = await firestore()
                                        .doc(presenceObjPath)
                                        .get();
                                    const chat = chatRef.data();
                                    postsCache.current[personaID + chatID] =
                                        chat;
                                }
                                if (canViewContent(personaID, 'persona')) {
                                    const participants =
                                        data?.personas[personaID]?.chats[
                                            chatID
                                        ] ?? {};
                                    const participantsWithTimestamps =
                                        Object.keys(participants).map(
                                            participantUserID => {
                                                const enteredRoomAt = Math.max(
                                                    Object.keys(
                                                        participants[
                                                            participantUserID
                                                        ].connections,
                                                    ).map(
                                                        conn =>
                                                            participants[
                                                                participantUserID
                                                            ]?.connections[conn]
                                                                ?.enteredRoomAt ??
                                                            0,
                                                    ),
                                                );
                                                if (
                                                    usersMaxEnteredRoomAt[
                                                        participantUserID
                                                    ]
                                                ) {
                                                    if (
                                                        usersMaxEnteredRoomAt[
                                                            participantUserID
                                                        ] < enteredRoomAt
                                                    ) {
                                                        usersMaxEnteredRoomAt[
                                                            participantUserID
                                                        ] = enteredRoomAt;
                                                    }
                                                } else {
                                                    usersMaxEnteredRoomAt[
                                                        participantUserID
                                                    ] = enteredRoomAt;
                                                }
                                                return {
                                                    userID: participantUserID,
                                                    enteredRoomAt,
                                                };
                                            },
                                        );
                                    presenceRoomList.push({
                                        isRoom: true,
                                        chatID,
                                        chatDocPath: `personas/${personaID}/chats/${chatID}`,
                                        postTitle:
                                            postsCache.current[
                                                personaID + chatID
                                            ]?.title ||
                                            (chatID === 'all'
                                                ? 'chat'
                                                : chatID),
                                        personaID,
                                        participants:
                                            participantsWithTimestamps,
                                    });
                                }
                            }),
                        );

                        // Handle persona posts
                        await Promise.all(
                            Object.keys(
                                data?.personas?.[personaID]?.posts ?? {},
                            ).map(async postID => {
                                if (!postsCache.current[postID]) {
                                    const presenceObjPath = `personas/${personaID}/posts/${postID}`;
                                    const postRef = await firestore()
                                        .doc(presenceObjPath)
                                        .get();
                                    const post = postRef.data();
                                    postsCache.current[postID] = post;
                                }
                                if (canViewContent(personaID, 'persona')) {
                                    const participants =
                                        data?.personas[personaID]?.posts[
                                            postID
                                        ] ?? {};
                                    const participantsWithTimestamps =
                                        Object.keys(participants).map(
                                            participantUserID => {
                                                const enteredRoomAt = Math.max(
                                                    Object.keys(
                                                        participants[
                                                            participantUserID
                                                        ].connections,
                                                    ).map(
                                                        conn =>
                                                            participants[
                                                                participantUserID
                                                            ]?.connections[conn]
                                                                ?.enteredRoomAt ??
                                                            0,
                                                    ),
                                                );
                                                if (
                                                    usersMaxEnteredRoomAt[
                                                        participantUserID
                                                    ]
                                                ) {
                                                    if (
                                                        usersMaxEnteredRoomAt[
                                                            participantUserID
                                                        ] < enteredRoomAt
                                                    ) {
                                                        usersMaxEnteredRoomAt[
                                                            participantUserID
                                                        ] = enteredRoomAt;
                                                    }
                                                } else {
                                                    usersMaxEnteredRoomAt[
                                                        participantUserID
                                                    ] = enteredRoomAt;
                                                }
                                                return {
                                                    userID: participantUserID,
                                                    enteredRoomAt,
                                                };
                                            },
                                        );
                                    presenceRoomList.push({
                                        isRoom: true,
                                        postID,
                                        postTitle:
                                            postsCache.current[postID]?.title,
                                        personaID,
                                        participants:
                                            participantsWithTimestamps,
                                    });
                                }
                            }),
                        );
                    }),
                );

                const presenceRoomListWithActiveUsers = presenceRoomList.map(
                    room => {
                        room.participants = room.participants
                            .filter(
                                participant =>
                                    participant.enteredRoomAt >=
                                        usersMaxEnteredRoomAt[
                                            participant.userID
                                        ] ?? 0,
                            )
                            .map(participant => participant.userID);
                        return room;
                    },
                );
                LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                );
                setRoomsPresenceList(presenceRoomListWithActiveUsers);
            } else {
                LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                );
                setRoomsPresenceList(null);
            }
        });
        return () => roomsPresenceRef.off();
    }, [canViewContent]);

    return (
        <FlatList
            bounces={false}
            ListHeaderComponentStyle={{
                borderWidth: 0,
                borderColor: 'yellow',
            }}
            initialNumToRender={18}
            maxToRenderPerBatch={4}
            style={styles.flatList(style)}
            ListHeaderComponent={
                renderHeader && roomsPList?.length > 0 ? (
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerText}>
                            Live Channels - {roomsPList?.length ?? 0}
                        </Text>
                    </View>
                ) : null
            }
            ListFooterComponent={
                viewLiveChannelsNum === 2 && roomsPList?.length > 2 ? (
                    <TouchableOpacity onPress={viewAllLiveChannels}>
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>
                                View all live channels
                            </Text>
                        </View>
                    </TouchableOpacity>
                ) : roomsPList?.length > 2 ? (
                    <TouchableOpacity onPress={collapseLiveChannels}>
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>
                                Collapse live channels
                            </Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <></>
                )
            }
            data={roomsPListTrimmed}
            keyExtractor={keyExtractor}
            renderItem={renderRoomItem}
        />
    );
}

export default memo(WrappedRoomList, propsAreEqual);
