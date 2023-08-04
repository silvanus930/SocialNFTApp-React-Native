import React, {useEffect, useState, useContext, memo} from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PersonaStateContext} from 'state/PersonaState';

import {determineUserRights, isSuperAdmin} from 'utils/helpers';

import DefaultCommunityButton from './components/DefaultCommunityButton';
import ToggleOpenButton from './components/ToggleOpenButton';
import TogglePrivateButton from './components/TogglePrivateButton';
import AddAdminButton from './components/AddAdminButton';
import DeleteButton from './components/DeleteButton';
import ToggleChatPrivacyButton from './components/ToggleChatPrivacyButton';
import ToggleCommentPrivacyButton from './components/ToggleCommentPrivacyButton';
import ToggleAudioPrivacyButton from './components/ToggleAudioPrivacyButton';
import ToggleMuteChatNotificationsButton from './components/ToggleMuteChatNotificationsButton';

import {propsAreEqual} from 'utils/propsAreEqual';

const ProjectActions = ({persona}) => {
    const communityContext = useContext(CommunityStateContext);
    const personaContext = useContext(PersonaStateContext);
    const {
        current: {personaMap, user},
    } = useContext(GlobalStateRefContext);
    const communityID = communityContext.currentCommunity;
    const isCommunity = !persona?.authors?.length;
    const myUserID = auth().currentUser.uid;
    const personaKey = personaContext?.persona?.pid;
    const communityMap = communityContext?.communityMap;

    const personaID = persona?.pid;

    // const hasAuth = personaID
    //     ? personaMap[personaID]?.authors?.includes(myUserID) ||
    //       myUserID === 'PHobeplJLROyFlWhXPINseFVkK32'
    //     : communityMap[communityID]?.members?.includes(myUserID) ||
    //       myUserID === 'PHobeplJLROyFlWhXPINseFVkK32';

    const hasAuth = personaID
        ? determineUserRights(null, personaID, user, 'editChannel')
        : determineUserRights(communityID, null, user, 'editChannel');

    const superAdmin = isSuperAdmin(user);

    const [isDefault, setIsDefault] = useState(true);    

    useEffect(() => {
        (async function () {
            const userSnap = await firestore()
                .collection('users')
                .doc(myUserID)
                .get();
            setIsDefault(userSnap.get('defaultCommunityID') !== communityID);
            console.log(userSnap.get('defaultCommunityID'));
        })();
    }, [communityID, myUserID]);

    return (
        <>
            {superAdmin && (
                <>
                    <AddAdminButton persona={persona}/>
                </>
            )}
            {hasAuth && (
                <>
                    {hasAuth && isDefault && !personaKey && (
                        <DefaultCommunityButton setIsDefault={setIsDefault} />
                    )}
                    <ToggleOpenButton persona={persona} />
                    <TogglePrivateButton persona={persona} />
                    <DeleteButton personaID={persona?.pid} />
                </>
            )}
            {!isCommunity && hasAuth && (
                <>
                    <ToggleChatPrivacyButton personaID={persona?.pid} />
                    <ToggleCommentPrivacyButton personaID={persona?.pid} />
                    <ToggleAudioPrivacyButton personaID={persona?.pid} />
                </>
            )}
            {hasAuth && <ToggleMuteChatNotificationsButton persona={persona} />}
        </>
    );
};

export default memo(ProjectActions, propsAreEqual);
