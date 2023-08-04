import React, {
    useContext,
    useRef,
    useEffect,
    useMemo,
    useCallback,
} from 'react';
import {
    Platform,
    NativeModules,
    NativeEventEmitter,
    PixelRatio,
    UIManager,
    findNodeHandle,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';

import DiscussionEngine from 'components/DiscussionEngine';
import MyMapView from 'components/MapView.js';
import {MyViewManager} from 'components/MyViewManager';

import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';
import {GlobalStateContext} from 'state/GlobalState';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';

const TriggeredEvents = new NativeEventEmitter(NativeModules.TriggerManager);

const createFragment = viewId =>
    UIManager.dispatchViewManagerCommand(
        viewId,
        UIManager.MyViewManager.Commands.create.toString(),
        [viewId],
    );

const ChatScreen = props => {
    const navigation = useNavigation();
    const communityContext = useContext(CommunityStateContext);
    let communityID = communityContext.currentCommunity;

    const {useNativeModuleChat} = useContext(GlobalStateContext);

    const personaContext = useContext(PersonaStateContext);
    let personaKey = personaContext?.persona?.pid;

    let chatDocPath = personaKey
        ? `personas/${personaKey}/chats/all`
        : `communities/${communityID}/chat/all`;

    let openToThreadID = personaKey
        ? personaContext?.openToThreadID || null
        : communityContext?.openToThreadID || null;
    let scrollToMessageID = personaKey
        ? personaContext?.scrollToMessageID || null
        : communityContext?.scrollToMessageID || null;

    let myUserID = auth().currentUser.uid;

    /** ==== Temporary prevent this block for avoid needless calls to the server ====
    useEffect(() => {
        const doStuff = async () => {
            let id = personaKey ? personaKey : communityID;

            let params = personaKey
                ? JSON.stringify({
                      personaid: id,
                  })
                : JSON.stringify({
                      communityid: id,
                  });

            const token = await auth().currentUser.getIdToken(true);

            const options = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: params,
            };

            let server = 'api.persona.nyc';
            //let server = 'localhost:8080';
            let URL = `https://${server}/ensureAccessContract${
                personaKey ? '' : 'Community'
            }/${id}`;
            const response = await fetch(URL, options);
            let json = await response?.json();
            console.log('---****json: ', JSON.stringify(json));
        };

        doStuff();
    }, [communityID, personaKey]);
    */

    useEffect(() => {
        const chatAttributesData = {
            communityID: communityID,
            personaKey: personaKey,
            chatDocPath: chatDocPath,
        };
        if (Platform.OS === 'ios' && useNativeModuleChat) {
            const swiftUserManager = NativeModules.UserManager;
            swiftUserManager.chatScreenRendered(chatAttributesData);
        }
    }, [chatDocPath, communityID, personaKey, useNativeModuleChat]);

    const headerProps = useMemo(
        () => ({
            personaID: personaKey,
            communityID: communityID,
        }),
        [communityID, personaKey],
    );

    const profileModalContextRef = useContext(ProfileModalStateRefContext);
    const navToProfileFromAvatarTap = useCallback(
        userId => {
            profileModalContextRef.current.csetState({
                userID: userId,
                showToggle: true,
            });
        },
        [profileModalContextRef],
    );

    const discussionPropsForIOS = useMemo(
        () => ({
            header: false,
            hideFirstTimelineSegment: true,
            parentObjPath: {chatDocPath},
            headerProps: {headerProps},
            openToThreadID: {openToThreadID},
            scrollToMessageID: {scrollToMessageID},
            userID: {myUserID},
        }),
        [chatDocPath, headerProps, myUserID, openToThreadID, scrollToMessageID],
    );

    const MainChatComponent = useCallback(() => {
        if (Platform.OS === 'ios' && useNativeModuleChat) {
            return (
                <IOSNativeChatEngine
                    discussionPropsForIOS={discussionPropsForIOS}
                    navToProfileFromAvatarTap={navToProfileFromAvatarTap}
                />
            );
        } else if (Platform.OS === 'android') {
            return <AndroidNativeChatEngine />;
        } else {
            return (
                <DiscussionEngine
                    header={false}
                    renderFromTop={personaContext?.openFromTop}
                    hideFirstTimelineSegment={true}
                    parentObjPath={chatDocPath}
                    collectionName={'messages'}
                    discussionTitle={'all'}
                    headerType={'activityChat'}
                    headerProps={headerProps}
                    navigation={navigation}
                    showSeenIndicators={true}
                    openToThreadID={openToThreadID}
                    scrollToMessageID={scrollToMessageID}
                    animatedHeaderOptions={
                        props.route.params.animatedHeaderOptions
                    }
                />
            );
        }
    }, [
        useNativeModuleChat,
        discussionPropsForIOS,
        navToProfileFromAvatarTap,
        personaContext?.openFromTop,
        chatDocPath,
        headerProps,
        navigation,
        openToThreadID,
        scrollToMessageID,
        props.route.params.animatedHeaderOptions,
    ]);
    return <MainChatComponent />;
};

const AndroidNativeChatEngine = () => {
    const ref = useRef(null);
    useEffect(() => {
        if (Platform.OS === 'android') {
            const viewId = findNodeHandle(ref.current);
            createFragment(viewId);
        }
    }, []);
    return (
        <>
            <MyViewManager
                style={{
                    height: PixelRatio.getPixelSizeForLayoutSize(700),
                    width: PixelRatio.getPixelSizeForLayoutSize(1080),
                }}
                ref={ref}
            />
        </>
    );
};

const IOSNativeChatEngine = props => {
    const {navToProfileFromAvatarTap, discussionPropsForIOS} = props;
    TriggeredEvents.removeAllListeners('onTriggerReactNative');
    TriggeredEvents.addListener('onTriggerReactNative', result =>
        navToProfileFromAvatarTap(result),
    );
    return (
        <>
            <MyMapView
                style={{flex: 1}}
                discussionProps={discussionPropsForIOS}
            />
        </>
    );
};

export default ChatScreen;
