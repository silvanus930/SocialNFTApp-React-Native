import React, {useContext} from 'react';
import {View} from 'react-native';
import isEqual from 'lodash.isequal';
import {OptionsModalStateContext} from 'state/OptionsModalState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CommunityStateContext} from 'state/CommunityState';
import EditPostButton from 'components/EditPostButton';
import DeletePostButton from 'components/DeletePostButton';
import {POST_TYPE_PROPOSAL, POST_TYPE_TRANSFER} from 'state/PostState';
import {determineUserRights} from 'utils/helpers';
import BottomSheet from '../BottomSheet';
import styles from './styles';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default function OptionsModalProfiler(props) {
    return (
        <React.Profiler
            id={'OptionsModal'}
            onRender={(id, phase, actualDuration) => {
                if (actualDuration > 2) {
                    //console.log('======> (Profiler)', id, phase, actualDuration);
                }
            }}>
            <OptionsModalMemo {...props} />
        </React.Profiler>
    );
}

const OptionsModalMemo = React.memo(OptionsModal, propsAreEqual);
function OptionsModal({navigation}) {
    const {
        toggleModalVisibility,
        persona,
        isCurrentUserAuthor,
        personaID,
        post,
        postID,
        showToggle,
        communityID,
    } = React.useContext(OptionsModalStateContext);
    console.log('rendering OptionsModal', postID, personaID);

    let canDelete =
        post?.type !== POST_TYPE_PROPOSAL && post?.type !== POST_TYPE_TRANSFER;

    let canEdit =
        post?.type !== POST_TYPE_PROPOSAL && post?.type !== POST_TYPE_TRANSFER;

    const {
        current: {user},
    } = useContext(GlobalStateRefContext)
    const communityContext = React.useContext(CommunityStateContext);
    let communityMap = communityContext?.communityMap;

    // Don't fully understand what's happening a few layers above.
    // But personaID is purposefully set to communityID and there
    // is other logic that depends on this. Checking to see if we
    // are in a persona or community with this:
    const hasAuth = personaID !== communityID
        ? determineUserRights(null, persona.id, user, 'writePost')
        : determineUserRights(communityID, null, user, 'writePost');

    return (
        <BottomSheet
            // windowScale={0.33}
            snapPoints={['33%']}
            toggleModalVisibility={toggleModalVisibility}
            showToggle={showToggle}>
            <View style={styles.content}>
                {hasAuth && canDelete ? (
                    <DeletePostButton
                        postID={postID}
                        inStudio={false}
                        size={16}
                        doFirst={toggleModalVisibility}
                        wide={true}
                        style={styles.actionPostButton}
                        background={true}
                        navigation={navigation}
                        persona={{...persona, pid: personaID}}
                        post={post}
                    />
                ) : null}
                {hasAuth && canEdit ? (
                    <EditPostButton
                        communityID={communityID}
                        postID={postID}
                        inStudio={false}
                        wide={true}
                        size={16}
                        doFirst={toggleModalVisibility}
                        style={styles.actionPostButton}
                        background={true}
                        navigation={navigation}
                        personaID={personaID}
                        post={post}
                        persona={{...persona, pid: personaID}}
                    />
                ) : null}
            </View>
        </BottomSheet>
    );
}

/*
            <TouchableOpacity
                onPress={null}
                style={{
                    marginStart: 40,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginEnd: 40,
                    padding: 10,
                    borderRadius: 8,
                    marginTop: 20,
                    backgroundColor: colors.paleBackground,
                }}>
                <Text
                    style={{
                        fontSize: 28,
                        fontStyle: 'italic',
                        color: colors.postAction,
                        top: -2,
                    }}>
                    #
                </Text>
                <Text
                    style={{
                        fontSize: 16,
                        color: colors.postAction,
                        fontFamily: fonts.bold,
                        marginStart: 10,
                    }}>
                    Find by Phone Number
                </Text>
                <View
                    style={{
                        borderColor: 'orange',
                        borderWidth: 0,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        width: '30%',
                    }}>
                    <Text style={{color: colors.maxFaded, fontSize: 20}}>
                        >
                    </Text>
                </View>
            </TouchableOpacity>
            */
