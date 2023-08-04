import {BlurView} from '@react-native-community/blur';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useNavigation, useRoute} from '@react-navigation/native';
import ActivityIndicator from 'components/ActivityIndicator';
import AddPostButton from 'components/AddPostButton';
import InviteButton from 'components/DiscussionChatHeader/InviteButton';
import ViewPostsButton from 'components/DiscussionChatHeader/ViewPostsButton';
import HeaderBackIcon from 'components/HeaderBackIcon';
import PostHeader from 'components/homePost/PostHeader';
import {HomeScrollContextControl} from 'components/HomeScrollContext';
import NotchSpacer, {heightOffset} from 'components/NotchSpacer';
import isEqual from 'lodash.isequal';
import React, {useContext, useMemo} from 'react';
import {
    Animated,
    Keyboard,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import images from 'resources/images';
import baseText, {BaseText} from 'resources/text';
import {CommunityStateContext} from 'state/CommunityState';
import {vanillaPost} from 'state/PostState';
import {ProfileModalStateContext} from 'state/ProfileModalState';
import {ForumFeedDispatchContext} from 'state/ForumFeedStateContext';
import {FeedDispatchContext} from 'state/FeedStateContext';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import getResizedImageUrl from 'utils/media/resize';
import palette from 'resources/palette';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PersonaStateContext, vanillaPersona} from 'state/PersonaState';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import CommunityHeader from 'components/CommunityHeader';
import {DiscussionEngineFrameStateContext} from './DiscussionEngineContext';
import {InviteModalStateRefContext} from 'state/InviteModalStateRef';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(FloatingHeader, propsAreEqual);

function FloatingHeader(props) {
    const frameStateContext = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    let frameState = frameStateContext?.state;
    const contentLength = frameState?.contentLength;
    //const contentVisibleHeight = frameState?.contentVisibleHeight;
    //
    //
    /*const {scrollChatToTop} = React.useContext(GlobalStateContext);
  console.log('rendering FloatingHeader w scrollChatToTop',scrollChatToTop);*/
    const {onPressGoUpArrow, onPressGoDownArrow} = React.useContext(
        ProfileModalStateContext,
    );

    return useMemo(
        () => (
            <FloatingHeaderMemo
                {...props}
                onPressGoUpArrow={onPressGoUpArrow}
                onPressGoDownArrow={onPressGoDownArrow}
                contentLength={contentLength}
            />
        ),
        //[props, contentVisibleHeight, contentLength],
        [props, onPressGoUpArrow, onPressGoDownArrow, contentLength],
    );
}

const ActiveHeader = ({numMembers}) => {
    const personaContext = React.useContext(PersonaStateContext);
    const InviteStateContext = React.useContext(InviteModalStateRefContext);
    const transactionFeedDispatchContext =
        React.useContext(FeedDispatchContext);
    const forumFeedDispatchContext = React.useContext(ForumFeedDispatchContext);
    let size = 30;

    const {
        current: {personaMap, userMap},
    } = useContext(GlobalStateRefContext);
    const communityContext = React.useContext(CommunityStateContext);
    let currentCommunity = communityContext.currentCommunity;
    let communityMap = communityContext.communityMap;
    let communityName =
        communityMap && currentCommunity && communityMap[currentCommunity]
            ? communityMap[currentCommunity].name
            : '';
    let navigation = useNavigation();
    let community = communityContext?.communityMap[currentCommunity];

    const [persona, setPersona] = React.useState({});

    React.useEffect(() => {
        const unsubscribe = personaContext?.persona?.pid
            ? firestore()
                  .collection('personas')
                  .doc(personaContext.persona?.pid)
                  .onSnapshot(async snap => {
                      if (snap.exists) {
                          setPersona(snap.data());
                      }
                  })
            : () => {};

        return () => unsubscribe();
    }, [personaContext?.persona?.pid]);

    let myUserID = auth().currentUser.uid;
    let personaID = personaContext?.persona?.pid;
    let hasAuth =
        personaMap[personaID]?.authors?.includes(myUserID) ||
        myUserID === 'PHobeplJLROyFlWhXPINseFVkK32';
    let feedTitle =
        personaContext?.persona?.feed === 'community'
            ? 'Forum'
            : personaContext?.persona?.feed === 'my'
            ? 'For You'
            : 'Profile';

    let alternate = React.useCallback(() => {
        if (feedTitle === 'For You' || feedTitle === 'Profile') {
            forumFeedDispatchContext.dispatch({type: 'reset'});
            transactionFeedDispatchContext.dispatch({type: 'reset'});
            communityContext.csetState({currentCommunity: 'clear'});
            personaContext.csetState({
                persona: {
                    ...vanillaPersona,
                    feed:
                        personaContext?.persona?.feed === 'my'
                            ? 'profile'
                            : 'my',
                },
            });
        } else {
            personaContext.csetState({
                persona: {
                    ...vanillaPersona,
                    feed:
                        personaContext?.persona?.feed === 'community'
                            ? ''
                            : 'community',
                },
            });
        }
    }, [
        personaContext,
        personaContext?.persona?.feed,
        personaContext?.persona,
    ]);

    const route = useRoute();
    let notMainView =
        route?.name !== 'ChatPosts' &&
        route?.name !== 'Forum' &&
        route?.name !== 'Treasury' &&
        route?.name !== 'Chat';

    if (
        !personaContext?.persona?.pid &&
        !personaContext?.persona?.feed &&
        (!currentCommunity || !communityMap[currentCommunity])
    ) {
        return (
            <FastImage
                source={images.logo}
                style={{
                    width: 120,
                    height: 30,
                    top: 1,
                    marginEnd: 18,
                }}
            />
        );
    }
    if (personaContext?.persona?.feed) {
        return (
            <TouchableOpacity
                hitSlop={{top: 30, bottom: 30, left: 10, right: 10}}
                onPress={() => alternate()}>
                <View
                    style={{
                        flexDirection: 'row',
                        top: 0,
                    }}>
                    <FastImage
                        source={{
                            uri: (
                                feedTitle === 'For You' ||
                                feedTitle === 'Profile'
                                    ? userMap[auth().currentUser.uid]
                                          ?.profileImgUrl
                                    : communityMap[currentCommunity]
                                          ?.profileImgUrl
                            )
                                ? getResizedImageUrl({
                                      origUrl:
                                          feedTitle === 'For You' ||
                                          feedTitle === 'Profile'
                                              ? userMap[auth().currentUser.uid]
                                                    ?.profileImgUrl ||
                                                images.userDefaultProfileUrl
                                              : communityMap[currentCommunity]
                                                    ?.profileImgUrl ||
                                                images.personaDefaultProfileUrl,
                                      width: size,
                                      height: size,
                                  })
                                : feedTitle === 'For You' ||
                                  feedTitle === 'Profile'
                                ? images.userDefaultProfileUrl
                                : images.personaDefaultProfileUrl,
                        }}
                        style={{
                            width: size,
                            height: size,
                            top: 4,
                            borderRadius: 8,
                            borderColor: colors.seperatorLineColor,
                            marginEnd: 15,
                        }}
                    />
                    <View
                        style={{
                            borderColor: 'red',
                            borderWidth: 0,
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            marginStart: -10,
                        }}>
                        <Text
                            style={{
                                ...baseText,
                                top: -1,
                                left: -0.5,
                                color: colors.textFaded2,
                                fontFamily:
                                    feedTitle === 'Profile'
                                        ? fonts.semibold
                                        : fonts.regular,
                                fontSize: 14,
                            }}>
                            {feedTitle === 'For You'
                                ? 'Feed'
                                : feedTitle === 'Profile'
                                ? personaContext?.persona?.feed === 'settings'
                                    ? 'User Settings'
                                    : 'Profile'
                                : communityName}
                        </Text>
                        <Text
                            style={{
                                ...baseText,
                                top: -9,
                                fontFamily: fonts.semibold,
                                fontSize: 14,
                            }}>
                            {feedTitle === 'Profile'
                                ? userMap[auth().currentUser.uid].userName
                                : feedTitle}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    if (
        personaContext?.persona?.pid &&
        !InviteStateContext.current.usePersona
    ) {
        return (
            <TouchableOpacity
                hitSlop={{top: 30, bottom: 30, left: 10, right: 10}}
                disabled={!hasAuth}
                disabled={true}
                onPress={null}>
                <View style={{flexDirection: 'row', top: 5, left: 20}}>
                    <FastImage
                        source={{
                            uri: personaContext?.persona?.profileImgUrl
                                ? getResizedImageUrl({
                                      origUrl:
                                          personaContext?.persona
                                              ?.profileImgUrl ||
                                          communityMap[currentCommunity]
                                              ?.profileImgUrl ||
                                          images.personaDefaultProfileUrl,
                                      width: size,
                                      height: size,
                                  })
                                : images.personaDefaultProfileUrl,
                        }}
                        style={{
                            width: notMainView ? size : size - 5,
                            height: notMainView ? size : size - 5,
                            top: notMainView ? 4 : -4.5,
                            borderRadius: 8,
                            marginEnd: 15,
                        }}
                    />

                    <View
                        style={{
                            borderColor: 'red',
                            borderWidth: 0,
                            justifyContent: 'center',
                            marginStart: -7,
                        }}>
                        {notMainView && (
                            <Text
                                style={{
                                    ...baseText,
                                    top: -1,
                                    left: -0.8,
                                    color: colors.textFaded2,
                                    fontSize: 14,
                                }}>
                                {route?.name === 'Settings'
                                    ? 'Channel Profile'
                                    : route?.name === 'Forum'
                                    ? 'Forum'
                                    : route?.name === 'ChatPosts'
                                    ? personaContext?.persona?.private
                                        ? 'Private Chat'
                                        : 'Chat'
                                    : route?.name === 'Add Members'
                                    ? 'Add Members'
                                    : route?.name === 'Find User'
                                    ? 'Add Member via Phone Number'
                                    : communityName}
                                <Text style={{color: colors.maxFaded}}>
                                    {route?.name === 'Forum' ||
                                        (route?.name === 'ChatPosts' &&
                                            ` ${
                                                personaContext?.persona?.authors
                                                    ?.length
                                            } member${
                                                personaContext?.persona?.authors
                                                    ?.length === 1
                                                    ? ''
                                                    : 's'
                                            }`)}
                                </Text>
                            </Text>
                        )}
                        {((personaContext && personaContext?.persona?.name) ||
                            persona?.name) && (
                            <Text
                                style={{
                                    ...baseText,
                                    top: communityName ? -6.5 : -9.5,
                                    fontFamily: fonts.semibold,
                                    fontSize: notMainView ? 14 : 18,
                                }}>
                                {persona?.name
                                    ? persona?.name
                                    : personaContext.persona.name}
                            </Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={{alignSelf: 'center', alignItems: 'center'}}
            hitSlop={{top: 30, bottom: 30, left: 10, right: 10}}
            disabled={!hasAuth}
            disabled={true}
            onPress={null}>
            <View
                style={{
                    flexDirection: 'row',
                    top: communityName.length > 20 ? 2 : 0,
                    borderColor: 'red',
                    borderWidth: 0,
                }}>
                <FastImage
                    source={{
                        uri: communityMap[currentCommunity]?.profileImgUrl
                            ? getResizedImageUrl({
                                  origUrl:
                                      communityMap[currentCommunity]
                                          ?.profileImgUrl ||
                                      images.personaDefaultProfileUrl,
                                  width: notMainView ? size : size - 5,
                                  height: notMainView ? size : size - 5,
                              })
                            : images.personaDefaultProfileUrl,
                    }}
                    style={{
                        width: notMainView ? size : size - 5,
                        height: notMainView ? size : size - 5,
                        top: notMainView
                            ? 4
                            : communityName.length > 20
                            ? 0
                            : -2,
                        borderRadius: 8,
                        marginEnd: 15,
                        borderWidth: 0,
                        borderColor: 'red',
                    }}
                />

                <View
                    style={{
                        borderColor: 'red',
                        borderWidth: 0,
                        justifyContent: 'center',
                        marginStart: -9,
                    }}>
                    {notMainView && (
                        <Text
                            style={{
                                ...baseText,
                                fontSize: 14,
                                left: -0.5,
                                top: 1,
                                color: colors.textFaded2,
                            }}>
                            {route?.name === 'Settings'
                                ? 'Community Settings'
                                : route?.name === 'Forum'
                                ? 'Forum'
                                : route?.name === 'ChatPosts'
                                ? 'Chat'
                                : route?.name === 'Add Members'
                                ? 'Add Members'
                                : route?.name === 'Find User'
                                ? 'Add Member via Phone Number'
                                : communityName}
                            <Text style={{color: colors.maxFaded}}>
                                {route?.name === 'Forum' ||
                                    (route?.name === 'ChatPosts' &&
                                        ` ${numMembers} member${
                                            numMembers === 1 ? '' : 's'
                                        }`)}
                            </Text>
                        </Text>
                    )}
                    <Text
                        style={{
                            ...baseText,
                            lineHeight: 0,
                            top: -2,
                            fontFamily: fonts.semibold,
                            fontSize: notMainView ? 14 : 18,
                            marginStart: notMainView ? null : 4,
                        }}>
                        {community?.name}
                        <Text style={{top: 0.05, color: colors.maxFaded}} />
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const TopLeftButton = ({back, openStudio, pr = 0, postHeader = false}) => {
    let navigation = useNavigation();
    const personaContext = useContext(PersonaStateRefContext);
    const communityContext = useContext(CommunityStateContext);

    const navBack = React.useCallback(() => {
        personaContext.current.csetState({
            scrollToMessageID: null,
            openToThreadID: null,
        });
        communityContext.csetState({
            openToThreadID: 'clear',
            scrollToMessageID: 'clear',
        });
        navigation && navigation.goBack();
    }, [navigation]);

    return (
        <TouchableOpacity
            hitSlop={{top: 100, bottom: 10, left: 100, right: 0}}
            onPress={back ? navBack : openStudio}
            style={{
                marginStart: 0,
                borderWidth: 0,
                borderColor: 'red',
                zIndex: 9999999999,
                paddingLeft: 16,
                paddingRight: 5 + pr,
                paddingBottom: 10,
                elevation: 999999999,
                left: -8,
                top: 0,
                zIndex: 9999999999999999999999,
                elevation: 9999999999999999,
                flexDirection: 'row',
            }}>
            <HeaderBackIcon back={true} />
            <View style={{top: 18, left: -30}}>
                <ActivityIndicator invites={true} renderIcon={false} />
            </View>
        </TouchableOpacity>
    );
};

const PostContainer = ({
    communityID,
    back = true,
    postID,
    personaID,
    parentObjPath,
}) => {
    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);
    const [post, setPost] = React.useState(vanillaPost);

    let navigation = useNavigation();

    React.useEffect(() => {
        return firestore()
            .doc(parentObjPath)
            .onSnapshot(snapshot => {
                if (snapshot.exists) {
                    // console.log(
                    //     '>>>>>>>>> setPost',
                    //     parentObjPath,
                    //     snapshot.data(),
                    // );
                    setPost(snapshot.data());
                }
            });
    }, [parentObjPath, setPost]);

    const communityContext = useContext(CommunityStateContext);
    let communityMap = communityContext?.communityMap;
    let persona =
        personaID === communityID
            ? communityMap[communityID]
            : personaMap[personaID];
    if (post === vanillaPost) {
        return <></>;
    }

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                borderColor: 'yellow',
                borderWidth: 0,
            }}>
            <TopLeftButton back={back} postHeader={true} />
            <PostHeader
                communityID={communityID}
                header={true}
                navigation={navigation}
                post={post}
                postKey={postID}
                personaName={persona?.name}
                personaKey={personaID}
                personaProfileImgUrl={persona?.profileImgUrl}
                persona={persona}
            />
        </View>
    );
};
function FloatingHeaderMemo({
    animatedHeaderOptions,
    back = false,
    onPressGoUpArrow = () => {},
    showCommunityHeader = false,
    animatedOffsetIn,
    personaID,
    postID,
    parentObjPath,
    fullHeaderVisible = true,
    contentLength,
    invertedFlatlist,
    animatedOffset,
}) {
    const route = useRoute();
    //console.log('rendering FloatingHeader @ route', route?.name);
    const scrollToTop = React.useContext(HomeScrollContextControl);
    const totalScrollToTop = React.useCallback(() => {
        // scrollToTop();
        onPressGoUpArrow();
    }, [onPressGoUpArrow]);
    const isDM = parentObjPath?.includes(SYSTEM_DM_PERSONA_ID);
    const isProjectChat =
        parentObjPath?.includes('personas') &&
        parentObjPath?.includes('chats') &&
        !isDM;

    const isCommunityChat =
        parentObjPath?.includes('communities') &&
        parentObjPath?.includes('chat') &&
        !isDM;

    const communityContext = useContext(CommunityStateContext);
    let communityMap = communityContext?.communityMap;
    let communityID = communityContext?.currentCommunity;

    const {
        current: {personaMap, userMap},
    } = useContext(GlobalStateRefContext);

    let numMembers = isCommunityChat
        ? communityMap[communityID]?.members?.filter(key => userMap[key]?.human)
              .length
        : personaMap[personaID]?.authors?.length;

    let profileImgUrl;
    let entityName;

    // const downbtnOpacityLowerBound =
    //     contentLength - 200 > 100 ? contentLength - 200 : 100;
    // const downbtnOpacityUpperBound = contentLength > 200 ? contentLength : 200;
    // const navBarOpacity = invertedFlatlist
    //     ? animatedOffset.interpolate({
    //           inputRange: [650, 700],
    //           outputRange: [0, 1],
    //           extrapolate: 'clamp',
    //       })
    //     : animatedOffset.interpolate({
    //           inputRange: [
    //               0,
    //               100,
    //               downbtnOpacityLowerBound,
    //               downbtnOpacityUpperBound,
    //           ],
    //           outputRange: [0, 1, 1, 0],
    //           extrapolate: 'clamp',
    //       });

    if (isProjectChat) {
        profileImgUrl = personaMap[personaID]?.profileImgUrl;
        entityName = personaMap[personaID]?.name;
    } else if (isCommunityChat) {
        profileImgUrl = communityMap[communityID]?.profileImgUrl;
        entityName = communityMap[communityID]?.name;
    }

    let wallet = isProjectChat
        ? personaMap && personaID && personaMap[personaID]
            ? personaMap[personaID].wallet
            : ''
        : communityMap && communityID && communityMap[communityID]
        ? communityMap[communityID].wallet
        : '';

    let vanillaWallet = {usdc: 0, eth: 0, nft: 0};

    let walletBalance;

    if (isProjectChat) {
        walletBalance =
            personaMap &&
            personaID &&
            personaMap[personaID] &&
            personaMap[personaID]?.walletBalance
                ? personaMap[personaID]?.walletBalance
                : {
                      ...vanillaWallet,
                      nft: personaMap[personaID]?.authors?.length
                          ? personaMap[personaID]?.authors?.length
                          : 0,
                  };
    } else if (isCommunityChat) {
        walletBalance =
            communityMap &&
            communityID &&
            communityMap[communityID] &&
            communityMap[communityID]?.walletBalance
                ? communityMap[communityID].walletBalance
                : {
                      ...vanillaWallet,
                      nft: communityMap[communityID]?.members?.length
                          ? communityMap[communityID]?.members?.length
                          : 0,
                  };
    } else {
        walletBalance =
            personaMap &&
            personaID &&
            personaMap[personaID] &&
            personaMap[personaID]?.walletBalance
                ? personaMap[personaID]?.walletBalance
                : {
                      ...vanillaWallet,
                      nft: personaMap[personaID]?.authors?.length
                          ? personaMap[personaID]?.authors?.length
                          : 0,
                  };
    }

    /*console.log(
        'post conditional assign walletBalance',
        walletBalance,
        isProjectChat,
        personaID,
        communityID,
    );*/

    if (!wallet) {
        wallet = '';
    }

    if (!walletBalance) {
        walletBalance = vanillaWallet;
    }

    wallet = wallet.substring(0, 5) + '...' + wallet.slice(wallet.length - 4);

    if (wallet.substring(0, 2) === '0x') {
        wallet = wallet.substring(2, wallet.length);
    }

    // move into view right before becoming non-opaque so as to not block click events
    /*const animateIntoView = (
        invertedFlatlist
            ? Animated.subtract(
                  contentLength - contentVisibleHeight,
                  animatedOffset,
              )
            : animatedOffset
    )?.interpolate({
        inputRange: [headerTitleOffset + 0.5, headerTitleOffset + 1],
        outputRange: [-3 * height, 0],
        extrapolate: 'clamp',
    });*/

    /*const shadowOpacity = (
        invertedFlatlist
            ? Animated.subtract(
                  contentLength - contentVisibleHeight,
                  animatedOffset,
              )
            : animatedOffset
    )?.interpolate({
        inputRange: [headerTitleOffset, headerTitleOffset + 2],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });*/

    const navigation = useNavigation();
    let myUserID = auth().currentUser.uid;

    const navToSettings = React.useCallback(
        () =>
            personaID
                ? personaMap[personaID].authors.includes(myUserID) ||
                  myUserID === 'PHobeplJLROyFlWhXPINseFVkK32'
                    ? navigation.navigate('Settings')
                    : null
                : navigation.navigate('Settings'),
        [navigation, myUserID, personaID],
    );

    /*console.log(
        'FloatingHeader isProjectChat',
        isProjectChat,
        'isCommunityChat',
        isCommunityChat,
    );*/

    // workaround for frozen header https://github.com/Kureev/react-native-blur/issues/317#issuecomment-700376727

    /*
      // blur gets stuck otherwise
  const workaroundValue = useRef<Animated.Value>(new Animated.Value(0));
  const workaroundStyle = useRef<AnimatedStyleSheet>({
    opacity: workaroundValue.current.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 2],
    }),
  });

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(workaroundValue.current, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(workaroundValue.current, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  */
    const [headerLayoutState, setHeaderLayoutState] = React.useState({
        marginBottom: 0,
        transform: [{translateY: 0}],
    });

    const {
        current: {setTogglePresence, setToggleStudio},
    } = useContext(GlobalStateRefContext);

    const openStudio = React.useCallback(() => {
        Keyboard.dismiss();
        setToggleStudio();
    }, [setToggleStudio]);
    const openCommunity = React.useCallback(setTogglePresence, [
        setTogglePresence,
    ]);

    /*if (parentObjPath && !isProjectChat && !isCommunityChat) {
        return <></>;
    }*/

    let isAuthor = isProjectChat
        ? personaMap[personaID]?.authors?.includes(auth().currentUser.uid)
        : isCommunityChat
        ? communityMap[communityID]?.members?.includes(auth().currentUser.uid)
        : false;

    let showUSDC = true;

    let navToPosts = React.useCallback(() => {
        navigation.navigate('Forum');
    }, [navigation]);

    const PostButton = ({route}) => {
        let personaContext = useContext(PersonaStateContext);
        let persona = personaContext?.persona;
        return (
            route?.name === 'ChatPosts' &&
            !persona?.feed && (
                <TouchableOpacity
                    hitSlop={{
                        top: 50,
                        bottom: 20,
                        left: 2,
                        right: 5,
                    }}
                    style={{paddingLeft: 8, paddingRight: 8, marginRight: 2}}
                    onPress={navToPosts}>
                    <MaterialCommunityIcons
                        name={'timeline-text'}
                        size={23}
                        color={
                            route?.name === 'Forum'
                                ? colors.postAction
                                : colors.textFaded2
                        }
                        style={{
                            top: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    />
                </TouchableOpacity>
            )
        );
    };

    // create a function to sum two numbers

    const WalletDisplay = React.useCallback(
        () => (
            <View
                style={{
                    flex: 0,
                    borderColor: 'red',
                    borderWidth: 0,
                    flexDirection: 'row',
                    justifyContent: 'center',
                }}>
                <BaseText
                    style={{
                        fontSize: 12,
                        marginStart: 14,
                        fontFamily: fonts.mono,
                        color: colors.maxFaded,
                    }}>
                    {/*false && <BaseText
                                            style={{
                                                fontSize: 12,
                                                fontFamily: fonts.mono,
                                                color: colors.maxFaded,
                                            }}>
                                            {'0x'}
                                        </BaseText>
                                        {wallet}
                                        <BaseText
                                            style={{
                                                fontSize: 12,
                                                fontFamily: fonts.mono,
                                                color: colors.timestamp,
                                            }}>
                                            {' • '}
                                        </BaseText>*/}
                    0/
                    {(walletBalance?.nft
                        ? walletBalance?.nft?.toString()
                        : numMembers) + ' '}
                    <BaseText
                        style={{
                            fontSize: 12,
                            fontFamily: fonts.mono,
                            color: colors.maxFaded,
                        }}>
                        NFT
                        {(walletBalance?.nft
                            ? walletBalance?.nft
                            : numMembers) > 1
                            ? 's'
                            : ''}
                        {walletBalance?.usdc || showUSDC ? ' • ' : ''}
                    </BaseText>
                    {walletBalance?.usdc || showUSDC
                        ? walletBalance?.usdc?.toString() + ' '
                        : ''}
                    {Boolean(walletBalance?.usdc || showUSDC) && (
                        <BaseText
                            style={{
                                fontSize: 12,
                                fontFamily: fonts.mono,
                                color: colors.maxFaded,
                            }}>
                            USDC
                            {walletBalance?.eth || walletBalance?.cc
                                ? ' • '
                                : ''}
                        </BaseText>
                    )}
                    {walletBalance?.eth
                        ? walletBalance?.eth?.toString() + ' '
                        : ''}
                    {Boolean(walletBalance?.eth) && (
                        <BaseText
                            style={{
                                fontSize: 12,
                                fontFamily: fonts.mono,
                                color: colors.maxFaded,
                            }}>
                            ETH
                            {walletBalance?.cc ? ' • ' : ''}
                        </BaseText>
                    )}
                    {walletBalance?.cc
                        ? walletBalance?.cc?.toString() + ' '
                        : ''}
                    {Boolean(walletBalance?.cc) && (
                        <BaseText
                            style={{
                                fontSize: 12,
                                fontFamily: fonts.mono,
                                color: colors.maxFaded,
                            }}>
                            CC
                        </BaseText>
                    )}
                </BaseText>
            </View>
        ),
        [walletBalance, showUSDC, numMembers],
    );

    const NavBar = React.useCallback(
        ({showText = true}) => (
            <>
                <NotchSpacer />
                <View style={{height: Platform.OS === 'android' ? 42 : 10}} />
                {route?.name !== 'Post' && route?.name !== 'PostDiscussion' ? (
                    <View
                        style={[
                            {
                                height: 50,
                                width: '100%',
                                paddingBottom: 2,
                                flexDirection: 'row',
                                marginStart: 0,
                                alignItems: 'center',
                                zIndex: 99999999,
                                elevation: 999999999,
                                borderColor: 'white',
                                borderWidth: 0,
                            },
                            headerLayoutState,
                        ]}>
                        <View
                            style={{
                                marginStart: 3,
                                top: -2,
                                borderColor: 'purple',
                                borderWidth: 0,
                            }}>
                            <TopLeftButton
                                back={back}
                                openStudio={openStudio}
                                pr={10}
                            />
                        </View>
                        {showText && (
                            <View
                                style={{
                                    marginStart: 14,
                                    top: 1.5,
                                    marginEnd: 15,
                                    flex: 1,
                                }}>
                                <ActiveHeader numMembers={numMembers} />
                            </View>
                        )}

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-end',
                                borderColor: 'orange',
                                borderWidth: 0,
                                right: 5,
                            }}>
                            {false && <PostButton route={route} />}
                            {route?.name !== 'Forum' ||
                            (route?.name !== 'ChatPosts' && isProjectChat) ? (
                                <TouchableOpacity
                                    hitSlop={{
                                        top: 50,
                                        bottom: 30,
                                        left: 5,
                                        right: 50,
                                    }}
                                    style={{
                                        borderWidth: 0,
                                        borderColor: 'purple',
                                        paddingLeft: 6.5,
                                        paddingRight: 5,
                                        zIndex: 999999999999999,
                                        elevation: 99999999999999,
                                    }}
                                    onPress={openCommunity}>
                                    <Ionicons
                                        style={{top: -1.4, paddingRight: 10}}
                                        name={'people-outline'}
                                        size={28}
                                        color={colors.navIcon}
                                    />
                                </TouchableOpacity>
                            ) : (
                                <View style={{marginLeft: 5, marginEnd: 15}}>
                                    <AddPostButton
                                        background={true}
                                        size={23}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                ) : (
                    <View
                        style={[
                            {
                                height: 50,
                                paddingBottom: 2,
                                flexDirection: 'row',
                                paddingTop: 2,
                                marginStart: 10,
                                alignItems: 'center',
                                zIndex: 999999999999,
                                elevation: 999999999999,
                                borderColor: 'white',
                                borderWidth: 0,
                            },
                            headerLayoutState,
                        ]}>
                        <PostContainer
                            communityID={communityID}
                            personaID={personaID}
                            postID={postID}
                            parentObjPath={parentObjPath}
                        />
                    </View>
                )}
            </>
        ),
        [
            personaID,
            navigation,
            isAuthor,
            navToSettings,
            parentObjPath,
            route,
            numMembers,
            openStudio,
            communityID,
            postID,
        ],
    );

    return (
        <TouchableWithoutFeedback
            style={{
                borderColor: 'red',
                borderWidth: 0,
            }}
            disabled={false}
            onPress={Platform.OS === 'android' ? null : onPressGoUpArrow}>
            {!showCommunityHeader ? (
                Platform.OS === 'android' ? (
                    <Animated.View
                        blurType={'chromeMaterialDark'}
                        blurRadius={11}
                        blurAmount={1}
                        reducedTransparencyFallbackColor="black"
                        style={{
                            borderColor: colors.red,
                            height:
                                navigation?.state?.route?.name === 'Profile'
                                    ? 50
                                    : navigation?.state?.route?.name === 'Chat'
                                    ? 118
                                    : parentObjPath
                                    ? 70 + heightOffset
                                    : 128,
                            borderTopWidth: 0,
                            opacity: 1,
                            flexDirection: 'column',
                            ...Styles.floatingHeader,
                            zIndex: 99999,
                            elevation: 99999,
                            borderWidth: 0,
                        }}>
                        <View style={{top: -10}}>
                            <NavBar />
                        </View>
                    </Animated.View>
                ) : (
                    <AnimatedBlurView
                        blurType={'chromeMaterialDark'}
                        blurRadius={11}
                        blurAmount={1}
                        reducedTransparencyFallbackColor="black"
                        style={{
                            borderColor: colors.red,
                            height:
                                navigation?.state?.route?.name === 'Profile'
                                    ? 50
                                    : navigation?.state?.route?.name === 'Chat'
                                    ? 118
                                    : parentObjPath
                                    ? 70 + heightOffset
                                    : 128,
                            borderTopWidth: 0,
                            opacity: 1,
                            flexDirection: 'column',
                            ...Styles.floatingHeader,
                            zIndex: 99999,
                            elevation: 99999,
                            borderWidth: 0,
                        }}>
                        <NavBar />
                    </AnimatedBlurView>
                )
            ) : (
                <View
                    style={{
                        borderColor: colors.red,
                        height:
                            navigation?.state?.route?.name === 'Profile'
                                ? 50
                                : navigation?.state?.route?.name === 'Chat'
                                ? 118
                                : parentObjPath
                                ? 70 + heightOffset
                                : 128,
                        borderTopWidth: 0,
                        opacity: 1,
                        flexDirection: 'column',
                        position: 'absolute',
                        width: '100%',
                        zIndex: 99999999999999,
                        elevation: 9999999999999,
                        borderWidth: 0,
                    }}>
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            borderBottomWidth: 1,
                            borderColor: 'red',
                            height: 100,
                        }}>
                        <CommunityHeader
                            showCreatePost={false}
                            communityID={communityID}
                            personaID={personaID}
                            heightMod={Platform.OS === 'ios' ? -100 : -95}
                            NavBar={NavBar}
                            fullHeaderVisible={fullHeaderVisible}
                            animatedHeaderOptions={animatedHeaderOptions}
                        />
                    </View>
                    <View
                        style={{
                            position: 'absolute',
                            zIndex: 999999999,
                            elevation: 999999999,
                            top: Platform.OS === 'ios' ? 20 : 40,
                            flex: 0,
                        }}>
                        <NotchSpacer />
                        <TopLeftButton
                            back={back}
                            openStudio={openStudio}
                            pr={10}
                        />
                    </View>
                    <View
                        style={{
                            alignSelf: 'flex-end',
                            zIndex: 999999999,
                            elevation: 999999999,
                            top: Platform.OS === 'ios' ? 20 : 40,
                        }}>
                        <NotchSpacer />
                        <TouchableOpacity
                            hitSlop={{
                                top: 50,
                                bottom: 30,
                                left: 20,
                                right: 50,
                            }}
                            style={{
                                paddingLeft: 6.5,
                                paddingRight: 5,
                            }}
                            onPress={openCommunity}>
                            <Ionicons
                                style={{top: -1.4, paddingRight: 10}}
                                name={'people-outline'}
                                size={28}
                                color={colors.navIcon}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </TouchableWithoutFeedback>
    );
}

export const Styles = StyleSheet.create({
    floatingHeader: {
        position: 'absolute',
        width: '100%',
        borderColor: colors.timeline,
        borderBottomWidth: 0.4,
        zIndex: 99999999999999,
        elevation: 9999999999999,
    },
    upperTimeline: {
        top: 47,
        ...palette.timeline.line,
        marginLeft:
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth,
        position: 'absolute',
        height: 6,
        backgroundColor: colors.timeline,
    },
});
