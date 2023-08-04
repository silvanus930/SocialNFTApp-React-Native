import React, {useState, useMemo} from 'react';
import isEqual from 'lodash.isequal';
import fonts from 'resources/fonts';
import colors from 'resources/colors';
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    FlatList,
    Platform,
} from 'react-native';
import {
    anySelected,
    DiscussionEngineStateContext,
    DiscussionEngineFrameStateContext,
    DiscussionEngineDispatchContext,
} from './DiscussionEngineContext';
import DiscussionEngineEndorsementMenu from './DiscussionEngineEndorsementMenu';
import DiscussionEditCommentMenu from './DiscussionEditCommentMenu';
import DiscussionCommentItem from './DiscussionCommentItem';
import Modal from './Modal';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

// export default function EndorsementsModalProfiler(props) {
//     return (
//         <React.Profiler
//             id={'EndorsementsModal'}
//             onRender={(id, phase, actualDuration) => {
//                 if (actualDuration > 2) {
//                     //console.log('======> (Profiler)', id, phase, actualDuration);
//                 }
//             }}>
//             <EndorsementsModalMemo {...props} />
//         </React.Profiler>
//     );
// }

export default React.memo(EndorsementsModal, propsAreEqual);

function EndorsementsModal(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const showEndorsementsModal = Boolean(state.showEditMenuKey);
    const {
        isSelf,
        item,
        index,
        shouldDeselectComment = true,
    } = state.endorsementsModalProps;

    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    // const offsetY = frameState.offsetY;
    // const contentLength = frameState.contentLength;

    const contentVisibleHeight = frameState.contentVisibleHeight;
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const toggleModalVisibility = React.useCallback(() => {        
        dispatch({type: 'clearEndorsementMenu'});
        dispatch({type: 'clearShowEditMenu'});

        if (shouldDeselectComment) {
            dispatch({type: 'clearSelectedComments'});
        }

        dispatch({type: 'setEndorsementsModalProps', payload: {}});
    }, [dispatch, shouldDeselectComment]);

    return useMemo(
        () => (
            <EndorsementsModalMemo
                {...props}
                showEndorsementsModal={showEndorsementsModal}
                toggleModalVisibility={toggleModalVisibility}
                // offsetY={offsetY}
                // contentLength={contentLength}
                isSelf={isSelf}
                item={item}
                index={index}
                contentVisibleHeight={contentVisibleHeight}
            />
        ),
        [
            // props,
            showEndorsementsModal,
            toggleModalVisibility,
            // offsetY,
            // contentLength,
            isSelf,
            item,
            index,
        ],
    );
}

function EndorsementsModalMemo({
    showEndorsementsModal,
    toggleModalVisibility,
    // offsetY,
    // contentLength,
    contentVisibleHeight,
    isSelf,
    item,
    index,
    // props
    // animatedOffset,
    getFirebaseCommentsCollection,
    getFirebaseCommentsLiveCache,
    // headerType,
    personaID,
    postID,
    commentListRef,
    THREAD_OFFSET,
    headerProps,
    parentObjPath,
    transparentBackground,
}) {
    const [topOffset, setTopOffset] = useState(0);
    const [bottomOffset, setBottomOffset] = useState(0);
    const [viewAllEmojis, setViewAllEmojis] = useState(false);

    const localToggleModal = () => {
        setViewAllEmojis(false);
        toggleModalVisibility();
    }

    return (
        <Modal
            windowScale={Platform.OS === 'ios' ? .70 : .65}
            toggleModalVisibility={localToggleModal}
            showToggle={showEndorsementsModal}
            touchAnywhereToClose={false}
            animationType={'slide'}>
            <View
                style={{
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: 'orange',
                    borderWidth: 0,
                    marginTop: 10,
                    elevation: 999999999999999,
                }}
                >
                <DiscussionEngineEndorsementMenu
                    getFirebaseCommentsCollection={
                        getFirebaseCommentsCollection
                    }
                    getFirebaseCommentsLiveCache={getFirebaseCommentsLiveCache}
                    commentListRef={commentListRef}
                    viewAllEmojis={viewAllEmojis}
                    setViewAllEmojis={setViewAllEmojis}
                    toggleModalVisibility={localToggleModal}
                />
                <DiscussionEditCommentMenu
                    getFirebaseCommentsCollection={
                        getFirebaseCommentsCollection
                    }
                    getFirebaseCommentsLiveCache={getFirebaseCommentsLiveCache}
                    personaID={personaID}
                    postID={postID}
                    commentListRef={commentListRef}
                    viewAllEmojis={viewAllEmojis}
                />
            </View>
        </Modal>
    );
}

const Styles = StyleSheet.create({
    text: {
        color: colors.text,
        marginLeft: 10,
        marginRight: 10,
        fontSize: 14,
    },
});
