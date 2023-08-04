import firestore from '@react-native-firebase/firestore';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import CommunityHeader from 'components/CommunityHeader';
import React, {useEffect, useState} from 'react';
import baseText from 'resources/text';
import {CommunityStateContext} from 'state/CommunityState';
import isEqual from 'lodash.isequal';

import {Text, View} from 'react-native';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineFrameDispatchContext,
} from './DiscussionEngineContext';

export default React.memo(DiscussionChatHeader, isEqual);
function DiscussionChatHeader({
    animatedKeyboardOffset,
    data,
    parentObjPath,
    headerType,
    headerProps,
    commentListRef,
    inverted = true,
}) {
    return (
        <>
            {headerType === 'post' && (
                <DiscussionPostHeader
                    {...headerProps}
                    parentObjPath={parentObjPath}
                    commentListRef={commentListRef}
                    animatedKeyboardOffset={animatedKeyboardOffset}
                    inverted={inverted}
                />
            )}
            {headerType === 'activityChat' && (
                <DiscussionActivityChatHeader
                    {...headerProps}
                    parentObjPath={parentObjPath}
                    commentListRef={commentListRef}
                    animatedKeyboardOffset={animatedKeyboardOffset}
                    data={data}
                    inverted={inverted}
                />
            )}
        </>
    );
}

function DiscussionActivityChatHeader({inverted = true, personaID}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const communityContext = React.useContext(CommunityStateContext);
    let communityID = communityContext?.currentCommunity;

    return (
        <>
            <View
                style={{
                    height:
                        personaID === 'gettingstarted'
                            ? !inverted
                                ? 0
                                : 28
                            : 28,
                }}
            />
            <CommunityHeader
                heightMod={
                    personaID === 'gettingstarted' && inverted
                        ? 0
                        : personaID === 'gettingstarted' && !inverted
                        ? 20
                        : 0
                }
                chat={true}
                verticalCameraIconShift={-100}
                style={{borderColor: 'magenta', borderWidth: 0}}
                gap={personaID === 'gettingstarted' ? inverted : true}
                showCreatePost={false}
                personaID={personaID}
                communityID={communityID}
            />
        </>
    );
}

function DiscussionPostHeader({personaID, postID}) {
    const {dispatch} = React.useContext(DiscussionEngineFrameDispatchContext);
    const navigation = useNavigation();
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
            ? firestore()
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

    // const renderHeaderComponent = () => {
    //     return (
    //         <View
    //             onLayout={e =>
    //                 dispatch({
    //                     type: 'setPostHeight',
    //                     payload: e.nativeEvent.layout.height,
    //                 })
    //             }
    //             style={{
    //                 justifyContent: 'flex-start',
    //                 borderColor: 'magenta',
    //                 borderWidth: 0,
    //             }}>
    //             <PostDiscussionPost
    //                 animatedKeyboardOffset={animatedKeyboardOffset}
    //                 post={post}
    //                 navigation={navigation}
    //                 postKey={postID}
    //                 persona={persona}
    //                 personaName={persona?.name}
    //                 personaKey={personaID}
    //                 personaProfileImgUrl={persona.profileImgUrl}
    //                 mediaBorderRadius={0}
    //                 showPostActions={false}
    //                 dispatch={dispatch}
    //                 inlineDiscussion={false}
    //                 commentListRef={commentListRef}
    //                 registerMediaPlayer={makeRegisterMediaPlayer(
    //                     mediaArtifactRegistry,
    //                     setMediaArtifactRegistry,
    //                     'PostDiscussion',
    //                 )}
    //             />
    //         </View>
    //     );
    // };

    return (
        <>
            <View style={{borderColor: 'magenta', borderWidth: 0}}>
                <Text style={{...baseText}}>the basic</Text>
            </View>
        </>
    );
}
