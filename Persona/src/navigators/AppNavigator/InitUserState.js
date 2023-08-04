import React from 'react';
import messaging from '@react-native-firebase/messaging';
import ActivityIndicatorState from 'state/ActivityIndicatorState';
import HomeScrollState from 'components/HomeScrollContext';
import FeedState, {FeedMenuState} from 'state/FeedStateContext';
import ForumFeedState from 'state/ForumFeedStateContext';
import FollowFeedState, {
    FollowFeedMenuState,
} from 'state/FollowFeedStateContext';
import {DrawerState} from 'state/DrawerState';
import FullScreenMediaState from 'state/FullScreenMediaState';
import {GlobalStateContext} from 'state/GlobalState';
import PersonaCreateState from 'state/PersonaCreateState';
import PersonaCreateStateRef from 'state/PersonaCreateStateRef';
import PersonaState from 'state/PersonaState';
import PostState from 'state/PostState';
import PostStateRef from 'state/PostStateRef';
import InviteState from 'state/InviteState';
import MessageModalState from 'state/MessageModalState';
import MessageModalStateRef from 'state/MessageModalStateRef';
import IdentityModalState from 'state/IdentityModalState';
import IdentityModalStateRef from 'state/IdentityModalStateRef';
import CreatePostModalState from 'state/CreatePostModalState';
import CreatePostModalStateRef from 'state/CreatePostModalStateRef';
import ProfileModalState from 'state/ProfileModalState';
import ProfileModalStateRef from 'state/ProfileModalStateRef';
import OptionsModalState from 'state/OptionsModalState';
import OptionsModalStateRef from 'state/OptionsModalStateRef';
import NFTModalState from 'state/NFTModalState';
import NFTModalStateRef from 'state/NFTModalStateRef';
import InviteModalState from 'state/InviteModalState';
import InviteModalStateRef from 'state/InviteModalStateRef';
import RemixRenderState from 'state/RemixRenderState';
import RemixRenderStateRef from 'state/RemixRenderStateRef';
import PresenceState from 'state/PresenceState';
import {CommunityStateContext} from 'state/CommunityState';
import ActivityShellState from 'state/ActivityShellState';
import TalkingState, {TalkingStateContext} from 'state/TalkingState';
import TalkingStateRef from 'state/TalkingStateRef';
import GlobalFlags from './GlobalFlags';
import requestPermissions, {checkAllPermissions} from 'utils/permissions';
import Loading from 'components/Loading';
import PersonaStateRef from 'state/PersonaStateRef';
import PresenceStateRef from 'state/PresenceStateRef';
import ActivityShellStateRef from 'state/ActivityShellStateRef';
import UserAutocompleteState from 'state/UserAutocompleteState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {ConnectionProvider} from 'state/ConnectionState';
import {
    addPersonaListener,
    addUserListListener,
    addCommunityListener,
} from 'actions/listeners';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';

export default React.memo(InitUserState, () => true);
function InitUserState() {
    const {
        user,
        isMessagingEnabled,
        setIsMessagingEnabled,
        csetState,
        userMap,
        personaMap,
    } = React.useContext(GlobalStateContext);

    const {
        communityMap,
        setCommunityMap,
        currentCommunity,
        csetState: communitySetState,
    } = React.useContext(CommunityStateContext);

    React.useEffect(() => {
        const unsubscribePersonasListener = addPersonaListener(csetState, user);

        return () => {
            unsubscribePersonasListener();
        };
    }, [csetState, user.uid]);

    React.useEffect(() => {
        async function requestUserPermission() {
            const authStatus = await messaging().requestPermission();
            const isEnabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!isMessagingEnabled) {
                setIsMessagingEnabled(isEnabled);
            }

            /*if (isEnabled) {
        console.log('Authorization status:', authStatus);
      }*/
        }
        checkAllPermissions();
        requestPermissions();
        requestUserPermission();
    }, [isMessagingEnabled, setIsMessagingEnabled]);

    React.useEffect(() => {
        const unsubscribeUserListListener = addUserListListener(csetState);

        return () => {
            unsubscribeUserListListener();

            csetState({
                busyAuthStateChange: false,
            });
        };
    }, [csetState, user.uid]);

    React.useEffect(() => {
        const unsubscribeCommunityListener =
            addCommunityListener(setCommunityMap);
        return () => unsubscribeCommunityListener();
    }, [communitySetState, setCommunityMap, user.defaultCommunityID]);

    React.useEffect(() => {
        if (!currentCommunity && communityMap) {
            const communityID = user.defaultCommunityID ?? 'persona';
            communitySetState({
                currentCommunity: communityID,
            });
        }
    }, [
        communityMap,
        communitySetState,
        currentCommunity,
        user.defaultCommunityID,
    ]);

    return !Object.keys(communityMap).length ||
        !Object.keys(userMap).length ||
        !Object.keys(personaMap).length ? (
        <Loading />
    ) : (
        <AppWithState user={user} />
    );
}

const AppWithState = React.memo(AppWithStateMemo, () => true);
function AppWithStateMemo({user}) {
    return (
        <FullScreenMediaState>
            <FeedMenuState>
                <FollowFeedMenuState>
                    <FeedState>
                        <FollowFeedState>
                            <DrawerState>
                                <HomeScrollState>
                                    <ConnectionProvider user={user}>
                                        <ActivityIndicatorState>
                                            <ActivityShellState>
                                                <ActivityShellStateRef>
                                                    <PresenceState>
                                                        <PresenceStateRef>
                                                            <PersonaCreateState>
                                                                <PersonaCreateStateRef>
                                                                    <PostState>
                                                                        <PostStateRef>
                                                                            <InviteState>
                                                                                <UserAutocompleteState>
                                                                                    <RemixRenderState>
                                                                                        <RemixRenderStateRef>
                                                                                            <MessageModalState>
                                                                                                <MessageModalStateRef>
                                                                                                    <IdentityModalState>
                                                                                                        <IdentityModalStateRef>
                                                                                                            <ProfileModalState>
                                                                                                                <ProfileModalStateRef>
                                                                                                                    <OptionsModalState>
                                                                                                                        <OptionsModalStateRef>
                                                                                                                            <NFTModalState>
                                                                                                                                <NFTModalStateRef>
                                                                                                                                    <InviteModalState>
                                                                                                                                        <InviteModalStateRef>
                                                                                                                                            <TalkingState>
                                                                                                                                                <TalkingStateRef>
                                                                                                                                                    <CreatePostModalState>
                                                                                                                                                        <CreatePostModalStateRef>
                                                                                                                                                            <PersonaState>
                                                                                                                                                                <PersonaStateRef>
                                                                                                                                                                    <ForumFeedState>
                                                                                                                                                                        <BottomSheetModalProvider>
                                                                                                                                                                            <GlobalFlags />
                                                                                                                                                                        </BottomSheetModalProvider>
                                                                                                                                                                    </ForumFeedState>
                                                                                                                                                                </PersonaStateRef>
                                                                                                                                                            </PersonaState>
                                                                                                                                                        </CreatePostModalStateRef>
                                                                                                                                                    </CreatePostModalState>
                                                                                                                                                </TalkingStateRef>
                                                                                                                                            </TalkingState>
                                                                                                                                        </InviteModalStateRef>
                                                                                                                                    </InviteModalState>
                                                                                                                                </NFTModalStateRef>
                                                                                                                            </NFTModalState>
                                                                                                                        </OptionsModalStateRef>
                                                                                                                    </OptionsModalState>
                                                                                                                </ProfileModalStateRef>
                                                                                                            </ProfileModalState>
                                                                                                        </IdentityModalStateRef>
                                                                                                    </IdentityModalState>
                                                                                                </MessageModalStateRef>
                                                                                            </MessageModalState>
                                                                                        </RemixRenderStateRef>
                                                                                    </RemixRenderState>
                                                                                </UserAutocompleteState>
                                                                            </InviteState>
                                                                        </PostStateRef>
                                                                    </PostState>
                                                                </PersonaCreateStateRef>
                                                            </PersonaCreateState>
                                                        </PresenceStateRef>
                                                    </PresenceState>
                                                </ActivityShellStateRef>
                                            </ActivityShellState>
                                        </ActivityIndicatorState>
                                    </ConnectionProvider>
                                </HomeScrollState>
                            </DrawerState>
                        </FollowFeedState>
                    </FeedState>
                </FollowFeedMenuState>
            </FeedMenuState>
        </FullScreenMediaState>
    );
}
