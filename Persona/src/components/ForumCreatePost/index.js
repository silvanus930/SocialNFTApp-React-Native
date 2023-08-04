import React, {useContext} from 'react';
import {View} from 'react-native';
import {PersonaStateContext} from 'state/PersonaState';
import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PostStateRefContext} from 'state/PostStateRef';
import {determineUserRights} from 'utils/helpers';

import Button from './BaseComponents/Button';

import CreatePostEventModal from './CreatePostEventModal';
import styles from './styles';

export const CREATE_POST_CONTAINER_HEIGHT = 94;

const ForumCreatePost = () => {
    const personaContext = useContext(PersonaStateContext);
    const postContextRef = useContext(PostStateRefContext);
    const communityContext = useContext(CommunityStateContext);
    const {
        current: {user},
    } = useContext(GlobalStateRefContext);

    const personaID = personaContext?.persona?.pid;
    let communityID = communityContext?.currentCommunity;

    const hasAuth = personaID
        ? determineUserRights(null, personaID, user, 'writePost')
        : determineUserRights(communityID, null, user, 'writePost');

    const showCreatePost = true;

    if (!(hasAuth && showCreatePost)) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.subContainer}>
                <Button
                    onPress={() => {
                        postContextRef.current.csetState({
                            visible: false,
                            event: true,
                            edit: false,
                        });
                    }}
                    title={'New event'}
                    style={{height: 45}}
                    textStyle={styles.text}
                />
                <Button
                    onPress={() => {
                        postContextRef.current.csetState({
                            visible: true,
                            event: false,
                            edit: false,
                        });
                    }}
                    style={{
                        borderWidth: 0,
                        backgroundColor: '#375E8A',
                        height: 45,
                    }}
                    textStyle={styles.text}
                    title="New post"
                />
            </View>
            <CreatePostEventModal isPost={false} />
            <CreatePostEventModal isPost={true} />
        </View>
    );
};

export default ForumCreatePost;
