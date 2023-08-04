import React from 'react';
import isEqual from 'lodash.isequal';
import CreatePostScreen from 'components/CreatePostScreen';
import {CreatePostModalStateContext} from 'state/CreatePostModalState';
import BottomSheet from './BottomSheet';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default function CreatePostModalProfiler(props) {
    return (
        <React.Profiler
            id={'CreatePostModal'}
            onRender={(id, phase, actualDuration) => {
                if (actualDuration > 2) {
                    //console.log('======> (Profiler)', id, phase, actualDuration);
                }
            }}>
            <CreatePostModalMemo {...props} />
        </React.Profiler>
    );
}

const CreatePostModalMemo = React.memo(CreatePostModal, propsAreEqual);
function CreatePostModal({}) {
    const {toggleModalVisibility, persona, authors, showToggle} =
        React.useContext(CreatePostModalStateContext);
    const {communityID, personaID} = React.useContext(
        CreatePostModalStateContext,
    );
    console.log('rendering CreatePostModal', authors, persona);

    return (
        <BottomSheet
            style={{
                height: '80%',
            }}
            windowScale={1}
            showHandle={false}
            scrollable={false}
            snapPoints={['95%']}
            toggleModalVisibility={toggleModalVisibility}
            shouldHandleKeyboard={false}
            showToggle={showToggle}>
            <CreatePostScreen communityID={communityID} personaID={personaID} />
        </BottomSheet>
    );
}
