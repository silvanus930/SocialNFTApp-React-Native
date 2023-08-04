import auth from '@react-native-firebase/auth';
import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import Animated, {Layout} from 'react-native-reanimated';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import {CommunityStateContext} from 'state/CommunityState';
import {InviteModalStateRefContext} from 'state/InviteModalStateRef';
import {PersonaStateContext} from 'state/PersonaState';
import {Text} from 'react-native';
import colors from 'resources/colors';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {determineUserRights, selectLayout} from 'utils/helpers';

export default function InviteButton({
    style = {},
    small = false,
    community,
    personaID,
}) {
    const communityContext = React.useContext(CommunityStateContext);
    let communityMap = communityContext?.communityMap;
    let currentCommunity = communityContext?.currentCommunity;
    const personaContext = React.useContext(PersonaStateContext);
    const inviteModalContextRef = React.useContext(InviteModalStateRefContext);

    const {
        current: {userMap, personaMap, user, setTogglePresence},
    } = React.useContext(GlobalStateRefContext);
    //console.log('rendering StudioPersonaListWrapped');

    const openRightDrawer = React.useCallback(setTogglePresence, [
        setTogglePresence,
    ]);
    const openModal = () => {
        inviteModalContextRef.current.csetState({
            showToggle: true,
            authors: communityMap[currentCommunity].members,
            persona: communityMap[currentCommunity],
            usePersona: false,
        });
    };

    const personaKey = personaContext?.persona?.pid;
    let hasInviteAuth = determineUserRights(currentCommunity, null, user, 'invite');

    if (!hasInviteAuth) {
        return (
            <></>
        );
    }
    return (
        <TouchableOpacity onPress={openModal}>
            <Animated.View
                blurType={'chromeMaterialDark'}
                blurRadius={11}
                blurAmount={1}
                reducedTransparencyFallbackColor="black"
                style={{
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingLeft: small ? 8 : 10,
                    paddingRight: small ? 8 : 10,
                    padding: small ? 7 : 5,
                    backgroundColor: '#3F628A',
                    borderRadius: 6,
                }}
                layout={selectLayout(Layout)}>
                <Animated.Text
                    style={{
                        ...baseText,
                        fontSize: small ? 16 : 14,
                        color: 'white',
                        fontFamily: fonts.semibold,
                        padding: small ? 0 : 2,
                        fontWeight: '500',
                    }}
                    layout={selectLayout(Layout)}>
                    + Invite members
                </Animated.Text>
            </Animated.View>
        </TouchableOpacity>
    );
}
