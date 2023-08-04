import React, {
    useEffect,
    useMemo,
    useCallback,
    useContext,
    useState,
    memo,
    forwardRef,
    useRef,
    useImperativeHandle,
} from 'react';
import {Text, View, LayoutAnimation} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import {FlashList} from '@shopify/flash-list';
import firestore from '@react-native-firebase/firestore';
import partition from 'lodash.partition';
import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {PersonaStateContext} from 'state/PersonaState';
import {FeedDispatchContext} from 'state/FeedStateContext';
import {ForumFeedDispatchContext} from 'state/ForumFeedStateContext';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {propsAreEqual} from 'utils/propsAreEqual';
import MemberListItem from './components/MemberListItem';
import styles from './styles';

function MemberListProfiled(props) {
    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );

    return useMemo(
        () => (
            <React.Profiler
                id={'MemberList'}
                onRender={(id, phase, actualDuration) => {
                    if (actualDuration > 2) {
                        console.log(
                            '========>(MemberList.Profiler)',
                            id,
                            phase,
                            actualDuration,
                        );
                    }
                }}>
                <WrappedMemberList
                    {...props}
                    closeRightDrawer={
                        profileModalContextRef.current.closeRightDrawer
                    }
                />
            </React.Profiler>
        ),
        [profileModalContextRef, props],
    );
}

function WrappedMemberList(props) {
    const communityContext = useContext(CommunityStateContext);
    const personaContextRef = useContext(PersonaStateRefContext);
    const globalStateContextRef = useContext(GlobalStateRefContext);
    const transactionFeedDispatchContext = useContext(FeedDispatchContext);
    const forumFeedDispatchContext = useContext(ForumFeedDispatchContext);

    let communityMap = communityContext.communityMap;
    let currentCommunity = communityContext.currentCommunity;
    let personaMap = globalStateContextRef.current.personaMap;

    const listsRef = useRef();

    useEffect(() => {
        let isSubscribed = false;
        const func = async () => {
            const voiceDoc = await firestore()
                .doc(`users/${auth().currentUser.uid}/live/voice`)
                .get();

            const cid = voiceDoc?.data()?.communityID;
            const pid = voiceDoc?.data()?.personaContext;

            if (pid && isSubscribed) {
                if (
                    !personaContextRef?.current?.persona?.pid &&
                    !personaContextRef?.current?.persona?.feed
                ) {
                    personaContextRef.current.csetState({
                        persona: {...personaMap[pid], pid: pid},
                    });
                }
            }
            if (cid && isSubscribed) {
                // Don't nav to profile on first load
                forumFeedDispatchContext.dispatch({type: 'reset'});
                transactionFeedDispatchContext.dispatch({type: 'reset'});

                if (cid === 'clear') {
                    if (pid) {
                        communityContext.csetState({
                            currentCommunity: personaMap[pid]?.communityID,
                        });
                    }
                } else {
                    communityContext.csetState({
                        currentCommunity: cid,
                    });
                }
            }
        };
        func();
        return () => {
            isSubscribed = false;
        };
    }, [communityContext, personaContextRef, personaMap]);

    let personaList = globalStateContextRef.current.personaList;

    const [usersOnlineStatus, setUsersOnlineStatus] = useState(null);

    useEffect(() => {
        // TODO: Correctly scope presence data here
        const db = database();
        const usersOnlineStatusRef = db.ref('/usersOnlineStatus');
        usersOnlineStatusRef.on('value', snapshot => {
            const data = snapshot.val();
            listsRef.current.prepareForLayoutAnimationRender();
            LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
            );
            setUsersOnlineStatus(data);
        });
        return () => usersOnlineStatusRef.off();
    }, []);

    const [following, setFollowing] = useState([]);

    useEffect(() => {
        const unsubscribeListener = firestore()
            .collection('users')
            .doc(auth().currentUser.uid)
            .collection('live')
            .doc('following')
            .onSnapshot(async followingSnapshot => {
                if (followingSnapshot.data()) {
                    setFollowing(followingSnapshot.data());
                }
            });

        return () => unsubscribeListener();
    }, []);

    let guard =
        communityMap &&
        currentCommunity &&
        communityMap[currentCommunity] &&
        communityMap[currentCommunity].members;

    const follow = useCallback(
        u => {
            return following?.profileFollow?.includes(u.uid);
        },
        [following],
    );

    const member = useCallback(
        u => {
            //guard && console.log('calling member helper function w communityMap',u.uid,communityMap[currentCommunity].members.includes(u.uid), '|',currentCommunity,communityMap[currentCommunity].members.length);
            return guard
                ? u.human &&
                      communityMap[currentCommunity].members.includes(u.uid)
                : false;
        },
        [communityMap, currentCommunity, guard],
    );

    return useMemo(
        () => (
            <MemberListMemo
                {...props}
                follow={follow}
                member={member}
                usersOnlineStatus={usersOnlineStatus}
                personaList={personaList}
                following={following}
                communityMap={communityMap}
                currentCommunity={currentCommunity}
                ref={listsRef}
            />
        ),
        [
            props,
            follow,
            member,
            usersOnlineStatus,
            personaList,
            following,
            communityMap,
            currentCommunity,
        ],
    );
}

function MemberListMemo(
    {
        closeRightDrawer,
        usersOnlineStatus,
        navigation,
        parentNavigation,
        currentCommunity,
        communityMap,
        member,
        follow,
    },
    ref,
) {
    const personaContext = useContext(PersonaStateContext);
    const globalStateContextRef = useContext(GlobalStateRefContext);

    let userList = globalStateContextRef.current.userList;
    let personaMap = globalStateContextRef.current.personaMap;

    const isPersona = Boolean(personaContext?.persona?.pid);
    const pid = personaContext?.persona?.pid; // left in from merge

    let channelFilter = useCallback(
        uid => {
            if (currentCommunity !== 'clear' && isPersona) {
                return personaMap[pid]?.authors?.includes(uid);
            } else {
                return true;
            }
        },
        [currentCommunity, isPersona, personaMap, pid],
    );

    const outerListRef = useRef();
    const innerListRef = useRef();

    useImperativeHandle(ref, () => ({
        prepareForLayoutAnimationRender: () => {
            outerListRef.current?.prepareForLayoutAnimationRender();
            innerListRef.current?.prepareForLayoutAnimationRender();
        },
    }));

    // const channelName = isPersona
    //     ? personaContext?.persona?.name
    //     : communityMap[currentCommunity]?.name;

    const channelID = isPersona
        ? personaContext?.persona?.pid
        : communityMap[currentCommunity]?.cid;
    // const channelMemberRoles = isPersona
    //     ? personaContext?.persona?.memberRoles
    //     : communityMap[currentCommunity]?.memberRoles;

    let filteredUserList = userList
        .filter(
            u =>
                u?.human &&
                channelFilter(u.uid) &&
                (!currentCommunity || currentCommunity === 'clear'
                    ? follow(u)
                    : member(u)),
        )
        .map(u => {
            let onlineStatus = usersOnlineStatus?.[u.uid] || {};
            const connections = Object.values(onlineStatus?.connections ?? {});
            const isConnected = connections?.length > 0;
            const isActive =
                isConnected &&
                Object.values(onlineStatus?.connections ?? {}).reduce(
                    (prev, curr) =>
                        (prev?.active ?? false) || (curr?.active ?? false),
                    false,
                );
            return {
                ...u,
                place: 'generic',
                isConnected,
                isActive,
                lastOnlineAt: onlineStatus?.lastOnlineAt,
            };
        });

    const [neverOnlineMembers, onceOnlineMembers] = partition(
        filteredUserList,
        user => !user?.isConnected && !user?.lastOnlineAt,
    );
    const [onlineMembers, recentlyOnlineMembers] = partition(
        onceOnlineMembers,
        user => user?.isConnected,
    );

    const [activeMembers, inactiveMembers] = partition(
        onlineMembers,
        user => user?.isActive,
    );

    const lastOnlineAtComparator = useCallback(
        (userA, userB) => userB?.lastOnlineAt - userA?.lastOnlineAt,
        [],
    );

    recentlyOnlineMembers.sort(lastOnlineAtComparator);

    const sortedPresenceList = []
        .concat(activeMembers)
        .concat(inactiveMembers)
        .concat(recentlyOnlineMembers)
        .concat(neverOnlineMembers);

    // let numFollowing = sortedPresenceList.length;

    // Take list of users and group based on roles
    let userRoles = {};
    sortedPresenceList.forEach(user => {
        const groupedRoles = user?.roles?.reduce((result, item) => {
            const pathArray = item?.ref?.path?.split('/');
            if (pathArray && pathArray[pathArray.length - 1] === channelID) {
                if (item?.title) {
                    result.push(item.title);
                } else {
                    result.push('member'); // prevent undefineds title from old/stale data
                }
            }
            return result;
        }, []);

        // Default to member in cases where roles obj is not in users table i.e. old data
        userRoles[user.uid] =
            groupedRoles === undefined || groupedRoles.length === 0
                ? ['member']
                : groupedRoles;
    });

    // Users can have many roles even within the same community
    // In the future we'll have to decide how to handle 2+ roles

    let availableTitles = [];
    Object.values(userRoles).forEach(userTitleObj => {
        const titleArray = Object.values(userTitleObj);
        availableTitles = availableTitles.concat(titleArray);
    });

    const uniqueAvailableRoleTitles = availableTitles.filter((value, index) => {
        return availableTitles.indexOf(value) === index;
    });

    uniqueAvailableRoleTitles.sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    let usersByTitleCount = {};

    let filteredUserListByTitle = [];

    uniqueAvailableRoleTitles.forEach(title => {
        let usersSortedByTitleTmp = ['title:' + title];
        let titleCount = 0;
        sortedPresenceList.forEach(user => {
            if (userRoles[user.id].includes(title)) {
                usersSortedByTitleTmp = usersSortedByTitleTmp.concat({
                    ...user,
                    currentRole: title,
                });
                titleCount += 1;
            }
        });
        filteredUserListByTitle.push(usersSortedByTitleTmp);
        usersByTitleCount[title] = titleCount;
    });

    const keyExtractor = useCallback(
        item => (item?.uid ? item.uid + item.place : item),
        [],
    );

    const keyRoleItemExtractor = useCallback(item => item, []);

    const renderItem = useCallback(
        ({item}) => {
            if (typeof item === 'string' && item.includes('title:')) {
                // This is a title header
                const title = item.replace('title:', '');
                const capAndPluralTitle =
                    title.charAt(0).toUpperCase() + title.slice(1) + 's';
                return (
                    <View style={styles.titleSubContainer}>
                        <Text style={styles.titleText}>
                            {capAndPluralTitle +
                                ' - ' +
                                usersByTitleCount[title]}
                        </Text>
                    </View>
                );
            }

            return (
                <View style={styles.memberItemStyle}>
                    <MemberListItem
                        closeRightDrawer={closeRightDrawer}
                        item={item}
                        parentNavigation={parentNavigation}
                        navigation={navigation}
                    />
                </View>
            );
        },
        [closeRightDrawer, parentNavigation, navigation, usersByTitleCount],
    );

    const renderRoleItem = useCallback(
        ({item}) => {
            return (
                <View style={styles.roomItemStyle}>
                    <FlashList
                        ref={innerListRef}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        estimatedItemSize={200}
                        data={item}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem}
                    />
                </View>
            );
        },
        [keyExtractor, renderItem],
    );

    return (
        <View style={styles.container}>
            <FlashList
                ref={outerListRef}
                bounces={false}
                showsVerticalScrollIndicator={false}
                estimatedItemSize={20}
                data={filteredUserListByTitle}
                keyExtractor={keyRoleItemExtractor}
                renderItem={renderRoleItem}
            />
        </View>
    );
}

MemberListMemo = forwardRef(MemberListMemo);

export default memo(MemberListProfiled, propsAreEqual);
