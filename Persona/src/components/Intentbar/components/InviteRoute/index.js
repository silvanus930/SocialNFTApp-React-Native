import React from 'react';
import UserInvitesScreen from 'components/UserInvitesScreen';
import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';

function InviteRouteMemo() {
    const communityContext = React.useContext(CommunityStateContext);
    const personaContext = React.useContext(PersonaStateContext);
    const destinationId =
        personaContext?.persona?.pid || communityContext.currentCommunity;

    return <UserInvitesScreen destinationId={destinationId} />;
}

export default InviteRouteMemo;
