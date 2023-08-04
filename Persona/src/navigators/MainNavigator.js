import React, {useEffect, useState, useContext} from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import UserInvitesScreen from 'components/UserInvitesScreen';
import palette from 'resources/palette';
import ActivityIndicator from 'components/ActivityIndicator';
import DirectMessageTabIcon from 'navigators/components/DirectMessageTabIcon';
import ProfileMenuScreen, {
    TermsOfServiceScreen,
} from 'components/ProfileMenuScreen';
import BookmarksScreen from 'components/BookmarksScreen';
import PostDiscussionScreen from 'components/PostDiscussionScreen';
import {DrawerOpenDispatchContext} from 'state/DrawerState';
import {baseText} from 'resources/fonts';
import colors from 'resources/colors';
import GoatsMilkNavigator from 'navigators/GoatsMilkNavigator';
import DirectMessagesNavigator from 'navigators/DirectMessagesNavigator';
import ProfileNavigator from 'navigators/ProfileNavigator';

import firestore from '@react-native-firebase/firestore';
import {
    View,
    Text,
    TouchableOpacity,
    LayoutAnimation,
    Keyboard,
    Animated,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import {Activity} from 'components/ActivityModal';
import {useNavigation} from '@react-navigation/native';
import {SearchMainScreen} from 'screens/Search';
import getResizedImageUrl from 'utils/media/resize';
import images from 'resources/images';
import FastImage from 'react-native-fast-image';
import {FadeInUp, FadeOutDown, Layout} from 'react-native-reanimated';
import {
    BottomTabBar,
    createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import AnimatedTabBarState, {
    AnimatedTabBarContext,
} from 'state/AnimatedTabBarState';

const Stack = createNativeStackNavigator();

export default React.memo(MainNavigator, () => true);

function MainNavigator() {
    const {
        current: {
            user: {id: myUserID, disableInAppNotifications},
            isMessagingEnabled,
        },
    } = useContext(GlobalStateRefContext);
    return React.useMemo(
        () => (
            <MainNavigatorMemo
                isMessagingEnabled={isMessagingEnabled}
                myUserID={myUserID}
                disableInAppNotifications={disableInAppNotifications}
            />
        ),
        [isMessagingEnabled, myUserID, disableInAppNotifications],
    );
}

const Tab = createBottomTabNavigator();

const BottomTabWrapper = props => {
    const {dispatch: drawerDispatch} = React.useContext(
        DrawerOpenDispatchContext,
    );
    const navigation = useNavigation();
    const animatedTabBarContext = React.useContext(AnimatedTabBarContext);

    const setToggleBottom = (val, nav) => {
        animatedTabBarContext.setTabBarStyles(val, nav);
        if (val) {
            drawerDispatch({type: 'nowOpen'});
            //LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } else {
            drawerDispatch({type: 'nowClosed'});
            //LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        Keyboard.dismiss();
    };

    const {
        current: {userMap},
    } = React.useContext(GlobalStateRefContext);

    const WrappedActivity = React.useCallback(() => {
        return (
            <Activity
                userID={auth().currentUser.uid}
                navigation={navigation}
                showHeader={false}
            />
        );
    }, [navigation]);

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#405d86',
                tabBarInactiveTintColor: '#555',
                tabBarLabelStyle: {
                    textTransform: 'none',
                    top: 3.3,
                    fontSize: 12,
                },
                tabBarStyle: [
                    {
                        display: 'flex',
                    },
                    null,
                ],
                lazy: true,
                headerShown: false,
                tabBarActiveTintColor: colors.actionText, //v6
                tabBarInactiveTintColor: '#555',
            }}
            tabBar={props => <BottomTabBar {...props} />}>
            <Tab.Screen
                options={{
                    tabBarVisible: false,
                    tabBarIcon: ({color, size}) => {
                        return (
                            <FastImage
                                source={images.persona}
                                style={{
                                    borderRadius: 8,
                                    width: 30,
                                    height: 30,
                                    marginTop: 8,
                                    opacity:
                                        color === colors.actionText ? 1 : 0.45,
                                }}
                            />
                        );
                    },
                    tabBarStyle: animatedTabBarContext.tabBarStylePersona,
                }}
                name="Persona"
                initialParams={{
                    setToggleBottom: setToggleBottom,
                }}>
                {props => <GoatsMilkNavigator {...props} />}
            </Tab.Screen>

            <Tab.Screen
                options={{
                    tabBarLabel: 'DMs',
                    tabBarVisible: false,
                    tabBarIcon: ({color, size}) => {
                        return (
                            <DirectMessageTabIcon color={color} size={size} />
                        );
                    },
                    tabBarStyle: animatedTabBarContext.tabBarStyleDMs,
                }}
                name="DirectMessages"
                initialParams={{setToggleBottom: setToggleBottom}}>
                {props => <DirectMessagesNavigator {...props} />}
            </Tab.Screen>

            <Tab.Screen
                options={{
                    tabBarIcon: ({color, size}) => {
                        return (
                            <View>
                                <AntDesign
                                    color={color}
                                    name="search1"
                                    style={{top: 3}}
                                    size={size + 3}
                                />
                                <View style={{top: -23, left: 8}}>
                                    <ActivityIndicator
                                        invites={true}
                                        renderIcon={false}
                                    />
                                </View>
                            </View>
                        );
                    },
                }}
                name="Search">
                {props => <SearchMainScreen {...props} />}
            </Tab.Screen>
            <Tab.Screen
                options={{
                    tabBarIcon: ({color, size}) => {
                        return (
                            <View style={{top: 2}}>
                                <ActivityIndicator
                                    focused={false}
                                    size={30}
                                    defaultColor={color}
                                    color={'red'}
                                />
                            </View>
                        );
                    },
                }}
                name="Notifications"
                component={() => {
                    /* NB we want to leave this as an inline declaration; necessary for the invite notifier pattern to work. Yes we may get a small perf boost avoiding this rerender, but it's tolerable and enables a quick solution for the unread notification badges (orange dot).  */
                    return (
                        <Activity
                            userID={auth().currentUser.uid}
                            navigation={navigation}
                        />
                    );
                }}
            />

            <Tab.Screen
                options={{
                    tabBarIcon: ({color, size}) => {
                        return (
                            <View>
                                <FontAwesome
                                    color={color}
                                    name="envelope-square"
                                    style={{top: 3}}
                                    size={size + 3}
                                />

                                <View style={{top: -23, left: 8}}>
                                    <ActivityIndicator
                                        invites={true}
                                        renderIcon={false}
                                    />
                                </View>
                            </View>
                        );
                    },
                }}
                name="Invites">
                {props => <UserInvitesScreen {...props} />}
            </Tab.Screen>
            <Tab.Screen
                options={{
                    tabBarIcon: ({color, size}) => {
                        return (
                            <FastImage
                                source={{
                                    uri: userMap[auth().currentUser.uid]
                                        ?.profileImgUrl
                                        ? getResizedImageUrl({
                                              origUrl: userMap[
                                                  auth().currentUser.uid
                                              ]?.profileImgUrl
                                                  ? userMap[
                                                        auth().currentUser.uid
                                                    ].profileImgUrl
                                                  : images.userDefaultProfileUrl,
                                              height: 30,
                                              width: 30,
                                          })
                                        : images.userDefaultProfileUrl,
                                }}
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 8,
                                    opacity:
                                        colors.actionText === color ? 1 : 0.45,
                                    marginTop: 8,
                                }}
                            />
                        );
                    },
                }}
                name="Profile">
                {props => <ProfileNavigator {...props} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

function MainNavigatorMemo({
    myUserID,
    isMessagingEnabled,
    disableInAppNotifications,
}) {
    const [currentDeviceToken, setCurrentDeviceToken] = useState(null);

    const saveTokenToDatabase = React.useCallback(
        async token => {
            // Add the token to the users datastore
            await firestore()
                .collection('users')
                .doc(myUserID)
                .collection('tokens')
                .doc(myUserID)
                .set(
                    {
                        deviceTokens: firestore.FieldValue.arrayUnion(token),
                    },
                    {merge: true},
                );
        },
        [myUserID],
    );

    const removeTokenFromDatabase = React.useCallback(
        async token => {
            await firestore()
                .collection('users')
                .doc(myUserID)
                .collection('tokens')
                .doc(myUserID)
                .update({
                    deviceTokens: firestore.FieldValue.arrayRemove(token),
                });
        },
        [myUserID],
    );

    useEffect(() => {
        // Get the device token
        async function getDeviceToken() {
            if (isMessagingEnabled && currentDeviceToken === null) {
                const token = await messaging().getToken();
                await saveTokenToDatabase(token);
                setCurrentDeviceToken(token);
            }
        }
        getDeviceToken();
    }, [currentDeviceToken, isMessagingEnabled, saveTokenToDatabase]);

    useEffect(() => {
        // Listen to whether the token changes
        if (isMessagingEnabled) {
            return messaging().onTokenRefresh(async newToken => {
                if (currentDeviceToken !== newToken) {
                    if (currentDeviceToken !== null) {
                        await removeTokenFromDatabase(currentDeviceToken);
                    }
                    await saveTokenToDatabase(newToken);
                    setCurrentDeviceToken(newToken);
                }
            });
        }
    }, [
        currentDeviceToken,
        isMessagingEnabled,
        myUserID,
        removeTokenFromDatabase,
        saveTokenToDatabase,
    ]);
    const navigation = useNavigation();
    return React.useMemo(
        () => (
            <Stack.Navigator>
                <Stack.Screen
                    name="HomeStudioDrawer"
                    screenOptions={{gestureEnabled: false}}
                    options={{
                        headerShown: false,
                        headerStyle: {height: 0},
                        headerTitle: null,
                    }}>
                    {props => (
                        <AnimatedTabBarState>
                            <BottomTabWrapper {...props} />
                        </AnimatedTabBarState>
                    )}
                </Stack.Screen>
                <Stack.Screen
                    options={{
                        tabBarIcon: ({color, size}) => {
                            return (
                                <Ionicons
                                    color={color}
                                    name="settings-outline"
                                    style={{top: 5}}
                                    size={size + 3}
                                />
                            );
                        },
                    }}
                    name="Account">
                    {props => <ProfileMenuScreen {...props} />}
                </Stack.Screen>
                {/* <Stack.Screen name="Bookmarks">
                    {(props) =>
                    {
                      console.log('props', props);
                      console.log('props', props.options);
                      console.log()
                      return <BookmarksScreen {...props} />
                    }}
                </Stack.Screen> */}

                <Stack.Screen
                    name="PostDiscussion"
                    children={({route}) => {
                        return (
                            <PostDiscussionScreen
                                renderFromTop={
                                    route?.params?.renderFromTop || false
                                }
                                navigation={navigation}
                                personaKey={
                                    route.params?.personaKey
                                    //         ? route?.params?.personaKey
                                    //         : parentRoute?.params?.personaKey
                                }
                                postKey={
                                    route.params?.postKey
                                    // ? route?.params?.postKey
                                    // : parentRoute?.params?.postKey
                                }
                                communityID={
                                    route.params?.communityID
                                    // ? route?.params?.communityID
                                    // : parentRoute?.params?.communityID
                                }
                                scrollToMessageID={
                                    route.params?.scrollToMessageID
                                    // ? route?.params?.scrollToMessageID
                                    // : parentRoute?.params?.scrollToMessageID
                                }
                                openToThreadID={
                                    route.params?.openToThreadID
                                    // ? route?.params?.openToThreadID
                                    // : parentRoute?.params?.openToThreadID
                                }
                                threadView={
                                    route.params?.threadView
                                    // ? route?.params?.threadView
                                    // : parentRoute?.params?.threadView
                                }
                            />
                        );
                    }}
                    options={() => ({
                        headerStyle: {...palette.header.style, height: 0},
                        headerTitleStyle: palette.header.title,
                        headerTitle: <></>,
                        headerLeft: () => (
                            <View style={palette.header.leftContainer}>
                                <TouchableOpacity
                                    hitSlop={{
                                        left: 10,
                                        right: 30,
                                        bottom: 15,
                                        top: 10,
                                    }}
                                    onPress={() =>
                                        navigation.navigate('HomeScreen')
                                    }>
                                    <AntDesign
                                        name={'down'}
                                        size={palette.header.icon.size}
                                        color={colors.navSubProminent}
                                    />
                                </TouchableOpacity>
                            </View>
                        ),
                        headerRight: () => <></>, // empty element for flexbox scaling
                        headerShown: false,
                    })}
                />
                <Stack.Screen
                    name="Terms"
                    screenOptions={{gestureEnabled: false}}
                    options={{
                        headerShown: true,
                    }}>
                    {props => <TermsOfServiceScreen {...props} />}
                </Stack.Screen>
            </Stack.Navigator>
        ),
        [],
    );
}
