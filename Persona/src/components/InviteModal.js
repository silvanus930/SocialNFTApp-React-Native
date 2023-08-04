import React, {useEffect} from 'react';

import isEqual from 'lodash.isequal';
import {askContactsPermission} from 'utils/permissions';

import InviteScreen from 'components/InviteScreen';
import {InviteModalStateContext} from 'state/InviteModalState';
import BottomSheet from './BottomSheet';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default function InviteModalProfiler(props) {
    return (
        <React.Profiler
            id={'InviteModal'}
            onRender={(id, phase, actualDuration) => {
                if (actualDuration > 2) {
                    //console.log('======> (Profiler)', id, phase, actualDuration);
                }
            }}>
            <InviteModalMemo {...props} />
        </React.Profiler>
    );
}

const InviteModalMemo = React.memo(InviteModal, propsAreEqual);
function InviteModal({navigation}) {
    const {toggleModalVisibility, persona, authors, showToggle} =
        React.useContext(InviteModalStateContext);
    console.log('rendering InviteModal', authors, persona);

    useEffect(() => {
        if (showToggle) {
            askContactsPermission();
        }
    }, [showToggle]);

    return (
        <BottomSheet
            toggleModalVisibility={toggleModalVisibility}
            showToggle={showToggle}>
            <InviteScreen
                authors={authors}
                persona={persona}
                navigation={navigation}
                transparentBackground={true}
            />
        </BottomSheet>
    );
}
