import React, {useEffect} from 'react';

import {
    Text,
    TouchableOpacity,
    View,
    ImageBackground,
    StyleSheet,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Octicons';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import pluralize from 'pluralize';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Animated, {Layout} from 'react-native-reanimated';

import CommunityProjectWallet from 'components/CommunityProjectWallet';
import InviteButton from 'components/DiscussionChatHeader/InviteButton';
import CreateNewPersona from 'components/CreateNewPersona';

import {vanillaPersona} from 'state/PersonaState';
import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateContext} from 'state/GlobalState';
import {PersonaStateContext} from 'state/PersonaState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {FeedDispatchContext} from 'state/FeedStateContext';
import {ForumFeedDispatchContext} from 'state/ForumFeedStateContext';

import {determineUserRights, selectLayout} from 'utils/helpers';

import baseText from 'resources/text';

import {colors, fonts, images} from 'resources';

import getResizedImageUrl from 'utils/media/resize';

import styles from './styles';

// Used in CommunityProfileHeader
const UserSettings = ({navigation, closeLeftDrawer}) => {
    const personaContext = React.useContext(PersonaStateContext);

    const navToProfileMenuScreen = React.useCallback(() => {
        closeLeftDrawer();
        personaContext.csetState({
            persona: {...vanillaPersona, feed: 'settings'},
        });
    }, [closeLeftDrawer, navigation]);

    const selected = personaContext?.persona?.feed === 'settings';
    return (
        <TouchableOpacity
            onPress={navToProfileMenuScreen}
            style={{
                borderColor: 'red',
                borderWidth: 0,
                backgroundColor: !selected
                    ? colors.studioBackground
                    : colors.paleBackground,
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 5,
                    paddingTop: 5,
                    marginStart: 20,
                    paddingBottom: 10,
                }}>
                <Ionicons
                    color={colors.navSubProminent}
                    name="settings-outline"
                    size={30}
                />
                <Text
                    style={{
                        ...baseText,
                        marginStart: 10,
                        color: colors.textFaded,
                        fontFamily: fonts.medium,
                    }}>
                    Settings
                </Text>
            </View>
        </TouchableOpacity>
    );
};

// Used in CommunityProfileHeader
const UserProfile = ({closeLeftDrawer}) => {
    const personaContext = React.useContext(PersonaStateContext);
    const communityContext = React.useContext(CommunityStateContext);
    const transactionFeedDispatchContext =
        React.useContext(FeedDispatchContext);
    const forumFeedDispatchContext = React.useContext(ForumFeedDispatchContext);

    const clearPersonaContext = React.useCallback(() => {
        forumFeedDispatchContext.dispatch({type: 'reset'});
        transactionFeedDispatchContext.dispatch({type: 'reset'});
        communityContext.csetState({currentCommunity: 'clear'});
        personaContext.csetState({
            persona: {...vanillaPersona, feed: 'profile'},
        });
        closeLeftDrawer();
    }, [personaContext, closeLeftDrawer]);

    let selected = personaContext?.persona?.feed === 'profile';
    return (
        <TouchableOpacity
            onPress={clearPersonaContext}
            style={{
                borderColor: 'red',
                borderWidth: 0,
                backgroundColor: !selected
                    ? colors.studioBackground
                    : colors.paleBackground,
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 5,
                    paddingTop: 5,
                    marginStart: 20,
                    paddingBottom: 10,
                }}>
                <Icon
                    name={'feed-person'}
                    size={30}
                    color={
                        personaContext?.persona?.pid
                            ? colors.postAction
                            : colors.textFaded2
                    }
                />
                <Text
                    style={{
                        ...baseText,
                        marginStart: 10,
                        color: colors.textFaded,
                        fontFamily: fontsmedium,
                    }}>
                    Profile
                </Text>
            </View>
        </TouchableOpacity>
    );
};

// Used in CommunityProfileHeader
const ToggleCommunityList = ({navigation}) => {
    const {showCommunityList, toggleCommunityList} =
        React.useContext(GlobalStateContext);

    return (
        <TouchableOpacity
            style={{
                top: -18,
                left: -5,
                marginRight: 0,
                marginLeft: -10,
                padding: 8,
            }}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 20}}
            onPress={toggleCommunityList}>
            <Icon
                name={showCommunityList ? 'chevron-left' : 'chevron-right'}
                size={28}
                style={{padding: 8}}
                color={colors.navSubProminent}
            />
        </TouchableOpacity>
    );
};

// Used in StudioPersonaList
const CommunityProfileHeader = ({numChannels, navigation, closeLeftDrawer}) => {
    const communityContext = React.useContext(CommunityStateContext);
    const communityMap = communityContext?.communityMap;
    const currentCommunity = communityContext?.currentCommunity;

    const {
        current: {userMap, user},
    } = React.useContext(GlobalStateRefContext);
    const personaProfileSize = 200;

    const community = communityMap[currentCommunity];
    const personaProfileImgUrl = community?.profileImgUrl
        ? community.profileImgUrl
        : '';

    const communityID = currentCommunity;

    // old auth logic
    // const hasAuth = communityMap[communityID]?.members.includes(
    //     auth().currentUser.uid,
    // );

    // new auth logic
    const hasAuth = determineUserRights(communityID, null, user, 'withdrawal');

    const ProfileHeader = (
        <View>
            <ImageBackground
                source={{
                    uri: userMap[auth().currentUser.uid]?.profileImgUrl
                        ? getResizedImageUrl({
                              origUrl: userMap[auth().currentUser.uid]
                                  ?.profileImgUrl
                                  ? userMap[auth().currentUser.uid]
                                        .profileImgUrl
                                  : images.userDefaultProfileUrl,
                              height: personaProfileSize,
                              width: personaProfileSize,
                          })
                        : images.userDefaultProfileUrl,
                }}
                imageStyle={styles.headerBackgroundImage}>
                <View style={styles.communityToggleContainer}>
                    <ToggleCommunityList navigation={navigation} />
                </View>

                <View style={styles.innerContainer}>
                    <View
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            borderColor: 'green',
                            borderWidth: 0,
                            flexDirection: 'column',
                            top: 30,
                        }}>
                        <Text
                            style={{
                                ...baseText,
                                fontSize: 20,
                                color: colors.postAction,
                                fontFamily: fonts.semibold,
                            }}>
                            {userMap[auth().currentUser.uid]?.userName}
                        </Text>

                        <View
                            style={{
                                borderColor: 'orange',
                                borderWidth: 0,
                                width: '100%',
                            }}>
                            <CommunityProjectWallet
                                small={true}
                                persona={userMap[auth().currentUser.uid]}
                            />
                        </View>
                        <View style={{height: 25}} />
                    </View>
                </View>

                <UserSettings
                    navigation={navigation}
                    closeLeftDrawer={closeLeftDrawer}
                />

                <UserProfile closeLeftDrawer={closeLeftDrawer} />
            </ImageBackground>
        </View>
    );

    if (!community) {
        return ProfileHeader;
    }

    const numCommMembers = community?.members?.filter(
        key => userMap[key]?.human,
    ).length;

    const communityVisibility = community?.private ? 'Private' : 'Public';

    return (
        <View>
            <View accessibilityIgnoresInvertColors={true}>
                <Animated.Image
                    layout={selectLayout(Layout)}
                    source={{
                        uri: getResizedImageUrl({
                            origUrl: personaProfileImgUrl
                                ? personaProfileImgUrl
                                : images.personaDefaultProfileUrl,
                            height: personaProfileSize,
                            width: personaProfileSize,
                        }),
                    }}
                    resizeMode="cover"
                    style={[
                        StyleSheet.absoluteFill,
                        styles.headerBackgroundImage,
                    ]}
                />
                <View style={styles.communityToggleContainer}>
                    <ToggleCommunityList navigation={navigation} />
                </View>

                <Animated.View
                    style={styles.innerContainer}
                    layout={selectLayout(Layout)}>
                    <Animated.Text
                        style={styles.headerText}
                        layout={selectLayout(Layout)}>
                        {community?.name}
                    </Animated.Text>

                    <Animated.View
                        style={styles.subheaderContainer}
                        layout={selectLayout(Layout)}>
                        <FontAwesome
                            name={community?.private ? 'eye-slash' : 'eye'}
                            color={colors.headerVisibilityIcon}
                            style={styles.visibilityIcon}
                            size={16}
                        />
                        <Animated.Text
                            style={styles.subheaderText}
                            layout={selectLayout(Layout)}>
                            {communityVisibility} community
                        </Animated.Text>
                        <Animated.Text
                            layout={selectLayout(Layout)}
                            style={[
                                styles.subheaderText,
                                styles.subheaderSpacer,
                            ]}>
                            •
                        </Animated.Text>
                        <Animated.Text
                            style={styles.subheaderText}
                            layout={selectLayout(Layout)}>
                            {`${numCommMembers} ${pluralize(
                                'member',
                                numCommMembers,
                            )}`}
                        </Animated.Text>
                    </Animated.View>

                    <View style={styles.inviteContainer}>
                        <InviteButton
                            small={true}
                            community={Boolean(currentCommunity)}
                            personaID={currentCommunity}
                        />
                    </View>
                    <View style={styles.walletContainer}>
                        <CommunityProjectWallet
                            hasAuth={hasAuth}
                            small={true}
                            persona={community}
                        />
                    </View>
                </Animated.View>
            </View>

            <View style={styles.channelHeaderContainer}>
                <Text
                    style={{
                        ...baseText,
                        flex: 0,
                        color: colors.maxFaded,
                        fontSize: 18,
                    }}>
                    All channels ({numChannels + 1})
                </Text>
            </View>
        </View>
    );
};

export default CommunityProfileHeader;
