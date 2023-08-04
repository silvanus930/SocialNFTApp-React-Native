import React, {useMemo, useEffect, useState, useContext} from 'react';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import isEqual from 'lodash.isequal';

import {StyleSheet, View} from 'react-native';
import AddPostButton from './AddPostButton';
import palette from 'resources/palette';
import colors from 'resources/colors';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineFrameDispatchContext,
} from './DiscussionEngineContext';
import {makeRegisterMediaPlayer} from 'utils/media/helpers';
import FeedPost from 'components/FeedPost';
import PostDiscussionPost from './PostDiscussionPost';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {TalkingStateRefContext} from 'state/TalkingStateRef';

export default React.memo(DiscussionHeader, isEqual);
function DiscussionHeader({
    animatedKeyboardOffset,
    headerType,
    headerProps,
    commentListRef,
}) {
    console.log('rendering DiscussionHeader', headerProps);
    return (
        <>
            {headerType === 'post' && (
                <DiscussionPostHeader
                    {...headerProps}
                    commentListRef={commentListRef}
                    animatedKeyboardOffset={animatedKeyboardOffset}
                />
            )}
        </>
    );
}

function DiscussionPostHeader({
    animatedKeyboardOffset,
    personaID,
    postID,
    communityID,
    commentListRef,
}) {
    const talkingStateRefContext = useContext(TalkingStateRefContext);
    const {dispatch} = React.useContext(DiscussionEngineFrameDispatchContext);

    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);
    const persona =
        communityID == personaID
            ? communityMap[communityID]
            : personaMap[personaID];
    const navigation = useNavigation();
    const myUserID = auth().currentUser.uid;
    const [post, setPost] = useState();
    const [deleted, setDeleted] = useState(false);

    useFocusEffect(() => {
        if (deleted && navigation.isFocused()) {
            alert("The post you're trying to view has been deleted!");
            navigation.pop(1);
        }
    });

    // get post updates instantly
    useEffect(() => {
        return personaID && postID
            ? personaID === communityID
                ? firestore()
                      .collection('communities')
                      .doc(personaID)
                      .collection('posts')
                      .doc(postID)
                      .onSnapshot(postDoc => {
                          const postData = postDoc.data();
                          console.log(
                              'DiscussionHeader setting postData',
                              postData,
                          );
                          if (postData?.deleted) {
                              setDeleted(true);
                          } else {
                              setPost(postData);
                          }
                      })
                : firestore()
                      .collection('personas')
                      .doc(personaID)
                      .collection('posts')
                      .doc(postID)
                      .onSnapshot(postDoc => {
                          const postData = postDoc.data();
                          if (postData?.deleted) {
                              setDeleted(true);
                          } else {
                              setPost(postData);
                          }
                      })
            : null;
    }, [personaID, postID]);

    const [mediaArtifactRegistry, setMediaArtifactRegistry] = React.useState(
        {},
    );

    const renderHeaderComponent = React.useCallback(() => {
        return (
            <View
                onLayout={e =>
                    dispatch({
                        type: 'setPostHeight',
                        payload: e.nativeEvent.layout.height,
                    })
                }
                style={{
                    justifyContent: 'flex-start',
                    borderColor: 'magenta',
                    borderWidth: 0,
                }}>
                <PostDiscussionPost
                    animatedKeyboardOffset={animatedKeyboardOffset}
                    post={post}
                    navigation={navigation}
                    postKey={postID}
                    persona={persona}
                    personaName={persona.name}
                    personaKey={personaID}
                    personaProfileImgUrl={persona.profileImgUrl}
                    mediaBorderRadius={0}
                    showPostActions={false}
                    dispatch={dispatch}
                    inlineDiscussion={false}
                    commentListRef={commentListRef}
                    registerMediaPlayer={makeRegisterMediaPlayer(
                        mediaArtifactRegistry,
                        setMediaArtifactRegistry,
                        'PostDiscussion',
                    )}
                />
            </View>
        );
    }, [
        animatedKeyboardOffset,
        post,
        navigation,
        postID,
        persona,
        persona?.name,
        personaID,
        persona?.profileImgUrl,
        dispatch,
        commentListRef,
    ]);

    const usersPresent = useMemo(() => {
        let newUserPresentObj = Object.values(
            Object.values(post?.usersPresentHeartbeat || {}),
        );
        newUserPresentObj = newUserPresentObj.filter(
            item =>
                item.hasOwnProperty('heartbeat') &&
                item.heartbeat?.seconds + 2 * HEARTBEAT_RATE >
                    Date.now() / 1000,
        ); // for backwards compatibility
        return newUserPresentObj.map(({identity}) => identity);
    }, [post?.usersPresentHeartbeat]);

    let presenceIntent = post
        ? post?.title
            ? post?.title
            : 'untitled post'
        : '';

    console.log('RENDERING DiscussionHeader');

    return (
        <>
            {post && persona && (
                <React.Profiler
                    id={'DiscussionHeader'}
                    onRender={(id, phase, actualDuration) => {
                        if (actualDuration > 2) {
                            //console.log('======> (Profiler) ', id, phase, actualDuration);
                        }
                    }}>
                    {renderHeaderComponent()}
                </React.Profiler>
            )}
        </>
    );
}

const Styles = StyleSheet.create({
    timeline: {
        ...palette.timeline.line,
        zIndex: 4,
        height: 50,
    },
    addPostBreakout: {
        position: 'absolute',
        marginLeft:
            1 +
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth,
        borderLeftWidth: palette.timeline.line.width,
        borderTopWidth: palette.timeline.line.width,
        borderTopLeftRadius: 37,
        width: 90,
        height: 95,
        marginTop: 37,
        borderTopColor: colors.timeline,
        borderLeftColor: colors.timeline,
        zIndex: -1,
    },
    addPost: {
        borderRadius: 50,
        borderWidth: 1,
        borderColor: colors.timeline,
        backgroundColor: colors.homeBackground,
    },
});
