import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {CommunityStateContext} from 'state/CommunityState';
import {ForumFeedDispatchContext} from 'state/ForumFeedStateContext';
import {FeedDispatchContext} from 'state/FeedStateContext';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {MessageModalStateRefContext} from 'state/MessageModalStateRef';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {vanillaPersona} from 'state/PersonaState';
import useDebounce from 'hooks/useDebounce';
import * as RootNavigator from 'navigators/RootNavigator';

export default function useNavPushDebounce(screen, params, deps) {
    const navigation = useNavigation();
    // console.log('nav', navigation);
    return useDebounce(
        () => navigation.push(screen, params),
        deps.concat([navigation]),
    );
}

export function useNavDebounce(screen, params, deps) {
    console.log('useNavDebounce', params);
    return useDebounce(
        () => navigation.navigate(screen, params),
        deps.concat([navigation]),
    );
}

export function useSwitchCommunity() {
    const communityContext = React.useContext(CommunityStateContext);
    const forumFeedDispatchContext = React.useContext(ForumFeedDispatchContext);
    const transactionFeedDispatchContext =
        React.useContext(FeedDispatchContext);

    return ({communityID, openToThreadID, scrollToMessageID}) => {
        forumFeedDispatchContext.dispatch({type: 'reset'});
        transactionFeedDispatchContext.dispatch({type: 'reset'});

        communityContext.csetState({
            currentCommunity: communityID,
            openToThreadID: openToThreadID ?? 'clear',
            scrollToMessageID: scrollToMessageID ?? 'clear',
        });
    };
}

export function useResetPersona() {
    const personaContext = React.useContext(PersonaStateRefContext);
    return () => {
        personaContext.current.restoreVanilla();
    };
}

export function useSwitchPersona() {
    const globalStateRefContext = React.useContext(GlobalStateRefContext);
    const communityContext = React.useContext(CommunityStateContext);
    const personaContext = React.useContext(PersonaStateRefContext);
    const forumFeedDispatchContext = React.useContext(ForumFeedDispatchContext);
    const transactionFeedDispatchContext =
        React.useContext(FeedDispatchContext);

    return ({
        personaKey,
        openToThreadID,
        threadID,
        communityID,
        scrollToMessageID,
    }) => {
        const persona = globalStateRefContext.current.personaMap[personaKey];
        personaContext.current.csetState({
            new: false,
            edit: true,
            posted: false,
            openFromTop: false,
            persona: Object.assign({}, persona),
            personaID: personaKey,
            pid: personaKey,
            openToThreadID: openToThreadID ?? null,
            scrollToMessageID: scrollToMessageID ?? null,
            threadID: threadID ?? null,
        });
        forumFeedDispatchContext.dispatch({type: 'reset'});
        transactionFeedDispatchContext.dispatch({type: 'reset'});
        communityContext.csetState({
            currentCommunity: communityID ?? persona?.communityID,
            openToThreadID: 'clear',
            scrollToMessageID: 'clear',
        });
    };
}

export function useNavToPersona(navigation) {
    const switchPersona = useSwitchPersona();
    return useDebounce(
        personaKey => {
            switchPersona({personaKey});
            navigation.navigate('Persona', {
                personaKey: personaKey,
            });
        },
        [navigation],
    );
}

function navToHomeTab(navigation, tabName, params) {
    // const {openToThreadID, scrollToMessageID} = params;
    navigation.navigate('Persona', {
        screen: 'ChatPosts',
        ...params,
        params: {
            screen: tabName,
            // scrollToMessageID,
            // openToThreadID,
        },
    });
}

function useNavToPersonaHomeTab(navigation, tabName) {
    const switchPersona = useSwitchPersona();
    const switchCommunity = useSwitchCommunity();
    return useDebounce(
        params => {
            const {
                personaKey,
                communityID,
                openToThreadID,
                threadID,
                highlightCommentKey,
            } = params;
            switchPersona({
                personaKey,
                personaID: personaKey,
                pid: personaKey,
                threadID: threadID ?? null,
                scrollToMessageID: highlightCommentKey ?? null,
                openToThreadID: openToThreadID ?? null,
            });
            switchCommunity(communityID);
            navToHomeTab(navigation, tabName, {
                ...params,
            });
        },
        [navigation],
    );
}

function useNavToCommunityHomeTab(navigation, tabName) {
    const resetPersona = useResetPersona();
    const switchCommunity = useSwitchCommunity();
    return useDebounce(
        params => {
            const {communityID, openToThreadID, highlightCommentKey} = params;
            switchCommunity({
                communityID,
                openToThreadID,
                scrollToMessageID: highlightCommentKey,
            });
            resetPersona();
            navToHomeTab(navigation, tabName, {
                ...params,
            });
        },
        [navigation],
    );
}

export function useNavToPostDiscussion(navigation) {
    const switchPersona = useSwitchPersona();
    return useDebounce(
        params => {
            const {
                personaName,
                personaKey,
                postKey,
                highlightCommentKey,
                personaProfileImgUrl,
                openToThreadID,
            } = params;
            switchPersona({
                personaKey,
                openToThreadID: openToThreadID ?? null,
                scrollToMessageID: highlightCommentKey ?? null,
            });

            const currentRoute =
                RootNavigator?.navigationRef?.current?.getCurrentRoute();

            if (currentRoute?.name === 'PostDiscussion') {
                navigation.goBack();
            }

            // nav on next tick
            setTimeout(() => {
                navigation.navigate('PostDiscussion', {
                    personaName,
                    personaKey,
                    postKey,
                    personaProfileImgUrl,
                });
            }, 0);
        },
        [navigation],
    );
}

export function useNavToCommunityPostDiscussion(navigation) {
    const switchCommunity = useSwitchCommunity();
    const resetPersona = useResetPersona();
    return useDebounce(
        params => {
            const {communityID, postKey, highlightCommentKey, openToThreadID} =
                params;
            resetPersona();
            switchCommunity({
                communityID,
                openToThreadID,
                scrollToMessageID: highlightCommentKey,
            });
            navigation.navigate('PostDiscussion', {
                personaKey: communityID,
                communityID,
                postKey,
            });
        },
        [navigation],
    );
}

export function useNavToMyProfile(navigation) {
    const switchCommunity = useSwitchCommunity(navigation);
    const personaContext = React.useContext(PersonaStateRefContext);
    return useDebounce(() => {
        navigation.navigate('Profile');
    }, []);
}

export function useNavToPersonaChat(navigation) {
    return useNavToPersonaHomeTab(navigation, 'Chat');
}

export function useNavToCommunityChat(navigation) {
    return useNavToCommunityHomeTab(navigation, 'Chat');
}

export function useNavToCommunity(navigation) {
    return useNavToCommunityChat(navigation);
}

export function useNavToPersonaTransfers(navigation) {
    return useNavToPersonaHomeTab(navigation, 'Transfers');
}

export function useNavToCommunityTransfers(navigation) {
    return useNavToCommunityHomeTab(navigation, 'Transfers');
}

export function useNavToDMChat(navigation) {
    const messageModalContextRef = React.useContext(
        MessageModalStateRefContext,
    );
    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );

    return (chatID, userToDM, scrollToMessageID, openToThreadID) => {
        navigation?.navigate('DirectMessages', {
            screen: 'DM_Home',
            initial: false,
            params: {
                chatID: chatID,
                userToDM: userToDM,
                scrollToMessageID: scrollToMessageID ?? null,
                openToThreadID: openToThreadID ?? null,
            },
        });
    };
}
