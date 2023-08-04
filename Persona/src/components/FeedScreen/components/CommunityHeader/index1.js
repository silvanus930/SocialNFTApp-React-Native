import React, {useEffect, useRef} from 'react';
import {
    Animated as RNAnimated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    FlatList,
    Alert,
} from 'react-native';

import {useIsFocused, useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import MaskedView from '@react-native-masked-view/masked-view';
import firestore from '@react-native-firebase/firestore';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {default as Icon} from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {PersonaStateContext} from 'state/PersonaState';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {InviteModalStateRefContext} from 'state/InviteModalStateRef';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

import {colors, fonts, palette, images, baseText} from 'res';
import getResizedImageUrl from 'media/resize';

import styles from './styles';
import {BlurView} from '@react-native-community/blur';

const LEFT_MARGIN = 4;

function CreatePost({personaID, communityID}) {
    const postContextRef = React.useState(PostStateRefContext);
    const createPostModalContextRef = React.useContext(
        CreatePostModalStateRefContext,
    );
    const showCreatePostModal = React.useCallback(() => {
        postContextRef?.current?.restoreVanilla({sNew: true, sInit: true});
        createPostModalContextRef?.current?.csetState({
            showToggle: true,
            communityID: communityID,
            personaID: personaID,
        });
    }, [postContextRef, createPostModalContextRef]);
    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const showProfile = useDebounce(() => {
        profileModalContextRef.current.csetState({
            showToggle: true,
            userID: auth().currentUser.uid,
        });
    }, []);
    const {
        current: {userMap},
    } = React.useContext(GlobalStateRefContext);
    let user = userMap[auth().currentUser.uid];
    return (
        <View
            style={{
                borderColor: colors.timestamp,
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                paddingLeft: 8,
                borderTopWidth: 0.4,
                borderBottomWidth: 0.4,
            }}>
            <TouchableOpacity onPress={showProfile}>
                <FastImage
                    source={{
                        uri: user.profileImgUrl
                            ? getResizedImageUrl({
                                  origUrl: user.profileImgUrl,
                                  height: Styles2.personImage.height,
                                  width: Styles2.personImage.width,
                              })
                            : images.userDefaultProfileUrl,
                    }}
                    style={{
                        ...Styles2.personImage,
                        marginStart: 20,
                        top: -2,
                    }}
                />
            </TouchableOpacity>
            <TouchableWithoutFeedback onPress={showCreatePostModal}>
                <View
                    style={{
                        borderColor: 'orange',
                        borderWidth: 0,
                        width: '100%',
                        paddingTop: Platform.OS === 'ios' ? 20 : 26,
                        paddingBottom: 20,
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            marginStart: 12,
                            fontSize: 14,
                            color: colors.maxFaded,
                            fontFamily: fonts.mono,
                        }}>
                        Write something...
                    </Text>
                </View>
            </TouchableWithoutFeedback>
        </View>
    );
}

const PaddedLongButton = ({
    IconComponent = null,
    label,
    style = {},
    onPress = null,
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 20,
                marginRight: 10,
                padding: 6,
                paddingLeft: 3,
                paddingRight: 3,
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: colors.navSubProminent,
                ...style,
            }}>
            {IconComponent && <IconComponent />}
            <Text
                style={{
                    ...baseText,
                    lineHeight: null,
                    fontFamily: fonts.regular,
                    fontSize: 16,
                    paddingLeft: 4,
                    paddingRight: 4,
                    color: colors.navIcon,
                }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

function CommunityPreview({onPress, toggle, setToggle}) {
    const personaContext = React.useContext(PersonaStateContext);
    const communityContext = React.useContext(CommunityStateContext);
    const personaID = personaContext?.persona?.pid;
    const communityID = communityContext.currentCommunity;
    const communityContextRef = React.useContext(CommunityStateRefContext);
    const {
        current: {userMap, personaMap, setTogglePresence},
    } = React.useContext(GlobalStateRefContext);

    let communityMap = communityContextRef?.current?.communityMap;
    let community = personaID
        ? personaMap[personaID]
        : communityMap[communityID];

    const communityList = personaID
        ? community?.authors
              ?.map(userID => userMap[userID])
              .filter(u => u.human)
        : community?.members
              ?.map(userID => userMap[userID])
              .filter(u => u?.human);

    const hasAuth = personaID
        ? personaMap[personaID]?.authors?.includes(auth().currentUser.uid)
        : communityMap[communityID]?.members?.includes(auth().currentUser.uid);

    const SIZE = Styles2.personImage.width;
    const NUM = communityList.length === 6 ? 6 : 5;
    const renderItem = ({item}) => {
        return (
            <View
                style={{
                    marginTop: 0,
                    marginRight: -5,
                    shadowColor:
                        Platform.OS === 'ios' ? colors.gridBackground : null,
                    shadowRadius: 1,
                    shadowOffset: {
                        width: 0,
                        height: 0,
                    },
                    shadowOpacity: 1,
                    width: SIZE,
                    height: SIZE,
                    borderRadius: SIZE,
                }}>
                <FastImage
                    source={{
                        uri: item?.profileImgUrl
                            ? getResizedImageUrl({
                                  origUrl:
                                      item.profileImgUrl ||
                                      images.personaDefaultProfileUrl,
                                  width: SIZE,
                                  height: SIZE,
                              })
                            : images.userDefaultProfileUrl,
                    }}
                    style={{
                        borderColor: colors.timestamp,
                        borderWidth: Platform.OS === 'ios' ? 0.4 : 1,
                        width: SIZE,
                        height: SIZE,
                        borderRadius: SIZE,
                    }}
                />
            </View>
        );
    };
    const navigation = useNavigation();

    const inviteModalStateRefContext = React.useContext(
        InviteModalStateRefContext,
    );

    const inviteModalContextRef = React.useContext(InviteModalStateRefContext);
    let currentCommunity = communityContextRef?.current.currentCommunity;

    const openCommunity = React.useCallback(setTogglePresence, [
        setTogglePresence,
    ]);

    const openModal = () => {
        inviteModalContextRef.current.csetState({
            showToggle: true,
            authors: community
                ? communityMap[currentCommunity].members
                : personaMap[personaID].authors,
            persona: community
                ? communityMap[currentCommunity]
                : personaMap[personaID],
            usePersona: true,
        });
    };

    const additionalMembersCount = communityList.length - NUM;

    const docPath = personaID
        ? `personas/${personaID}`
        : `communities/${communityID}`;

    const isOpened = personaID
        ? personaContext?.persona?.open
        : currentCommunity?.open;
    const isMember = hasAuth;

    const joinAsMember = React.useCallback(() => {
        Alert.alert('Do you want join?', '', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'OK',
                onPress: () => {
                    const fieldName = personaID ? 'authors' : 'members';
                    if (personaID) {
                        personaContext.addPersonaAuthor(auth().currentUser.uid);
                    } else {
                    }
                    firestore()
                        .doc(docPath)
                        .set(
                            {
                                [fieldName]: firestore.FieldValue.arrayUnion(
                                    auth().currentUser.uid,
                                ),
                            },
                            {merge: true},
                        );

                    // add member role to users table
                    const batch = firestore().batch();
                    const userRef = firestore()
                        .collection('users')
                        .doc(auth().currentUser.uid);

                    const destinationRef = firestore().doc(docPath);
                    let role = {};

                    console.log('personaID', personaID);
                    if (personaID) {
                        destinationRef.get().then(doc => {
                            if (doc.exists) {
                                const communityRef = firestore().doc(
                                    `communities/${doc.data().communityID}`,
                                );

                                const roleCollection = communityRef
                                    .collection('roles')
                                    .doc('each')
                                    .collection('role');

                                roleCollection
                                    .where('title', '==', 'member')
                                    .get()
                                    .then(roleSnap => {
                                        role = roleSnap.docs[0].data();
                                        const roleRef = roleCollection.doc(
                                            roleSnap.docs[0].id,
                                        );
                                        // update community role for user (will update persona role below)
                                        batch.update(userRef, {
                                            roles: firestore.FieldValue.arrayUnion(
                                                {
                                                    ref: communityRef,
                                                    ...role,
                                                    roleRef,
                                                },
                                            ),
                                        });
                                        // persona ref for user:
                                        batch.update(userRef, {
                                            roles: firestore.FieldValue.arrayUnion(
                                                {
                                                    ref: destinationRef,
                                                    ...role,
                                                    roleRef,
                                                },
                                            ),
                                        });
                                        batch.commit().then(() => {
                                            console.log(
                                                'SUCCESS BATCH COMMIT joining this persona',
                                            );
                                        });
                                    });
                            }
                        });
                    } else {
                        // need to get role to update community role for user:
                        const roleCollection = destinationRef
                            .collection('roles')
                            .doc('each')
                            .collection('role');

                        roleCollection
                            .where('title', '==', 'member')
                            .get()
                            .then(roleSnap => {
                                role = roleSnap.docs[0].data();
                                const roleRef = roleCollection.doc(
                                    roleSnap.docs[0].id,
                                );
                                // update community role for user
                                batch.update(userRef, {
                                    roles: firestore.FieldValue.arrayUnion({
                                        ref: destinationRef,
                                        ...role,
                                        roleRef,
                                    }),
                                });

                                batch.commit().then(() => {
                                    console.log(
                                        'SUCCESS BATCH COMMIT joining this community',
                                    );
                                });
                            });
                    }
                },
            },
        ]);
    }, [personaContext?.persona, communityID, toggle]);

    return (
        <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={openCommunity}>
                <FlatList
                    horizontal={true}
                    data={communityList?.slice(0, NUM) || []}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{
                        paddingLeft: 20,
                        paddingBottom: 8,
                        paddingTop: 5,
                    }}
                    bounces={false}
                    ListFooterComponent={
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 10,
                                borderColor: 'purple',
                                borderWidth: 0,
                            }}>
                            {communityList?.length > NUM && (
                                <View
                                    style={{
                                        marginTop: 0,
                                        marginLeft: 0,
                                        shadowColor:
                                            Platform.OS === 'ios'
                                                ? colors.gridBackground
                                                : null,
                                        shadowRadius: 1,
                                        shadowOffset: {
                                            width: 0,
                                            height: 0,
                                        },
                                        shadowOpacity: 1,
                                        width: SIZE,
                                        height: SIZE,
                                        borderRadius: SIZE,
                                        borderWidth: 0,
                                        // backgroundColor:
                                        //     colors.studioBackground,
                                        opacity: 1,
                                        borderColor: colors.maxFaded,
                                    }}>
                                    <Text
                                        style={{
                                            marginTop: 5,
                                            fontSize: 16,
                                            color: colors.navSubProminent,
                                        }}>
                                        +{additionalMembersCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    }
                />
            </TouchableOpacity>
            <PaddedLongButton
                style={{
                    top: -5,
                    marginTop: 8,
                    marginBottom: 8,
                    marginRight: 15,
                    flex: 0,
                    width: 84,
                }}
                onPress={
                    isMember
                        ? openModal
                        : isOpened
                        ? joinAsMember
                        : openCommunity
                }
                label={isMember ? '+ Invite' : isOpened ? 'Join' : 'members'}
            />
        </View>
    );
}

function CommunityBio({animatedHeaderOptions, personaID, communityID}) {
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    let community = personaID
        ? personaMap[personaID]
        : communityMap[communityID];

    const communityBioString =
        community?.bio.length < 40
            ? community.bio
            : community.bio.substring(0, 40) + '...';

    const opacity = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    return (
        <RNAnimated.View
            style={{
                borderColor: 'magenta',
                borderWidth: 0,
                paddingBottom: 0,
                marginStart: 0,
                width: '100%',
                flexDirection: 'column',
                padding: 2,
                paddingTop: 5,
                paddingLeft: 0,
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                // marginTop: 3
                opacity,
            }}>
            <View
                style={{
                    marginStart: 0,
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                }}>
                <Text
                    numberOfLines={1}
                    style={{
                        ...baseText,
                        lineHeight: null,
                        fontFamily: fonts.italic,
                        fontSize: 15,
                        color: colors.navSubProminent,
                    }}>
                    {communityBioString ? '' + communityBioString + '' : ''}
                </Text>
            </View>
        </RNAnimated.View>
    );
}

function CommunityMembership({
    animatedHeaderOptions,
    showJoined = true,
    personaID,
    communityID,
    toggle,
    setToggle,
}) {
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    let community = personaID
        ? personaMap[personaID]
        : communityMap[communityID];

    const navigation = useNavigation();

    const showJoinedModal = React.useCallback(() => {}, []);

    const navToAddMembers = React.useCallback(() => {
        navigation.navigate('Add Members');
    }, [navigation]);

    React.useEffect(() => {
        console.log('>>>>>>>>>Toggle in Membership: ', toggle);
    }, [toggle]);

    const renderDownIcon = React.useCallback(() => {
        return (
            <AntDesign
                style={{marginLeft: 5, left: 5}}
                name={'caretdown'}
                color={colors.postAction}
            />
        );
    }, []);

    const communityList = personaID
        ? community?.authors
              ?.map(userID => userMap[userID])
              .filter(u => u.human)
        : community?.members
              ?.map(userID => userMap[userID])
              .filter(u => u?.human);

    const hasAuth = personaID
        ? personaMap[personaID]?.authors?.includes(auth().currentUser.uid)
        : communityMap[communityID]?.members?.includes(auth().currentUser.uid);

    let currentCommunity = communityContextRef?.current.currentCommunity;
    const inviteModalContextRef = React.useContext(InviteModalStateRefContext);

    const openViewModal = () => {
        inviteModalContextRef.current.csetState({
            showToggle: true,
            authors: !personaID
                ? communityMap[currentCommunity].members
                : personaMap[personaID].authors,
            persona: !personaID
                ? communityMap[currentCommunity]
                : personaMap[personaID],
            usePersona: false,
        });
    };

    const openModal = () => {
        inviteModalContextRef.current.csetState({
            showToggle: true,
            authors: community
                ? communityMap[currentCommunity].members
                : personaMap[personaID].authors,
            persona: community
                ? communityMap[currentCommunity]
                : personaMap[personaID],
            usePersona: true,
        });
    };

    const [hidden, setHidden] = React.useState(false);
    animatedHeaderOptions.scrollY.addListener(({value}) => {
        if (value > 75) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    const opacity = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    if (hidden && Platform.OS !== 'android') {
        return null;
    }

    return (
        <RNAnimated.View
            toggle
            style={{
                borderColor: 'magenta',
                borderWidth: 0,
                paddingBottom: 8,
                width: '100%',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                opacity,
            }}
            pointerEvents={hidden ? 'none' : 'auto'}>
            <View
                style={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    paddingTop: 0,
                    marginTop: -2,
                    paddingBottom: 10,
                }}>
                <CommunityPreview
                    hasAuth={hasAuth}
                    communityList={communityList}
                    onPress={openViewModal}
                    toggle={toggle} //update CommunityHeader when user join
                    setToggle={setToggle}
                />
            </View>
            {showJoined && (
                <View
                    style={{
                        borderColor: 'magenta',
                        borderWidth: 0,
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <PaddedLongButton
                        style={{marginLeft: 15, flex: 1}}
                        onPress={showJoinedModal}
                        label={hasAuth ? 'Joined' : 'Request To Join'}
                        IconComponent={renderDownIcon}
                    />
                    <PaddedLongButton
                        style={{marginRight: 15, flex: 1}}
                        onPress={hasAuth ? openModal : openCommunity}
                        label={hasAuth ? 'Invite' : 'Members'}
                    />
                </View>
            )}
        </RNAnimated.View>
    );
}

function CommunityDetails({
    animatedHeaderOptions,
    personaID,
    communityID,
    fullHeaderVisible,
}) {
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    let community = personaID
        ? personaMap[personaID]
        : communityMap[communityID];

    let numMembers = personaID
        ? personaMap[personaID]?.authors?.filter(
              key => userMap[key]?.human || key === auth().currentUser.uid,
          ).length
        : communityMap[communityID]?.members?.filter(
              key => userMap[key]?.human || key === auth().currentUser.uid,
          ).length;

    let navigation = useNavigation();
    let myUserID = auth().currentUser.uid;
    let hasAuth = personaID
        ? personaMap[personaID]?.authors?.includes(myUserID) ||
          myUserID === 'PHobeplJLROyFlWhXPINseFVkK32'
        : communityMap[communityID]?.members?.includes(myUserID) ||
          myUserID === 'PHobeplJLROyFlWhXPINseFVkK32';
    const SIZE = 52;

    const navToSettings = React.useCallback(
        () =>
            personaID
                ? hasAuth
                    ? navigation.navigate('Settings')
                    : null
                : navigation.navigate('Settings'), // community settings already auth'd in that screen
        [navigation, hasAuth, myUserID, personaID],
    );

    const AnimatedFastImage = RNAnimated.createAnimatedComponent(FastImage);
    const scale = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [50, 100],
        outputRange: [1, 0.6],
        extrapolate: 'clamp',
    });
    const opacity = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    return (
        <TouchableWithoutFeedback
            style={{
                borderColor: 'magenta',
                borderWidth: 0,
                width: '100%',
                flexDirection: 'column',
                padding: 16,
                paddingLeft: 10,
                paddingBottom: 8,
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
            }}
            delayPressIn={130}
            onPress={navToSettings}>
            <View style={{marginStart: 15, flexDirection: 'row'}}>
                <AnimatedFastImage
                    source={{
                        uri: community?.profileImgUrl
                            ? getResizedImageUrl({
                                  origUrl:
                                      community.profileImgUrl ||
                                      images.personaDefaultProfileUrl,
                                  width: SIZE,
                                  height: SIZE,
                              })
                            : images.personaDefaultProfileUrl,
                    }}
                    style={{
                        borderColor: colors.text,
                        borderWidth: Platform.OS === 'ios' ? 0.75 : 1,
                        width: SIZE,
                        height: SIZE,
                        marginStart: 2,
                        borderRadius: SIZE,
                        top: 15.8,
                        marginEnd: -5.5,
                        transform: [
                            {translateX: SIZE * 0.5},
                            {translateY: SIZE * -0.5},
                            {scale},
                            {translateX: SIZE * -0.5},
                            {translateY: SIZE * 0.5},
                        ],
                    }}
                />
                <View
                    style={{
                        borderColor: 'magenta',
                        borderWidth: 0,
                        width: '100%',
                        flexDirection: 'column',
                        padding: 16,
                        paddingLeft: 14.3,
                        paddingBottom: 8,
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                    }}>
                    <View
                        style={{
                            marginStart: LEFT_MARGIN,
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                        }}>
                        <Text
                            numberOfLines={1}
                            style={{
                                ...baseText,
                                lineHeight: null,
                                fontFamily: fonts.semibold,
                                fontSize: 23,
                                color: colors.textBright,
                                paddingBottom: 4,
                            }}>
                            {community?.name}
                        </Text>
                        <Icon
                            color={colors.navSubProminent}
                            name={'chevron-right'}
                            size={palette.header.icon.size - 4}
                            style={{top: 6.8}}
                        />
                    </View>
                    <RNAnimated.View
                        style={{
                            marginStart: community?.private
                                ? LEFT_MARGIN
                                : LEFT_MARGIN,
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            opacity,
                        }}>
                        <Text
                            style={{
                                marginTop: -2,
                                ...baseText,
                                top: 0,
                                lineHeight: null,
                                fontFamily: fonts.regular,
                                fontSize: 15,
                                color: colors.navSubProminent,
                            }}>
                            {true ? (
                                <FontAwesome
                                    name={
                                        community?.private ? 'eye-slash' : 'eye'
                                    }
                                    color={colors.navSubProminent}
                                    style={{marginRight: 10, right: 10, top: 0}}
                                    size={18}
                                />
                            ) : null}
                            {true ? '  ' : ''}
                            {community?.private ? 'Private ' : 'Public '}
                            {personaID ? 'Channel' : 'Community'}
                            {' • '}
                            {numMembers} member{numMembers === 1 ? '' : 's'}
                        </Text>
                        {fullHeaderVisible && (
                            <CommunityBio
                                animatedHeaderOptions={animatedHeaderOptions}
                                personaID={personaID}
                                communityID={communityID}
                            />
                        )}
                    </RNAnimated.View>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

function CommunityHeader({
    animatedHeaderOptions,
    gap = true,
    communityID,
    chat = false,
    style = {},
    showCreatePost = true,
    heightMod = 0,
    fullHeaderVisible = true,
}) {
    const personaContext = React.useContext(PersonaStateContext);
    const personaID = personaContext?.persona?.pid;
    const {
        current: {personaMap},
    } = React.useContext(GlobalStateRefContext);
    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    let size = '100%';

    let hasAuth = personaID
        ? personaMap[personaID]?.authors?.includes(auth().currentUser.uid)
        : communityMap[communityID]?.members?.includes(auth().currentUser.uid);

    const [response, setResponse] = React.useState(null);

    // Upload to S3
    useEffect(() => {
        (async function upload() {
            if (response !== null && response?.assets?.length) {
                const file = {
                    ...response.assets[0],
                    uri: response.assets[0].uri,
                    name: response.assets[0].fileName,
                    type: 'image/jpeg',
                };
                const imgUrl = await uploadMediaToS3(
                    file,
                    setProgressIndicator,
                );

                personaContext.setPersonaProfileImgUrl(imgUrl);
                persona.profileImgUrl = imgUrl;

                if (personaContext.persona?.pid) {
                    log(
                        'found a pid',
                        personaContext.persona?.pid,
                        'committing changes immediately!',
                    );
                    // commit new profile picture immediately
                    personaContext.pushPersonaStateToFirebaseAsync(
                        personaContext.persona?.pid,
                        false,
                    );
                } else {
                    firestore()
                        .collection('communities')
                        .doc(communityID)
                        .set({profileImgUrl: imgUrl}, {merge: true});
                }
            }
        })();
    }, [response]);

    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            setToggle(!toggle);
        }
    }, [isFocused]);

    React.useEffect(() => {
        console.log('>>>>>>>>>Toggle in Header: ', toggle);
    }, [toggle]);

    const [toggle, setToggle] = React.useState(false);

    const BANNER_HEIGHT = Platform.OS === 'ios' ? 250 : 283;
    const [progressIndicator, setProgressIndicator] = React.useState('');
    const AnimatedFastImage = RNAnimated.createAnimatedComponent(FastImage);
    const containerHeight =
        (chat ? 270 : hasAuth && showCreatePost && !personaID ? 340 : 320) +
        heightMod;

    const containerTranslateY = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -90],
        extrapolate: 'clamp',
    });

    const AnimatedMaskedView = RNAnimated.createAnimatedComponent(MaskedView);

    const maskTranslate = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -90],
        extrapolate: 'clamp',
    });

    const blurAmount = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [50, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const AnimatedBlurView = RNAnimated.createAnimatedComponent(BlurView);

    const personaHeaderImg =
        personaMap[personaID]?.headerImgUrl ||
        personaMap[personaID]?.profileImgUrl;

    const communityHeaderImg =
        communityMap[communityID]?.headerImgUrl ||
        communityMap[communityID]?.profileImgUrl;

    return (
        <RNAnimated.View
            toggle
            style={{
                backgroundColor: colors.gridBackground,
                flexDirection: 'column',
                marginTop: gap ? (fullHeaderVisible ? 106 : 106) : 6,
                alignItems: 'center',
                height: containerHeight,
                ...style,
                borderColor: 'white',
                borderWidth: 0,
                transform: [{translateY: containerTranslateY}],
            }}>
            {Platform.OS === 'ios' ? (
                <MaskedView
                    toggle
                    style={{
                        zIndex: 9999999,
                        elevation: 9999998,
                        width: '100%',
                        position: 'absolute',
                    }}
                    maskElement={
                        <LinearGradient
                            colors={[
                                'rgba(0,0,0,0.5)',
                                'rgba(0,0,0,0.3)',
                                'rgba(0,0,0,0.3)',
                                'rgba(0,0,0,.1)',
                                'rgba(0,0,0,.01)',
                            ]}
                            style={{flex: 1}}
                        />
                    }>
                    <AnimatedFastImage
                        source={{
                            uri: personaID
                                ? personaHeaderImg
                                    ? getResizedImageUrl({
                                          origUrl: personaHeaderImg,
                                          height: BANNER_HEIGHT,
                                          width: size,
                                      })
                                    : images.personaDefaultProfileUrl
                                : communityHeaderImg
                                ? getResizedImageUrl({
                                      origUrl: communityHeaderImg,
                                      height: BANNER_HEIGHT,
                                      width: size,
                                  })
                                : images.personaDefaultProfileUrl,
                        }}
                        style={{
                            width: '100%',
                            height: BANNER_HEIGHT,
                            borderColor: colors.seperatorLineColor,
                        }}
                    />
                    <AnimatedBlurView
                        blurType={'light'}
                        blurRadius={10}
                        blurAmount={10}
                        reducedTransparencyFallbackColor="black"
                        style={{
                            height: BANNER_HEIGHT,
                            opacity: blurAmount,
                            flexDirection: 'column',
                            zIndex: 999999,
                            elevation: 999999,
                            position: 'absolute',
                            top: 0,
                            width: '100%',
                        }}
                    />
                </MaskedView>
            ) : (
                <View
                    style={{
                        width: '100%',
                        zIndex: 9999999,
                        elevation: 9999998,
                    }}>
                    <FastImage
                        source={{
                            uri: personaID
                                ? personaMap[personaID]?.profileImgUrl
                                    ? getResizedImageUrl({
                                          origUrl:
                                              personaMap[personaID]
                                                  ?.profileImgUrl,
                                          height: BANNER_HEIGHT,
                                          width: size,
                                      })
                                    : images.personaDefaultProfileUrl
                                : communityMap[communityID]?.profileImgUrl
                                ? getResizedImageUrl({
                                      origUrl:
                                          communityMap[communityID]
                                              ?.profileImgUrl,
                                      height: BANNER_HEIGHT,
                                      width: size,
                                  })
                                : images.personaDefaultProfileUrl,
                        }}
                        style={{
                            width: '100%',
                            height: BANNER_HEIGHT - 18,
                            borderColor: colors.seperatorLineColor,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            opacity: 0.25,
                        }}
                    />
                </View>
            )}
            <AnimatedMaskedView
                androidRenderingMode="software"
                style={{
                    zIndex: 99999999999,
                    elevation: 99999999999,
                    width: '100%',
                    marginTop: Platform.OS === 'ios' ? 75 : -180,
                    transform: [
                        {
                            translateY: RNAnimated.multiply(
                                containerTranslateY,
                                new RNAnimated.Value(-1),
                            ),
                        },
                    ],
                }}
                maskElement={
                    <RNAnimated.View
                        style={{
                            height: 150,
                            backgroundColor: 'rgba(0,0,0,0)',
                            transform: [{translateY: maskTranslate}],
                        }}>
                        <LinearGradient
                            colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)']}
                            style={{
                                flex: 1,
                            }}
                        />
                    </RNAnimated.View>
                }>
                <View
                    style={{
                        zIndex: 99999999999,
                        elevation: 99999999999,
                        // marginTop: Platform.OS === 'ios' ? -180 : -180,
                        // marginTop: fullHeaderVisible ? -180 : -110,
                        borderColor: 'red',
                        borderWidth: 0,
                        width: Dimensions.get('window').width,
                        paddingTop: 0,
                    }}>
                    <CommunityDetails
                        toggle={toggle}
                        personaID={personaID}
                        communityID={communityID}
                        fullHeaderVisible={fullHeaderVisible}
                        animatedHeaderOptions={animatedHeaderOptions}
                    />
                    {fullHeaderVisible && (
                        <CommunityMembership
                            toggle={toggle} //update CommunityHeader when user join
                            setToggle={setToggle}
                            personaID={personaID}
                            communityID={communityID}
                            showJoined={false}
                            animatedHeaderOptions={animatedHeaderOptions}
                        />
                    )}

                    {hasAuth && showCreatePost && (
                        <>
                            <CreatePost
                                personaID={personaID}
                                communityID={communityID}
                            />
                        </>
                    )}
                </View>
            </AnimatedMaskedView>
        </RNAnimated.View>
    );
}

const Styles2 = StyleSheet.create({
    loadingIndicator: {
        marginStart: 12,
    },
    exitReply: {
        width: 30,
        height: 30,
        borderRadius: 30,
        marginRight: 10,
        marginLeft: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyBox: {flex: 1, flexDirection: 'column'},
    replyRow: {
        flex: 1,
        flexDirection: 'row',
        marginLeft: 0,
        paddingTop: 7,
        paddingBottom: 8,
    },
    sendIcon: {
        width: 30,
        height: 25,
        flexDirection: 'column',
        alignContent: 'center',
        justifyContent: 'center',
    },
    commentContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 0,
        paddingTop: 5,
        paddingLeft: 16,
        paddingBottom: 5,
        alignItems: 'center',
    },
    postAction: {
        marginLeft: 10,
        marginRight: 8,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 5,
        paddingRight: 5,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: 'blue',
        borderWidth: 0,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    personImage: {
        top: -3,
        width: 28,
        height: 28,
        borderRadius: 28,
    },
    newCommentTimeline: {
        flex: 1,
        marginTop: -9,
        ...palette.timeline.line,
        marginLeft:
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth -
            15,
        backgroundColor: colors.timeline,
    },
    quotingTimeline: {
        marginTop: -11,
        marginRight: 50,
        ...palette.timeline.line,
        backgroundColor: colors.timeline,
        marginBottom: -10,
    },
    quotingTimelineFeedIn: {
        marginTop: 13,
        marginRight: 50,
        marginBottom: -10,
        marginLeft: palette.timeline.line.marginLeft,
        position: 'absolute',
        width: 46,
        height: 50,
        zIndex: 2,
        borderTopLeftRadius: 20,
        borderLeftWidth: 0.4,
        borderTopWidth: 0.4,
        borderLeftColor: colors.timeline,
        borderTopColor: colors.timeline,
    },
    threadTimelineEnd: {
        position: 'absolute',
        left: palette.timeline.line.marginLeft + 0.8 - 8 / 2,
        width: 8,
        height: 8,
        borderRadius: 8,
        borderWidth: 2,
        top: 7,
        borderColor: palette.timeline.line.backgroundColor,
    },
    textInput: {
        color: 'white',
        fontSize: 16,
        flex: 6,
        backgroundColor: colors.seperatorLineColor,
        color: colors.textBright,
        paddingTop: 5.5,
        paddingBottom: 7,
        paddingLeft: 8,
        borderRadius: 10,
        paddingRight: 10,
    },

    centeredView: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    modalView: {
        margin: 0,
        borderRadius: 20,
        paddingTop: 15,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
        borderColor: 'yellow',
        borderWidth: 0,
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxHeight: Dimensions.get('window').height * 0.75,
        width: Dimensions.get('window').width,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    profilePicture: {
        height: 60,
        width: 60,
        borderRadius: 45,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
});

export default CommunityHeader;
