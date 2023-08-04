import React from 'react';
import isEqual from 'lodash.isequal';
import {ProfilePublicScreen} from 'screens/Profile';
import {ProfileModalStateContext} from 'state/ProfileModalState';
import BottomSheet from './BottomSheet';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default function DMPulloutProfiler(props) {
    return (
        <React.Profiler
            id={'ProfileModal'}
            onRender={(id, phase, actualDuration) => {
                if (actualDuration > 2) {
                    //console.log('======> (Profiler)', id, phase, actualDuration);
                }
            }}>
            <ProfileModalMemo {...props} />
        </React.Profiler>
    );
}

const ProfileModalMemo = React.memo(ProfileModal, propsAreEqual);
function ProfileModal({navigation}) {
    const {toggleModalVisibility, userID, showToggle} = React.useContext(
        ProfileModalStateContext,
    );

    let personaVoice = userID.startsWith('PERSONA');
    let personaID = personaVoice ? userID.split('::')[1] : '';
    return (
        <BottomSheet
            toggleModalVisibility={toggleModalVisibility}
            showToggle={showToggle}
            snapPoints={['90%']}>
            <ProfilePublicScreen
                showHeader={false}
                navigation={navigation}
                transparentBackground={true}
                userID={personaVoice ? personaID : userID}
                personaVoice={personaVoice}
            />
        </BottomSheet>
    );
}
