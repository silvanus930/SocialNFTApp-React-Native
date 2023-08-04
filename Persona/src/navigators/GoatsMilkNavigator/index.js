import React, {useState} from 'react';
import InviteModal from 'components/InviteModal';
import ActivityModal from 'components/ActivityModal';
import {RoomsRenderStateRefContext} from 'state/RoomsRenderStateRef';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {
    View,
    TouchableOpacity,
    Platform,
    Animated,
    Dimensions,
    Easing,
    Keyboard,
    UIManager,
    Alert,
    Text,
    PixelRatio,
} from 'react-native';
import {GlobalStateContext} from 'state/GlobalState';
import {getServerTimestamp} from 'actions/constants';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import Icon from 'react-native-vector-icons/Feather';
import {renderAllDisplayStacks} from './DisplayStacks';
Icon.loadFont();
import {DrawerOpenDispatchContext} from 'state/DrawerState';
import CommunityProjects from 'components/CommunityProjects';
import LinearGradient from 'react-native-linear-gradient';
import Sidebar from 'components/Sidebar';
import {
    PanGestureHandler,
    State,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {GestureHandlerRefsContext} from 'state/GestureHandlerRefsContext';
import useSelector from 'hooks/useSelector';
import * as RootNavigator from 'navigators/RootNavigator';
import FullScreenMedia from 'components/FullScreenMedia';
import ProfileModal from 'components/ProfileModal';
import CreatePostModal from 'components/CreatePostModal';
import RemixPulloutModal from 'components/RemixPulloutModal';
import messaging from '@react-native-firebase/messaging';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import {isPersonaAccessible} from 'utils/helpers';
import {
    useNavToPersonaChat,
    useNavToCommunityChat,
    useNavToPersona,
    useNavToPostDiscussion,
    useNavToCommunityPostDiscussion,
    useNavToCommunityTransfers,
    useNavToPersonaTransfers,
    useNavToDMChat,
} from 'hooks/navigationHooks';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import FindUser from 'components/FindUser';
import InviteForm from 'components/InviteForm';
import {EditBio, EditName} from 'components/EditScreen';
import SettingScreen from 'components/SettingScreen';
import CreatePostScreen from 'components/CreatePostScreen';
import EventEmitter from 'utils/EventEmitter';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import AnimatedHeaderState from 'state/AnimatedHeaderState';
import {AnimatedTabBarContext} from 'state/AnimatedTabBarState';

import IntentList from 'components/Intentbar';
import ProposeWithdrawalScreen from 'components/ProposeWithdrawal';
import {NativeModules} from 'react-native'; //running native iOS module resignFirstResponder

const stringify = require('json-stringify-safe');

const MemoizeLayer = ({route, navigation, setToggleBottom}) => {
    return React.useMemo(
        () => (
            <>
                <GoatsMilkNavigatorBody
                    route={route}
                    navigation={navigation}
                    setToggleBottom={setToggleBottom}
                />
                <FullScreenMedia />
                <ProfileModal navigation={navigation} />
                <CreatePostModal navigation={navigation} />
                <InviteModal navigation={navigation} />
                <ActivityModal navigation={navigation} />
                <RemixPulloutModal navigation={navigation} />
            </>
        ),
        [route, navigation, setToggleBottom],
    );
};
const swiftUserManager = NativeModules.UserManager;

const Stack = createNativeStackNavigator();
const GoatsMilkNavigatorBody = ({route, navigation, setToggleBottom}) => {
    console.log('RENDER GoatsMilkNavigatorBody');
    const myUserID = auth().currentUser.uid;
    let parentNavigation = navigation;
    let parentRoute = route;
    const openThres = 0.15;
    const animatedTranslate = React.useRef(new Animated.Value(0)).current;
    const animatedAllowedDirectionRef = React.useRef(0);
    const animatedAllowedLeft = React.useRef(new Animated.Value(0)).current;
    const animatedAllowedRight = React.useRef(new Animated.Value(0)).current;
    const animatedPanelOpen = React.useRef(new Animated.Value(0)).current;
    const lastLeftPanelOpenRef = React.useRef(false);
    const leftPanelOpenRef = React.useRef(false);
    const rightPanelOpenRef = React.useRef(false);
    const lastRightPanelOpenRef = React.useRef(false);
    const duration = React.useRef(1000);
    const TARGET_POSITION = Dimensions.get('window').width * (1 - openThres);
    const GESTURE_THRESHOLD = TARGET_POSITION * 0.4;
    const VELOCITY_THRESHOLD = 1000;
    const gestureEnabled = React.useRef(true);
    const animatedTranslate1 = React.useRef(new Animated.Value(0)).current;
    const tabBarHeight = useBottomTabBarHeight();
    const [lastNotification, setLastNotification] = useState(null);
    const {setTabBarHeight, tabBarPosition} = React.useContext(
        AnimatedTabBarContext,
    );

    React.useEffect(() => {
        setTabBarHeight({tabBarHeight, TARGET_POSITION, navigation});
    }, [tabBarHeight, setTabBarHeight, TARGET_POSITION, navigation]);

    useFocusEffect(
        React.useCallback(() => {
            const toggle = leftPanelOpenRef?.current === true;
            if (!toggle) {
                closeLeftDrawer();
            }
        }, [closeLeftDrawer]),
    );

    const _onPanGestureEvent = Animated.event(
        [{nativeEvent: {translationX: animatedTranslate1}}],
        {
            useNativeDriver: true,
            listener: ({nativeEvent}) => {
                if (gestureEnabled.current) {
                    animatedTranslate.setValue(nativeEvent.translationX);
                    if (animatedAllowedDirectionRef.current > 0) {
                        tabBarPosition.setValue(nativeEvent.translationX);
                    }
                }

                //Drag start
                if (animatedAllowedDirectionRef.current === 0) {
                    const direction = Math.sign(nativeEvent.translationX);
                    if (direction > 0) {
                        animatedAllowedRight.setValue(1);
                        rightPanelOpenRef.current = false;
                        animatedAllowedLeft.setValue(0);
                        //The dragging started from the left side, for the left panel
                        // if (Platform.OS === 'ios' /*&& useNativeModuleChat*/) {
                        //     swiftUserManager.sideBarRendered();
                        // }
                    } else {
                        //The dragging started from the right side, for the right panel
                        animatedAllowedLeft.setValue(1);
                        leftPanelOpenRef.current = false;
                        animatedAllowedRight.setValue(0);
                    }
                    if (Platform.OS === 'ios' /*&& useNativeModuleChat*/) {
                        swiftUserManager.sideBarRendered();
                    }
                    animatedAllowedDirectionRef.current = direction;
                }
            },
        },
    );

    const onHandlerStateChange = ({nativeEvent}) => {
        if (
            [State.CANCELLED, State.END, State.UNDETERMINED].includes(
                nativeEvent.state,
            ) &&
            gestureEnabled.current
        ) {
            const getTiming = () => {
                return nativeEvent.velocityX === 0
                    ? 1000
                    : Math.min(
                          500,
                          (PixelRatio.get() *
                              1000 *
                              Math.abs(
                                  nativeEvent.translationX - TARGET_POSITION,
                              )) /
                              Math.abs(nativeEvent.velocityX),
                      );
            };
            if (animatedAllowedDirectionRef.current > 0) {
                if (leftPanelOpenRef.current) {
                    if (
                        nativeEvent.translationX < -GESTURE_THRESHOLD ||
                        nativeEvent.velocityX < -VELOCITY_THRESHOLD
                    ) {
                        duration.current = getTiming();
                        gestureEnabled.current = false;
                        Animated.parallel([
                            Animated.timing(animatedTranslate, {
                                toValue: -TARGET_POSITION,
                                duration: duration.current,
                                useNativeDriver: true,
                                easing: Easing.out(Easing.cubic),
                            }).start(() => {
                                gestureEnabled.current = true;
                                drawerDispatch({type: 'nowClosed'});
                                setToggleBottom &&
                                    setToggleBottom(false, navigation);
                                animatedAllowedDirectionRef.current = 0;
                                leftPanelOpenRef.current = false;
                                animatedAllowedRight.setValue(0);
                                animatedPanelOpen.setValue(0);
                                animatedTranslate.setValue(0);
                                tabBarPosition.setValue(0);
                            }),
                            Animated.timing(tabBarPosition, {
                                toValue: -TARGET_POSITION,
                                duration: duration.current,
                                useNativeDriver: true,
                                easing: Easing.out(Easing.cubic),
                            }).start(),
                        ]);
                    } else {
                        //The dragging is cancelled from the panel which is already open

                        duration.current = getTiming();
                        gestureEnabled.current = false;
                        Animated.parallel([
                            Animated.timing(animatedTranslate, {
                                toValue: 0,
                                duration: duration.current,
                                useNativeDriver: true,
                                easing: Easing.out(Easing.cubic),
                            }).start(() => {
                                gestureEnabled.current = true;
                                animatedPanelOpen.setValue(TARGET_POSITION);
                            }),
                            Animated.timing(tabBarPosition, {
                                toValue: 0,
                                duration: duration.current,
                                useNativeDriver: true,
                                easing: Easing.out(Easing.cubic),
                            }).start(),
                        ]);
                    }
                } else {
                    if (
                        nativeEvent.translationX > GESTURE_THRESHOLD ||
                        nativeEvent.velocityX > VELOCITY_THRESHOLD
                    ) {
                        duration.current = getTiming();
                        leftPanelOpenRef.current = true;
                        gestureEnabled.current = false;
                        Animated.parallel([
                            Animated.timing(animatedTranslate, {
                                toValue: TARGET_POSITION,
                                duration: duration.current,
                                useNativeDriver: true,
                                easing: Easing.out(Easing.cubic),
                            }).start(() => {
                                gestureEnabled.current = true;
                                drawerDispatch({type: 'nowOpen'});
                                setToggleBottom &&
                                    setToggleBottom(true, navigation);
                                leftPanelOpenRef.current = true;

                                animatedAllowedRight.setValue(1);
                                animatedPanelOpen.setValue(TARGET_POSITION);
                                animatedTranslate.setValue(0);
                                tabBarPosition.setValue(0);
                            }),
                            Animated.timing(tabBarPosition, {
                                toValue: TARGET_POSITION,
                                duration: duration.current,
                                useNativeDriver: true,
                                easing: Easing.out(Easing.cubic),
                            }).start(),
                        ]);
                    } else {
                        //The dragging is cancelled from the panel in the non-open state
                        if (Platform.OS === 'ios' /*&& useNativeModuleChat*/) {
                            swiftUserManager.sideBarRemoved();
                        }
                        duration.current = getTiming();
                        gestureEnabled.current = false;
                        Animated.parallel([
                            Animated.timing(animatedTranslate, {
                                toValue: 0,
                                duration: duration.current,
                                useNativeDriver: true,
                                easing: Easing.out(Easing.cubic),
                            }).start(() => {
                                gestureEnabled.current = true;
                                animatedAllowedDirectionRef.current = 0;
                                animatedAllowedRight.setValue(0);
                                animatedPanelOpen.setValue(0);
                            }),
                            Animated.timing(tabBarPosition, {
                                toValue: 0,
                                duration: duration.current,
                                useNativeDriver: true,
                                easing: Easing.out(Easing.cubic),
                            }).start(),
                        ]);
                    }
                }
            } else if (animatedAllowedDirectionRef.current < 0) {
                if (rightPanelOpenRef.current) {
                    if (
                        nativeEvent.translationX > GESTURE_THRESHOLD ||
                        nativeEvent.velocityX > VELOCITY_THRESHOLD
                    ) {
                        //When the user drags the right panel and closes it
                        if (Platform.OS === 'ios' /*&& useNativeModuleChat*/) {
                            swiftUserManager.sideBarRemoved();
                        }
                        duration.current = getTiming();
                        gestureEnabled.current = false;
                        Animated.timing(animatedTranslate, {
                            toValue: TARGET_POSITION,
                            duration: duration.current,
                            useNativeDriver: true,
                            easing: Easing.out(Easing.cubic),
                        }).start(() => {
                            gestureEnabled.current = true;
                            drawerDispatch({type: 'nowClosedRH'});
                            setToggleBottom &&
                                setToggleBottom(false, navigation);
                            animatedAllowedDirectionRef.current = 0;
                            rightPanelOpenRef.current = false;
                            animatedAllowedLeft.setValue(0);
                            animatedPanelOpen.setValue(0);
                            animatedTranslate.setValue(0);
                        });
                    } else {
                        duration.current = getTiming();
                        gestureEnabled.current = false;
                        Animated.timing(animatedTranslate, {
                            toValue: 0,
                            duration: duration.current,
                            useNativeDriver: true,
                            easing: Easing.out(Easing.cubic),
                        }).start(() => {
                            gestureEnabled.current = true;
                            animatedPanelOpen.setValue(-TARGET_POSITION);
                        });
                    }
                } else {
                    if (
                        nativeEvent.translationX < -GESTURE_THRESHOLD ||
                        nativeEvent.velocityX < -VELOCITY_THRESHOLD
                    ) {
                        duration.current = getTiming();
                        gestureEnabled.current = false;
                        Animated.timing(animatedTranslate, {
                            toValue: -TARGET_POSITION,
                            duration: duration.current,
                            useNativeDriver: true,
                            easing: Easing.out(Easing.cubic),
                        }).start(() => {
                            gestureEnabled.current = true;
                            drawerDispatch({type: 'nowOpenRH'});
                            setToggleBottom &&
                                setToggleBottom(false, navigation);
                            rightPanelOpenRef.current = true;
                            animatedAllowedLeft.setValue(1);
                            animatedPanelOpen.setValue(-TARGET_POSITION);
                            animatedTranslate.setValue(0);
                        });
                    } else {
                        duration.current = getTiming();
                        gestureEnabled.current = false;
                        Animated.timing(animatedTranslate, {
                            toValue: 0,
                            duration: duration.current,
                            useNativeDriver: true,
                            easing: Easing.out(Easing.cubic),
                        }).start(() => {
                            gestureEnabled.current = true;
                            animatedAllowedDirectionRef.current = 0;
                            animatedAllowedLeft.setValue(0);
                            animatedPanelOpen.setValue(0);
                        });
                    }
                }
            }
        }
    };

    const animatedLeftOpen = Animated.add(
        Animated.multiply(animatedAllowedLeft, animatedTranslate),
        animatedPanelOpen,
    ).interpolate({
        inputRange: [-TARGET_POSITION * 2, -TARGET_POSITION, 0],
        outputRange: [-TARGET_POSITION * 1.3, -TARGET_POSITION, 0],
        extrapolate: 'clamp',
    });

    const animatedRightOpen = Animated.add(
        Animated.multiply(animatedAllowedRight, animatedTranslate),
        animatedPanelOpen,
    ).interpolate({
        inputRange: [-TARGET_POSITION, 0, TARGET_POSITION, TARGET_POSITION * 2],
        outputRange: [0, 0, TARGET_POSITION, TARGET_POSITION * 1.3],
        extrapolate: 'clamp',
    });

    const animatedOpen = Animated.add(animatedLeftOpen, animatedRightOpen);

    const {dispatch: drawerDispatch} = React.useContext(
        DrawerOpenDispatchContext,
    );

    const closeLeftDrawer = React.useCallback(
        (force = false) => {
            if (!gestureEnabled.current && !force) {
                return;
            }
            //When tapping outside of the pane view area, which closes the left drawer
            if (Platform.OS === 'ios') {
                swiftUserManager.sideBarRemoved();
            }
            gestureEnabled.current = false;
            leftPanelOpenRef.current = 0;
            lastLeftPanelOpenRef.current = 0;
            rightPanelOpenRef.current = 0;
            lastRightPanelOpenRef.current = 0;
            animatedAllowedLeft.setValue(0);
            animatedAllowedRight.setValue(0);
            animatedAllowedDirectionRef.current = 0;
            if (navigation.getState().index !== 0) {
                gestureEnabled.current = true;
                return;
            }
            Animated.timing(animatedTranslate, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.ease,
            }).start(() => {
                gestureEnabled.current = true;
                drawerDispatch({type: 'nowClosed'});
                leftPanelOpenRef.current = 0;
                lastLeftPanelOpenRef.current = 0;
                rightPanelOpenRef.current = 0;
                lastRightPanelOpenRef.current = 0;
                animatedAllowedLeft.setValue(0);
                animatedAllowedRight.setValue(0);
                animatedAllowedDirectionRef.current = 0;
            });
            Animated.timing(animatedPanelOpen, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.ease,
            }).start(() => drawerDispatch({type: 'nowClosedRH'}));
            Animated.timing(tabBarPosition, {
                toValue: -TARGET_POSITION,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.ease,
            }).start(() => {
                setToggleBottom && setToggleBottom(false, navigation);
                tabBarPosition.setValue(0);
            });
        },
        [
            TARGET_POSITION,
            animatedAllowedLeft,
            animatedAllowedRight,
            animatedPanelOpen,
            animatedTranslate,
            drawerDispatch,
            navigation,
            setToggleBottom,
            tabBarPosition,
        ],
    );

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const closeRightDrawer = React.useCallback(() => {
        if (!gestureEnabled.current) {
            return;
        }
        //When tapping outside of the pane view area, which closes the right drawer
        if (Platform.OS === 'ios') {
            swiftUserManager.sideBarRemoved();
        }
        leftPanelOpenRef.current = 0;
        lastLeftPanelOpenRef.current = 0;
        rightPanelOpenRef.current = 0;
        lastRightPanelOpenRef.current = 0;
        animatedAllowedLeft.setValue(0);
        animatedAllowedRight.setValue(0);
        animatedAllowedDirectionRef.current = 0;
        if (navigation.getState().index !== 0) {
            gestureEnabled.current = true;
            return;
        }
        Animated.timing(animatedTranslate, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.ease,
        }).start(() => drawerDispatch({type: 'nowClosed'}));
        Animated.timing(animatedPanelOpen, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.ease,
        }).start(() => drawerDispatch({type: 'nowClosedRH'}));
        Animated.timing(tabBarPosition, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.ease,
        }).start(() => {
            setToggleBottom && setToggleBottom(false, navigation);
        });
    }, [
        animatedAllowedLeft,
        animatedAllowedRight,
        animatedPanelOpen,
        animatedTranslate,
        drawerDispatch,
        navigation,
        setToggleBottom,
        tabBarPosition,
    ]);

    const roomsRenderContextRef = React.useContext(RoomsRenderStateRefContext);

    React.useEffect(() => {
        profileModalContextRef.current.csetState({
            closeRightDrawer: closeRightDrawer,
            closeLeftDrawer: () => closeLeftDrawer(true),
            roomsPulloutContextRef: roomsRenderContextRef,
        });
    }, [
        profileModalContextRef,
        closeLeftDrawer,
        closeRightDrawer,
        roomsRenderContextRef,
    ]);

    const panRef = React.useRef(null);
    const activeXOffset = Platform.OS === 'ios' ? 5 : 10;

    const animatedKeyboardOffset = React.useRef(new Animated.Value(0)).current;
    function keyboardWillShow(e) {
        Animated.timing(animatedKeyboardOffset, {
            toValue: -e.endCoordinates.height,
            duration: e.duration,
            useNativeDriver: true,
            easing: Easing.in(Easing.keyboard),
        }).start();
    }

    function keyboardWillHide(e) {
        Animated.timing(animatedKeyboardOffset, {
            toValue: 0,
            duration: e.duration,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
        }).start();
    }

    React.useEffect(() => {
        if (Platform.OS === 'ios') {
            Keyboard.addListener &&
                Keyboard.addListener('keyboardWillShow', keyboardWillShow);
            Keyboard.addListener &&
                Keyboard.addListener('keyboardWillHide', keyboardWillHide);

            return () => {
                Keyboard.removeListener &&
                    Keyboard.removeListener(
                        'keyboardWillShow',
                        keyboardWillShow,
                    );
                Keyboard.removeListener &&
                    Keyboard.removeListener(
                        'keyboardWillHide',
                        keyboardWillHide,
                    );
            };
        }
    }, []);

    const markPushNotificationAsOpened = React.useCallback(
        async messageData => {
            await firestore()
                .collection('users')
                .doc(myUserID)
                .collection('activity')
                .doc(messageData.eventId)
                .update({
                    pushNotificationOpenedAt: getServerTimestamp(),
                });
        },
        [myUserID],
    );

    const globalStateRefContext = React.useContext(GlobalStateRefContext);
    const communityStateRefContext = React.useContext(CommunityStateRefContext);
    const navToCommunityChat = useNavToCommunityChat(
        RootNavigator.navigationRef.current,
    );
    const navToPersonaChat = useNavToPersonaChat(
        RootNavigator.navigationRef.current,
    );
    const navToPostDiscussion = useNavToPostDiscussion(
        RootNavigator.navigationRef.current,
    );
    const navToPersona = useNavToPersona(RootNavigator.navigationRef.current);
    const navToCommunityPostDiscussion = useNavToCommunityPostDiscussion(
        RootNavigator.navigationRef.current,
    );
    const navToCommunityTransfers = useNavToCommunityTransfers(
        RootNavigator.navigationRef.current,
    );
    const navToPersonaTransfers = useNavToPersonaTransfers(
        RootNavigator.navigationRef.current,
    );
    const navToDMChat = useNavToDMChat(navigation);

    const handleEventNavigation = React.useCallback(
        async messageData => {
            try {
                const {
                    current: {personaMap},
                } = globalStateRefContext;
                const {
                    current: {communityMap},
                } = communityStateRefContext;
                const isDM = messageData.personaId === SYSTEM_DM_PERSONA_ID;
                const persona = personaMap[messageData.personaId];
                const supportedEvents = [
                    'invitation',
                    'post_comment',
                    'post_thread_comment',
                    'comment_endorsement',
                    'chat_message',
                    'new_post_from_collaborator',
                    'chat_endorsement',
                    'chat_thread_message',
                    'post_endorsement',
                    'post_mention',
                    'comment_mention',
                    'comment_thread_mention',
                    // Temporarily disabled
                    // 'room_audio_discussion',
                    // 'room_users_present',
                    // 'room_ping',
                    'user_profile_follow',
                    'post_remix',
                    'new_proposal',
                    'proposal_ending_soon',
                    'proposal_ended',
                    'transfer',
                    'post_thread_comment_endorsement',
                    'chat_thread_message_endorsement',
                    'chat_mention',
                ];

                const currentRoute =
                    RootNavigator.navigationRef.current.getCurrentRoute();
                if (
                    messageData &&
                    {}.hasOwnProperty.call(messageData, 'eventType') &&
                    supportedEvents.includes(messageData.eventType)
                ) {
                    if (
                        messageData?.eventType ===
                            'new_post_from_collaborator' ||
                        messageData?.eventType === 'post_comment' ||
                        messageData?.eventType === 'comment_endorsement' ||
                        messageData?.eventType === 'post_thread_comment' ||
                        messageData?.eventType ===
                            'post_thread_comment_endorsement' ||
                        messageData?.eventType === 'comment_mention' ||
                        messageData?.eventType === 'comment_thread_mention' ||
                        messageData?.eventType === 'room_audio_discussion' ||
                        messageData?.eventType === 'room_users_present' ||
                        messageData?.eventType === 'room_ping' ||
                        messageData?.eventType === 'post_new_discussion' ||
                        messageData?.eventType ===
                            'post_continued_discussion' ||
                        messageData?.eventType === 'new_proposal' ||
                        messageData?.eventType === 'proposal_ending_soon' ||
                        messageData?.eventType === 'proposal_ended' ||
                        messageData?.eventType === 'post_mention'
                    ) {
                        if (!isPersonaAccessible({persona, userID: myUserID})) {
                            Alert.alert(
                                'You do not have access to this persona',
                            );
                            return null;
                        }
                        const isCurrentScreen =
                            currentRoute?.name === 'PostDiscussion' &&
                            currentRoute.params.postKey === messageData.postId;

                        if (messageData.eventType === 'room_ping') {
                            // Mark room_ping as having been answered
                            await firestore()
                                .collection('pings')
                                .doc(messageData.pingID)
                                .set({replied: true}, {merge: true});
                        }

                        if (messageData?.communityId) {
                            messageData.communityID = messageData?.communityId;
                        }

                        if (!isCurrentScreen) {
                            if (messageData?.communityID) {
                                console.log('navToCommunityPostDiscussion');
                                navToCommunityPostDiscussion({
                                    communityID: messageData?.communityID,
                                    postKey:
                                        messageData.postKey ||
                                        messageData.postId ||
                                        messageData.postID,
                                    openToThreadID:
                                        messageData.parentMessageID ?? null,
                                    highlightCommentKey: messageData.comment_id,
                                });
                            } else {
                                console.log('navToPostDiscussion');
                                navToPostDiscussion({
                                    personaName: messageData.personaName,
                                    personaKey:
                                        messageData.personaId ||
                                        messageData.entityID,
                                    personaProfileImgUrl:
                                        messageData.personaProfileImgUrl,
                                    postKey:
                                        messageData.postKey ||
                                        messageData.postId ||
                                        messageData.postID,
                                    openToThreadID:
                                        messageData.parentMessageID ?? null,
                                    highlightCommentKey: messageData.comment_id,
                                });
                            }
                        }
                    } else if (
                        messageData?.eventType === 'chat_message' ||
                        messageData?.eventType === 'chat_endorsement' ||
                        messageData?.eventType === 'chat_thread_message' ||
                        messageData?.eventType ===
                            'chat_thread_message_endorsement' ||
                        messageData?.eventType === 'chat_mention' ||
                        messageData?.eventType === 'chat_thread_mention'
                    ) {
                        if (isDM) {
                            const chatId =
                                messageData.chatDocPath.split('/')[3];
                            console.log('chatId', chatId);
                            navToDMChat(
                                chatId,
                                null,
                                messageData.messageId,
                                messageData.parentMessageID,
                            );
                        } else {
                            const chatDocID = messageData.chatDocPath
                                .split('/')
                                .pop();
                            const isCommunityAllChat =
                                messageData.chatDocPath.includes(
                                    'communities',
                                ) && chatDocID === 'all';
                            const isProjectAllChat =
                                messageData.chatDocPath.includes('personas') &&
                                chatDocID === 'all' &&
                                !isDM;
                            if (
                                isProjectAllChat &&
                                isPersonaAccessible({persona, userID: myUserID})
                            ) {
                                console.log(messageData);
                                navToPersonaChat({
                                    communityID:
                                        messageData.communityId ??
                                        persona?.communityID,
                                    chatDocPath: messageData.chatDocPath,
                                    numAttendees: messageData.numAttendees,
                                    personaName: messageData.personaName,
                                    personaKey: messageData.personaId,
                                    personaProfileImgUrl:
                                        messageData.personaProfileImgUrl,
                                    openToThreadID:
                                        messageData.parentMessageID ?? null,
                                    highlightCommentKey: messageData.messageId,
                                });
                            } else if (isCommunityAllChat) {
                                console.log('isCommunityAllChat');
                                navToCommunityChat({
                                    communityID: messageData?.communityId,
                                    openToThreadID:
                                        messageData?.parentMessageID ?? null,
                                    chatDocPath: messageData.chatDocPath,
                                    numAttendees: messageData.numAttendees,
                                    highlightCommentKey: messageData.comment_id,
                                });
                            } else {
                                navToPersonaChat({
                                    communityID:
                                        messageData.communityId ??
                                        persona?.communityID,
                                    chatDocPath: messageData.chatDocPath,
                                    numAttendees: messageData.numAttendees,
                                    personaName: messageData.personaName,
                                    personaKey: messageData.personaId,
                                    personaProfileImgUrl:
                                        messageData.personaProfileImgUrl,
                                    openToThreadID:
                                        messageData.parentMessageID ?? null,
                                    highlightCommentKey: messageData.comment_id,
                                });
                            }
                        }
                    } else if (messageData?.eventType === 'authorInvitation') {
                        // Send to Activity since that's where the invite is accepted
                        RootNavigator.navigate('HomeScreen');
                    } else if (messageData?.eventType === 'transfer') {
                        if (
                            messageData?.sourceType === 'persona' &&
                            personaMap[
                                messageData?.sourceID
                            ]?.authors?.includes(myUserID)
                        ) {
                            navToPersonaTransfers({
                                personaKey: messageData?.sourceID,
                                communityID:
                                    personaMap[messageData?.sourceID]
                                        ?.communityID,
                            });
                        } else if (
                            messageData?.sourceType === 'community' &&
                            communityMap[
                                messageData?.sourceID
                            ]?.members?.includes(myUserID)
                        ) {
                            navToCommunityTransfers({
                                communityID: messageData?.sourceID,
                            });
                        } else if (
                            messageData?.targetType === 'persona' &&
                            personaMap[
                                messageData?.targetID
                            ]?.authors?.includes(myUserID)
                        ) {
                            navToPersonaTransfers({
                                personaKey: messageData?.targetID,
                                communityID:
                                    personaMap[messageData?.targetID]
                                        ?.communityID,
                            });
                        } else if (
                            messageData?.targetType === 'community' &&
                            communityMap[
                                messageData?.targetID
                            ]?.members?.includes(myUserID)
                        ) {
                            navToCommunityTransfers({
                                communityID: messageData?.targetID,
                            });
                        } else if (
                            messageData?.sourceID === myUserID ||
                            messageData?.targetID === myUserID
                        ) {
                            // FIXME: We can't use this until we have a profile transfers
                            // page.
                            // navToMyProfile();
                        } else {
                            console.warn(
                                'Unrecognized nav pattern for transfer event',
                            );
                            RootNavigator.navigate('HomeScreen');
                        }
                    } else {
                        if (messageData.isPostPublished === 'true') {
                            if (
                                !isPersonaAccessible({
                                    persona,
                                    userID: myUserID,
                                })
                            ) {
                                Alert.alert(
                                    'You do not have access to this persona',
                                );
                                return null;
                            }
                            navToPostDiscussion({
                                personaName: messageData.personaName,
                                personaKey: messageData.personaKey,
                                postKey: messageData.postKey,
                                personaProfileImgUrl:
                                    messageData.personaProfileImgUrl,
                                highlightCommentKey: messageData.comment_id,
                            });
                        } else {
                            if (
                                !isPersonaAccessible({
                                    persona,
                                    userID: myUserID,
                                })
                            ) {
                                Alert.alert(
                                    'You do not have access to this persona',
                                );
                                return null;
                            }
                            navToPersona(messageData.personaKey);
                        }
                    }
                } else if (messageData?.inviteId) {
                    RootNavigator.navigate('Invites');
                } else {
                    console.log(messageData.eventType);
                    // Fallback for unsupported events
                    RootNavigator.navigate('HomeScreen');
                }
            } catch (err) {
                console.log('----------------------ERROR handle nav', err);
            }
        },
        [
            communityStateRefContext,
            globalStateRefContext,
            myUserID,
            navToCommunityChat,
            navToCommunityPostDiscussion,
            navToCommunityTransfers,
            navToDMChat,
            navToPersona,
            navToPersonaChat,
            navToPersonaTransfers,
            navToPostDiscussion,
        ],
    );

    React.useEffect(() => {
        //
        // Handle "push notifications" triggered by the EventEmitter:
        //    this allows us to test push notifications in the simulator
        //    in a reproducible and consistent way by emitting the
        //    remoteMessage data without having to explicity trigger
        //    a notification first.
        //
        //    See README.md, "Push Notifications" for usage:
        //
        EventEmitter.removeAllListeners('notification');
        EventEmitter.on('notification', async remoteMessage => {
            const messageData = remoteMessage?.data;
            console.log('[PushNotification:EventEmitter]', messageData);
            if (messageData) {
                closeLeftDrawer();
                closeRightDrawer();
                await handleEventNavigation(messageData);
                await markPushNotificationAsOpened(messageData);
            }
        });

        messaging().onNotificationOpenedApp(async remoteMessage => {
            const messageData = remoteMessage?.data;
            console.log('Message Data1 :', messageData);

            if (messageData?.eventId === lastNotification?.eventId) {
                console.log(
                    'getInitialNotification',
                    'Duplicate notification detected.',
                );
                return;
            }

            if (messageData) {
                closeLeftDrawer();
                closeRightDrawer();
                // await handleEventNavigation(messageData?.acme1?.data);
                // await markPushNotificationAsOpened(messageData?.acme1?.data);
                await handleEventNavigation(messageData);
                await markPushNotificationAsOpened(messageData);
                setLastNotification(messageData);
            }
        });
        messaging()
            .getInitialNotification()
            .then(async remoteMessage => {
                const messageData = remoteMessage?.data;
                console.log('Message Data2 :', remoteMessage);

                if (messageData?.eventId === lastNotification?.eventId) {
                    console.log(
                        'getInitialNotification',
                        'Duplicate notification detected.',
                    );
                    return;
                }

                if (messageData) {
                    closeLeftDrawer();
                    closeRightDrawer();
                    // await handleEventNavigation(messageData?.acme1?.data);
                    // await markPushNotificationAsOpened(
                    //     messageData?.acme1?.data,
                    // );
                    await handleEventNavigation(messageData);
                    await markPushNotificationAsOpened(messageData);
                }
            });
        // messaging().onMessage(async remoteMessage => {
        //     console.log('Message Data3 :', remoteMessage);
        //     const messageData = remoteMessage?.data?.acme1?.data;
        //     const currentRoute =
        //         RootNavigator.navigationRef.current.getCurrentRoute();

        //     if (messageData) {
        //         closeLeftDrawer();
        //         closeRightDrawer();
        //         if (currentRoute?.name === 'PostDiscussion') navBack();
        //         await handleEventNavigation(messageData);
        //         await markPushNotificationAsOpened(messageData);
        //     }
        // });
    }, [
        closeLeftDrawer,
        closeRightDrawer,
        handleEventNavigation,
        lastNotification?.eventId,
        markPushNotificationAsOpened,
        navBack,
    ]);

    const navBack = React.useCallback(() => {
        navigation && navigation.goBack();
    }, [navigation]);

    return (
        <View style={{flexDirection: 'row', flex: 1}}>
            <ControlStudioToggleOpen
                animatedPanelOpen={animatedPanelOpen}
                navigation={navigation}
                openThres={openThres}
                leftPanelOpenRef={leftPanelOpenRef}
                lastLeftPanelOpenRef={lastLeftPanelOpenRef}
                rightPanelOpenRef={rightPanelOpenRef}
                lastRightPanelOpenRef={lastRightPanelOpenRef}
                animatedAllowedDirectionRef={animatedAllowedDirectionRef}
                animatedAllowedRight={animatedAllowedRight}
                animatedAllowedLeft={animatedAllowedLeft}
                setToggleBottom={setToggleBottom}
                tabBarPosition={tabBarPosition}
                gestureEnabled={gestureEnabled}
            />
            <PanGestureHandler
                ref={panRef}
                activeOffsetX={[-activeXOffset, activeXOffset]}
                onGestureEvent={_onPanGestureEvent}
                onHandlerStateChange={onHandlerStateChange}>
                <Animated.View
                    nativeID="drawerPanView"
                    style={{
                        width: '100%',
                        height: '100%',
                        borderColor: 'blue',
                        borderWidth: 0,
                        top: 0,
                    }}>
                    <Animated.View
                        style={[
                            {
                                opacity: animatedRightOpen.interpolate({
                                    inputRange: [
                                        0,
                                        1,
                                        TARGET_POSITION / 2,
                                        TARGET_POSITION,
                                    ],
                                    outputRange: [0, 0.4, 0.7, 1],
                                    extrapolate: 'clamp',
                                }),
                                position: 'absolute',
                                backgroundColor: colors.mediaPostBackground,
                                flex: 1,
                                width: TARGET_POSITION,
                                height: '100%',
                                left: -TARGET_POSITION,
                            },
                            {
                                transform: [
                                    {
                                        translateX:
                                            animatedRightOpen.interpolate({
                                                inputRange: [
                                                    0,
                                                    TARGET_POSITION,
                                                    TARGET_POSITION * 2,
                                                ],
                                                outputRange: [
                                                    TARGET_POSITION * 0.85,
                                                    TARGET_POSITION,
                                                    TARGET_POSITION * 2,
                                                ],
                                                extrapolate: 'clamp',
                                            }),
                                    },
                                ],
                            },
                        ]}>
                        {Platform.OS === 'ios' ? (
                            <LinearGradient
                                colors={[
                                    colors.seperatorLineColor,
                                    colors.seperatorLineColor,
                                ]}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={{
                                    width: 0.4,
                                    height: '100%',
                                    position: 'absolute',
                                    zIndex: 9998,
                                    left: TARGET_POSITION - 1,
                                    right: 0,
                                }}
                            />
                        ) : (
                            <View
                                style={{
                                    width: 0.4,
                                    height: '100%',
                                    position: 'absolute',
                                    zIndex: 9998,
                                    left: TARGET_POSITION - 1,
                                    right: 0,
                                }}
                            />
                        )}

                        <React.Profiler
                            id={'Sidebar'}
                            onRender={(id, phase, actualDuration) => {
                                if (actualDuration > 2) {
                                    console.log(
                                        '======> Sidebar.Profiler',
                                        id,
                                        phase,
                                        actualDuration,
                                    );
                                }
                            }}>
                            <Sidebar
                                closeLeftDrawer={() => closeLeftDrawer(true)}
                                parentNavigation={parentNavigation}
                                profileMode={false}
                                userID={myUserID}
                                showOptionsBar={true}
                                navigation={parentNavigation}
                                cameFrom={'studio'}
                            />
                        </React.Profiler>
                    </Animated.View>
                    <Animated.View
                        style={[
                            {
                                opacity: Animated.multiply(
                                    -1,
                                    animatedLeftOpen,
                                ).interpolate({
                                    inputRange: [
                                        0,
                                        Dimensions.get('window').width *
                                            (1 - openThres * 2),
                                        TARGET_POSITION,
                                    ],
                                    outputRange: [0.2, 0.5, 1],
                                    extrapolate: 'clamp',
                                }),
                                position: 'absolute',
                                backgroundColor: colors.mediaPostBackground,
                                flex: 1,
                                width: '100%',
                                height: '100%',
                                left: Dimensions.get('window').width,
                            },
                            {
                                transform: [
                                    {
                                        translateX: animatedLeftOpen,
                                    },
                                ],
                            },
                        ]}>
                        {Platform.OS === 'ios' ? (
                            <LinearGradient
                                colors={[
                                    colors.seperatorLineColor,
                                    colors.seperatorLineColor,
                                ]}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={{
                                    width: 0.4,
                                    height: '100%',
                                    position: 'absolute',
                                    left: 0,
                                }}
                            />
                        ) : (
                            <View
                                style={{
                                    width: 0.4,
                                    height: '100%',
                                    position: 'absolute',
                                    left: 0,
                                }}
                            />
                        )}

                        <IntentList
                            closeRightDrawer={closeRightDrawer}
                            parentNavigation={parentNavigation}
                            userID={myUserID}
                            showOptionsBar={true}
                            navigation={parentNavigation}
                        />
                    </Animated.View>
                    <Animated.View
                        style={{
                            transform: [
                                {
                                    translateX: animatedOpen,
                                },
                            ],
                            width: Dimensions.get('window').width,
                            height: '100%',
                            borderColor: 'blue',
                            borderWidth: 0,
                            top: 0,
                            position: 'absolute',
                            left: 0,
                        }}>
                        <GestureHandlerRefsContext.Provider value={panRef}>
                            <Stack.Navigator
                                screenOptions={{
                                    animationEnabled: true,
                                    gestureEnabled: true,
                                    cardStyle: {
                                        backgroundColor: colors.gridBackground,
                                    },
                                }}>
                                <Stack.Screen
                                    name="ChatPosts"
                                    initialParams={{
                                        highlightCommentKey: null,
                                        openToThreadID: null,
                                        scrollToMessageID: null,
                                    }}
                                    screenOptions={{gestureEnabled: false}}
                                    options={{
                                        headerShown: false,
                                        headerStyle: {
                                            height: 0,
                                            backgroundColor:
                                                colors.gridBackground,
                                        },
                                        headerTitleStyle: {
                                            fontFamily: fonts.medium,
                                            color: colors.textFaded,
                                        },
                                        headerLeft: () => {},

                                        headerTintColor: colors.postAction,
                                        headerTitle: null,
                                    }}>
                                    {props => (
                                        <AnimatedHeaderState>
                                            <CommunityProjects {...props} />
                                        </AnimatedHeaderState>
                                    )}
                                </Stack.Screen>
                                <Stack.Screen
                                    name="Settings"
                                    screenOptions={{gestureEnabled: false}}
                                    options={{
                                        headerShown: false,
                                        headerStyle: {
                                            backgroundColor:
                                                colors.gridBackground,
                                            // fontFamily: fonts.bold,
                                            height: 0,
                                        },
                                        headerTitleStyle: {
                                            fontFamily: fonts.medium,
                                            color: colors.textFaded,
                                        },
                                        headerLeft: () => {},
                                        cardStyle: {
                                            backgroundColor:
                                                colors.gridBackground,
                                        },

                                        headerTintColor: colors.postAction,
                                        headerTitle: null,
                                    }}>
                                    {props => <SettingScreen {...props} />}
                                </Stack.Screen>
                                <Stack.Screen
                                    name="Add Members"
                                    screenOptions={{gestureEnabled: false}}
                                    options={{
                                        headerShown: false,
                                        headerLeft: () => {},
                                        headerStyle: {
                                            backgroundColor:
                                                colors.mediaPostBackground,
                                            // fontFamily: fonts.bold,
                                            height: 0,
                                        },

                                        headerTitleStyle: {
                                            fontFamily: fonts.medium,
                                            color: colors.textFaded,
                                        },
                                        headerTintColor: colors.postAction,
                                        headerTitle: null,
                                    }}>
                                    {props => <InviteForm {...props} />}
                                </Stack.Screen>

                                <Stack.Screen
                                    name="Edit Bio"
                                    screenOptions={{gestureEnabled: false}}
                                    options={{
                                        headerShown: false,
                                    }}>
                                    {props => <EditBio {...props} />}
                                </Stack.Screen>

                                <Stack.Screen
                                    name="Edit Name"
                                    screenOptions={{gestureEnabled: false}}
                                    options={{
                                        headerShown: false,
                                    }}>
                                    {props => <EditName {...props} />}
                                </Stack.Screen>

                                <Stack.Screen
                                    name="Find User"
                                    screenOptions={{gestureEnabled: false}}
                                    options={{
                                        headerShown: false,
                                        headerStyle: {
                                            backgroundColor: colors.background,
                                            // fontFamily: fonts.bold,
                                            height: 0,
                                        },

                                        headerTitleStyle: {
                                            fontFamily: fonts.medium,
                                            color: colors.textFaded,
                                        },
                                        headerTintColor: colors.postAction,
                                        headerLeft: () => {},
                                        headerTitle: null,
                                    }}>
                                    {props => <FindUser {...props} />}
                                </Stack.Screen>
                                {renderAllDisplayStacks(
                                    Stack,
                                    parentRoute,
                                    parentNavigation,
                                )}

                                <Stack.Screen
                                    name="Propose Withdrawal"
                                    screenOptions={{gestureEnabled: true}}
                                    options={({navigation}) => ({
                                        headerShown: false,
                                        title: '',
                                        headerLeft: () => <></>,
                                        headerRight: () => <></>,
                                    })}
                                    children={({navigation}) => {
                                        const currentRoute =
                                            RootNavigator.navigationRef.current.getCurrentRoute();
                                        return (
                                            <ProposeWithdrawalScreen
                                                parentNavigation={navigation}
                                                entityID={
                                                    currentRoute.params
                                                        ? currentRoute.params
                                                              .entityID
                                                        : null
                                                }
                                                entityType={
                                                    currentRoute.params
                                                        ? currentRoute.params
                                                              .entityType
                                                        : null
                                                }
                                            />
                                        );
                                    }}
                                />

                                <Stack.Screen
                                    name="StudioPostCreation"
                                    screenOptions={{gestureEnabled: true}}
                                    children={({navigation}) => {
                                        return (
                                            <CreatePostScreen
                                                inputPersona={
                                                    route.params
                                                        ? route.params.persona
                                                        : null
                                                }
                                                personaID={
                                                    route.params
                                                        ? route.params.personaID
                                                        : null
                                                }
                                                inputPost={
                                                    route.params.inputPost
                                                        ? route.params.inputPost
                                                        : null
                                                }
                                                inputPostID={
                                                    route.params.inputPostID
                                                        ? route.params
                                                              .inputPostID
                                                        : null
                                                }
                                                editPost={
                                                    route.params.editPost
                                                        ? route.params.editPost
                                                        : null
                                                }
                                                communityID={
                                                    route.params.communityID
                                                        ? route.params
                                                              .communityID
                                                        : null
                                                }
                                                navigation={navigation}
                                                parentNavigation={
                                                    parentNavigation
                                                }
                                            />
                                        );
                                    }}
                                    uid={auth().currentUser?.uid}
                                    options={({navigation}) => ({
                                        headerShown: false,
                                        title: '',
                                        headerLeft: () => <></>,
                                        headerRight: () => <></>,
                                    })}
                                />
                            </Stack.Navigator>
                        </GestureHandlerRefsContext.Provider>
                        <InterceptUserTouches
                            animatedOpen={animatedOpen}
                            openThres={openThres}
                            closeLeftDrawer={closeLeftDrawer}
                            closeRightDrawer={closeRightDrawer}
                            animatedAllowedDirectionRef={
                                animatedAllowedDirectionRef
                            }
                        />
                    </Animated.View>
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
};

function InterceptUserTouches({
    animatedOpen,
    openThres,
    closeLeftDrawer,
    closeRightDrawer,
    animatedAllowedDirectionRef,
}) {
    const onPressBig = React.useCallback(() => {
        if (animatedAllowedDirectionRef.current === 1) {
            closeLeftDrawer();
        } else {
            closeRightDrawer();
        }
    }, [closeLeftDrawer, closeRightDrawer]);
    return (
        <Animated.View
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: colors.background,
                transform: [
                    {
                        translateY: animatedOpen.interpolate({
                            inputRange: [-20, -19, 19, 20],
                            outputRange: [0, 999999, 999999, 0],
                            extrapolate: 'clamp',
                        }),
                    },
                ],
                opacity: Animated.multiply(
                    Animated.add(
                        animatedOpen.interpolate({
                            inputRange: [
                                0,
                                5,
                                Dimensions.get('window').width *
                                    (1 - openThres * 2),
                                Dimensions.get('window').width *
                                    (1 - openThres),
                            ],
                            outputRange: [0, 0.4, 0.7, 1],
                            extrapolate: 'clamp',
                        }),
                        Animated.multiply(-1, animatedOpen).interpolate({
                            inputRange: [
                                0,
                                5,
                                Dimensions.get('window').width *
                                    (1 - openThres * 2),
                                Dimensions.get('window').width *
                                    (1 - openThres),
                            ],
                            outputRange: [0, 0.4, 0.7, 1],
                            extrapolate: 'clamp',
                        }),
                    ),
                    0.8,
                ),
                position: 'absolute',
            }}>
            <TouchableOpacity
                style={{flex: 1, borderColor: 'red', borderWidth: 0}}
                onPress={onPressBig}
            />
        </Animated.View>
    );
}

function ControlStudioToggleOpen({
    animatedPanelOpen,
    openThres,
    leftPanelOpenRef,
    lastLeftPanelOpenRef,
    rightPanelOpenRef,
    lastRightPanelOpenRef,
    animatedAllowedDirectionRef,
    animatedAllowedRight,
    animatedAllowedLeft,
    navigation,
    setToggleBottom,
    tabBarPosition,
    gestureEnabled,
}) {
    const toggleStudio = useSelector(
        GlobalStateContext,
        state => state.toggleStudio,
    );
    const togglePresence = useSelector(
        GlobalStateContext,
        state => state.togglePresence,
    );
    React.useEffect(() => {
        if (toggleStudio !== undefined && gestureEnabled.current) {
            gestureEnabled.current = false;
            leftPanelOpenRef.current = true;
            lastLeftPanelOpenRef.current = true;
            if (Platform.OS === 'ios' /*&& useNativeModuleChat*/) {
                swiftUserManager.sideBarRendered();
            }
            animatedAllowedDirectionRef.current = 1;
            rightPanelOpenRef.current = false;
            lastRightPanelOpenRef.current = false;
            animatedAllowedRight.setValue(1);
            animatedAllowedLeft.setValue(0);
            tabBarPosition.setValue(
                -Dimensions.get('window').width * (1 - openThres),
            );
            setToggleBottom && setToggleBottom(true, navigation);
            Animated.parallel([
                Animated.timing(animatedPanelOpen, {
                    toValue: Dimensions.get('window').width * (1 - openThres),
                    duration: 250,
                    useNativeDriver: true,
                    easing: Easing.easeInOutOut,
                }).start(() => {
                    gestureEnabled.current = true;
                }),
                Animated.timing(tabBarPosition, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                    easing: Easing.easeInOutOut,
                }).start(),
            ]);
        }
    }, [toggleStudio, navigation]);

    React.useEffect(() => {
        if (togglePresence !== undefined && gestureEnabled.current) {
            gestureEnabled.current = false;
            Animated.timing(animatedPanelOpen, {
                toValue: -Dimensions.get('window').width * (1 - openThres),
                duration: 250,
                useNativeDriver: true,
                easing: Easing.easeInOut,
            }).start(() => {
                gestureEnabled.current = true;
            });
            rightPanelOpenRef.current = true;
            lastRightPanelOpenRef.current = true;
            if (Platform.OS === 'ios' /*&& useNativeModuleChat*/) {
                swiftUserManager.sideBarRendered();
            }
            animatedAllowedDirectionRef.current = -1;
            leftPanelOpenRef.current = false;
            lastLeftPanelOpenRef.current = false;
            animatedAllowedLeft.setValue(1);
            animatedAllowedRight.setValue(0);
            setToggleBottom && setToggleBottom(false, navigation);
        }
    }, [togglePresence]);
    return null;
}

export default function GoatsMilkNavigator({route, navigation, children}) {
    return (
        <MemoizeLayer
            route={route}
            navigation={navigation}
            setToggleBottom={route?.params?.setToggleBottom}
        />
    );
}
