import React, {
    memo,
    useEffect,
    useContext,
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    Platform,
    TouchableHighlight,
    Text,
    TouchableOpacity,
    View,
    LayoutAnimation,
    Alert,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {colors, images} from 'resources';

import getResizedImageUrl from 'utils/media/resize';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';

import {InviteStateContext} from 'state/InviteState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';

import {timestampToDateString, determineUserRights} from 'utils/helpers';
import {useNavToDMChat} from 'hooks/navigationHooks';
import {propsAreEqual} from 'utils/propsAreEqual';

import styles from './styles';

function MemberItemProfiled(props) {
    return useMemo(
        () => (
            <React.Profiler
                id={'MemberItem'}
                onRender={(id, phase, actualDuration) => {
                    if (actualDuration > 2) {
                        // console.log(
                        //     '========>(MemberItem.Profiler)',
                        //     Platform.OS,
                        //     id,
                        //     phase,
                        //     actualDuration,
                        // );
                    }
                }}>
                <WrappedMemberItem {...props} />
            </React.Profiler>
        ),
        [props],
    );
}

function WrappedMemberItem({closeRightDrawer, item, navigation}) {
    console.log(Platform.OS, 'rendering WrappedMemberItem');
    const [optionsBar, setOptionsBar] = useState(false);
    const toggleOptionsBar = useCallback(() => {
        setOptionsBar(!optionsBar);
    }, [optionsBar, setOptionsBar]);

    const [showCreateChild, setShowCreateChild] = useState(false);
    const onLongPressAdd = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowCreateChild(!showCreateChild);
    };

    const translateX = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => {
        return {transform: [{translateX: withTiming(translateX.value)}]};
    });

    useEffect(() => {
        translateX.value = -100;
        translateX.value = withTiming(0);
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <TouchableOpacity
                style={styles.order99}
                onLongPress={toggleOptionsBar}
                onPress={null}>
                <MemberItemMemo
                    closeRightDrawer={closeRightDrawer}
                    editable={true}
                    showAuthors={false}
                    navigation={navigation}
                    large={false}
                    user={item}
                    // persona={item} //
                    userID={item.uid}
                    personaID={item.pidd}
                    showInviteSummary={true}
                    onLongPressAdd={onLongPressAdd}
                    currentRole={item.currentRole}
                />
            </TouchableOpacity>
        </Animated.View>
    );
}

function MemberItemMemo({navigation, closeRightDrawer, user, currentRole}) {
    const {
        current: {user: currentUser},
    } = useContext(GlobalStateRefContext);

    let userIsConnected = user?.isConnected;
    const userIsActive = user?.isActive;
    const isSelf = user.uid === auth().currentUser.uid;

    const communityContext = React.useContext(CommunityStateContext);
    const personaContext = React.useContext(PersonaStateContext);
    const globalStateContextRef = React.useContext(GlobalStateRefContext);
    const communityMap = communityContext.communityMap;
    const isPersona = Boolean(personaContext?.persona?.pid);
    const currentCommunity = communityContext.currentCommunity;

    const channelName = isPersona
        ? personaContext?.persona?.name
        : communityMap[currentCommunity]?.name;

    // can remove if user has rights in persona or higher level in community
    const removeAuth =
        (isPersona &&
            determineUserRights(
                null,
                personaContext?.persona?.pid,
                currentUser,
                'removeUser',
            )) ||
        determineUserRights(currentCommunity, null, currentUser, 'removeUser');

    // AROTH note:
    // the navigation prop passed in above is null...
    //    trace it back 1, 2, 3 or more levels of memo and profile
    //    wrappers and it's still null. something changed
    //    recently (2/27/23) and this prop isn't available.
    //        It's a giant yarn ball that could use a bit of untangling.
    //
    //   I'm opting for `useNavigation()` instead.
    //
    //  Team TODO: clean up & simplify all of these layers
    const _navigation = useNavigation();

    // const messageModalContextRef = useContext(
    //     MessageModalStateRefContext,
    // );

    //Opens an user's profile in modal
    //------------------------------------------------------------
    const profileModalContextRef = useContext(ProfileModalStateRefContext);

    const navToProfile = useCallback(() => {
        if (isSelf) {
            closeRightDrawer();
            _navigation.navigate('Profile');
            return;
        }

        profileModalContextRef.current.csetState({
            userID: user.id,
            showToggle: true,
        });
    }, [
        _navigation,
        closeRightDrawer,
        isSelf,
        profileModalContextRef,
        user.id,
    ]);
    //------------------------------------------------------------

    const inviteContext = useContext(InviteStateContext);
    const navToDMChat = useNavToDMChat(_navigation);

    const dmOnPress = useCallback(async () => {
        if (_navigation && auth().currentUser.uid !== user.id) {
            const chatContext = Object.assign(
                await inviteContext.pushChatStateToFirebaseAsync(
                    [],
                    [
                        {...currentUser, uid: currentUser.id},
                        {...user, uid: user.id},
                    ],
                    SYSTEM_DM_PERSONA_ID,
                    'DM',
                ),
                {title: 'DM (2)', text: 'DM'},
            );
            closeRightDrawer();
            navToDMChat(chatContext.chatID, user);
        }
    }, [
        _navigation,
        user,
        inviteContext,
        currentUser,
        closeRightDrawer,
        navToDMChat,
    ]);

    const renderLeftIcon = (grey = false) => {
        return (
            <Icon
                color={grey ? colors.maxFaded : colors.postAction}
                name="send"
                size={18}
                style={styles.leftIcon}
            />
        );
    };

    const removeUser = async () => {
        try {
            // Step 1 : remove from community/persona userRoles array
            const ref = isPersona
                ? firestore()
                      .collection('personas')
                      .doc(personaContext?.persona?.pid)
                : firestore().collection('communities').doc(currentCommunity);            
            ref.update({
                ['userRoles.' + currentRole]: firestore.FieldValue.arrayRemove(
                    user.uid,
                ),
            });

            // Step 2: remove from the user's roles array
            const userRef = firestore().collection('users').doc(user.uid);
            const currentRoles = (await userRef.get())?.data()?.roles;
            const updatedRoles = currentRoles.filter(
                role => !(role.ref.isEqual(ref) && role.title === currentRole),
            );
            userRef.update({roles: updatedRoles});

            // Step 3: remove from authors/members array
            // ONLY DO THIS IF we are removing their member role
            // i.e. if a user has 2 roles within the channel and you remove 'engineer', 
            // we don't remove them from the authors/members array

            let shouldRemove = true;
            const channelId = isPersona ? personaContext?.persona?.pid : currentCommunity;            
            updatedRoles.forEach(role => {
                if (
                    role.ref.path.split('/')[1] ===
                    channelId
                ) {
                    shouldRemove = false;
                }
            });

            if (shouldRemove) {
                const memberField = isPersona ? 'authors' : 'members';
                const currentMembers = (await ref.get())?.data()?.[memberField];
                const updatedMembers = currentMembers.filter(
                    id => id !== user.uid,
                );
                ref.update({[memberField]: updatedMembers});
            }

            // Step 4: Remove from sub-channels
            // Last, if we are removing the LAST role from a *community*,
            // we need to remove all roles from all personas as well

            if (shouldRemove && !isPersona) {
                const personas = (await ref.get())?.data()?.projects;
                const roleSnap = await ref
                    .collection('roles')
                    .doc('each')
                    .collection('role')
                    .get();
                const allRoleTitles = roleSnap.docs.map(
                    doc => doc.data().title,
                );

                let furtherUpdatedRoles = updatedRoles;
                personas.forEach(async persona => {
                    const pRef = firestore()
                        .collection('personas')
                        .doc(persona);
                    allRoleTitles.forEach(title => {
                        // remove from community/persona userRoles array
                        pRef.update({
                            ['userRoles.' + title]:
                                firestore.FieldValue.arrayRemove(user.uid),
                        });
                    });

                    // now remove all user roles matching ref of this persona
                    furtherUpdatedRoles = furtherUpdatedRoles.filter(
                        role => !role.ref.isEqual(pRef),
                    );

                    // and remove from authors array
                    const currentPersonaMembers = (await pRef.get())?.data()
                        ?.authors;
                    const updatedPersonaMembers = currentPersonaMembers.filter(
                        id => id !== user.uid,
                    );
                    pRef.update({authors: updatedPersonaMembers});
                });
                // outside of loop, update the user with new array of roles
                userRef.update({roles: furtherUpdatedRoles});
            }
        } catch (e) {
            console.log('error removing user', e);
        }

        Alert.alert(
            'Removal in progress...',
            'Hang tight, removal can take a few minutes to complete. Feel free to navigate away.',
            [
                {
                    text: 'OK',
                    onPress: () => {},
                },
            ],
            {cancelable: false},
        );
    };

    const removeUserAlert = () => {
        let numRoles = 0;
        const channelId = isPersona ? personaContext?.persona?.pid : currentCommunity;
        user.roles.forEach((role) => {
            if (
                role.ref.path.split('/')[1] === channelId
            ) {
                numRoles += 1;
            }
        });

        if(numRoles > 1 && currentRole === 'member') {
            Alert.alert(
                `Wait!`,
                `You cannot remove ${user.userName}'s member role from ${channelName} until you remove their other roles`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                        },
                    },
                ],
                {cancelable: false},
            );
        } else if(currentRole === 'admin' && auth().currentUser.uid === user.id) {
            Alert.alert(
                `Wait!`,
                `You cannot remove yourself as admin.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                        },
                    },
                ],
                {cancelable: false},
            );
        } else {
            Alert.alert(
                `Remove User`,
                `You are about to remove ${user.userName}'s ${
                    currentRole ?? 'Member'
                } role from ${channelName}`,
                [
                    {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel remove user'),
                        style: 'cancel',
                    },
                    {
                        text: 'OK',
                        onPress: () => {
                            removeUser();
                        },
                    },
                ],
                {cancelable: false},
            );
        }        
    };

    const renderRemoveIcon = (grey = false) => {
        return (
            <Icon
                color={grey ? colors.maxFaded : '#523E21'}
                name="x-circle"
                size={20}
                style={styles.leftIcon}
            />
        );
    };

    const getLastOnlineAtString = () => {
        const str = timestampToDateString(user?.lastOnlineAt / 1000);
        return str === '0m' ? '1m' : str;
    };

    const profileUrl = user?.profileImgUrl
        ? getResizedImageUrl({
              origUrl: user.profileImgUrl
                  ? user.profileImgUrl
                  : images.userDefaultProfileUrl,
              width: styles.profileModeStyles.width,
              height: styles.profileModeStyles.height,
          })
        : images.userDefaultProfileUrl;

    const connectionStatusBackground =
        userIsConnected && userIsActive
            ? colors.fadedGreen
            : userIsConnected && !userIsActive
            ? colors.orange
            : colors.darkSeperator;

    return (
        <View style={styles.centerContainer}>
            <TouchableHighlight
                activeOpacity={0.6}
                underlayColor={'#292C2E'}
                style={styles.touchContainer}
                onPress={navToProfile}
                onLongPress={dmOnPress}>
                <>
                    <FastImage
                        source={{uri: profileUrl}}
                        style={{...styles.profileModeStyles}}
                    />
                    {
                        <View style={styles.connectionStatusContainer}>
                            <View
                                style={{
                                    backgroundColor: connectionStatusBackground,
                                    ...styles.connectionStatusBackground,
                                }}
                            />
                            <Text
                                style={styles.timeStamps(
                                    getLastOnlineAtString().length,
                                )}>
                                {!userIsConnected && user?.lastOnlineAt
                                    ? getLastOnlineAtString()
                                    : ''}
                            </Text>
                        </View>
                    }

                    <View style={styles.userNameContainer}>
                        <Text
                            style={{
                                ...styles.headerStyle,
                            }}>
                            {user?.userName.slice(0, 1).toUpperCase() +
                                user?.userName.slice(1)}
                        </Text>
                        {/* remove member badge, keep code here for future badges */}
                        {false && (
                            <View style={styles.userRoleContainer}>
                                <Text style={styles.userRoleText}>
                                    {currentRole
                                        ? currentRole.charAt(0).toUpperCase() +
                                          currentRole.slice(1)
                                        : 'Member'}
                                </Text>
                            </View>
                        )}
                        {removeAuth && (
                            <View style={styles.removeUserContainer}>
                                <TouchableOpacity
                                    hitSlop={{
                                        top: 10,
                                        bottom: 10,
                                        left: 40,
                                        right: 50,
                                    }}
                                    onPress={removeUserAlert}
                                    style={styles.leftIconTouch}>
                                    {renderRemoveIcon(true)}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    {/* remove dm send button, not sure we should keep it */}
                    <View style={styles.leftIconContainer}>
                        {!isSelf && false && (
                            <TouchableOpacity
                                hitSlop={{
                                    top: 10,
                                    bottom: 10,
                                    left: 40,
                                    right: 50,
                                }}
                                onPress={dmOnPress}
                                style={styles.leftIconTouch}>
                                {renderLeftIcon(true)}
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            </TouchableHighlight>
        </View>
    );
}

export default memo(MemberItemProfiled, propsAreEqual);
