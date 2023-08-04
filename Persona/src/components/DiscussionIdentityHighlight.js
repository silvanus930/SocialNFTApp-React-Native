import React, {useState, useMemo} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import auth from '@react-native-firebase/auth';
import colors from 'resources/colors';
import {timestampToDateString} from 'utils/helpers';
import images from 'resources/images';
import SeenCounter from 'components/SeenCounter';
import palette from 'resources/palette';
import useDebounce from 'hooks/useDebounce';
import ZeroMarginSeperator from './ZeroMarginSeperator';
import {useNavigation} from '@react-navigation/native';
import {
    DiscussionEngineFrameStateContext,
    DiscussionEngineStateContext,
} from './DiscussionEngineContext';
import isEqual from 'lodash.isequal';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(DiscussionIdentityHighlight, propsAreEqual);

function DiscussionIdentityHighlight({
    itemKey,
    commentAnonymous,
    commentIdentityID,
    commentUserID,
}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    const {
        current: {personaList},
    } = React.useContext(GlobalStateRefContext);
    const myPersonaIDs = personaList.map(p => p.pid);
    const identityID = state.identityID;
    const height = frameState.listFrames[itemKey]?.length || 0;

    return useMemo(
        () => (
            <DiscussionIdentityHighlightMemo
                commentAnonymous={commentAnonymous}
                commentIdentityID={commentIdentityID}
                commentUserID={commentUserID}
                myPersonaIDs={myPersonaIDs}
                identityID={identityID}
                height={height}
            />
        ),
        [
            commentAnonymous,
            commentIdentityID,
            myPersonaIDs,
            identityID,
            height,
            commentUserID,
        ],
    );
}

function DiscussionIdentityHighlightMemo({
    commentAnonymous,
    commentIdentityID,
    commentUserID,
    myPersonaIDs,
    identityID,
    height,
}) {
    const myUserID = auth().currentUser.uid;
    const commentIdentity = commentAnonymous
        ? commentIdentityID
        : commentUserID;
    const oneOfMine = myPersonaIDs.concat(myUserID).includes(commentIdentity);

    return (
        <View
            style={{
                position: 'absolute',
                zIndex: 110,
                width: '100%',
                backgroundColor: colors.homeBackground,
                opacity: oneOfMine && identityID !== commentIdentity ? 0.25 : 0,
                height,
            }}
            pointerEvents="none"
        />
    );
}
