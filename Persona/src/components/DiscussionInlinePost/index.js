import React, {useContext, useState, useEffect, useRef} from 'react';
import {View, Text, Pressable} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import FastImage from 'react-native-fast-image';
import pluralize from 'pluralize';

import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {CommunityStateContext} from 'state/CommunityState';
import {POST_TYPE_EVENT} from 'state/PostState';

import MarkDown from 'components/MarkDown';
import PostGallery from 'components/PostGallery';
import {PostEndorsements} from 'components/PostCommon';
import EventLink from 'components/EventLink';

import {fonts, images} from 'resources';
import getResizedImageUrl from 'utils/media/resize';
import useNavPushDebounce from 'hooks/navigationHooks';
import {determineUserRights} from 'utils/helpers';

import styles from './styles';

export default function DiscussionInlinePost({post, parentObjPath}) {
    const timer = useRef(0);
    const {
        current: {personaMap, user},
    } = useContext(GlobalStateRefContext);

    const communityContext = React.useContext(CommunityStateContext);
    const communityID = communityContext.currentCommunity;
    // const postData = post?.data;
    const postPath = post?.ref?.path;
    const [entityCollectionName, entityID, postsCollectionName, postID] =
        postPath.split('/');
    const [commentCount, setCommentCount] = React.useState(0);
    const parentObjPathParts = parentObjPath.split('/');
    const isCommunityAllChat =
        parentObjPathParts[0] === 'communities' &&
        parentObjPathParts[3] === 'all';

    const isCommunityPost =
        parentObjPathParts[0] === 'communities' &&
        entityID === parentObjPathParts[1];

    const entity = personaMap[entityID];

    const [postData, setPost] = useState(post?.data);

    const hasAuth = determineUserRights(
        communityID,
        null,
        user,
        'readChatPost',
    );

    useEffect(() => {
        return firestore()
            .collection(isCommunityPost ? 'communities' : 'personas')
            .doc(entityID)
            .collection('posts')
            .doc(postID)
            .onSnapshot(postDoc => setPost(postDoc.data()));
    }, [entityID, isCommunityPost, postID]);

    useEffect(() => {
        return firestore()
            .collection(isCommunityPost ? 'communities' : 'personas')
            .doc(entityID)
            .collection('posts')
            .doc(postID)
            .collection('live')
            .doc('discussion')
            .onSnapshot(discussionSnap => {
                setCommentCount(
                    discussionSnap.get('numCommentsAndThreads') ||
                        post?.numComments ||
                        0,
                );
            });
    }, [entityID, isCommunityPost, post?.numComments, postID]);

    const navToPost = useNavPushDebounce(
        'PostDiscussion', // TODO DCENTRY
        {
            personaKey: entityID,
            postKey: postID,
            renderFromTop: true,
            communityID: isCommunityPost ? entityID : null,
            scrollToMessageID: null,
            openToThreadID: null,
        },
        [entity, entityID, postID],
    );

    const personaContext = useContext(PersonaStateRefContext);
    const handleNav = () => {
        personaContext.current.csetState({
            openToThreadID: null,
            scrollToMessageID: null,
            threadID: null,
        });
        navToPost();
    };

    let processedText = postData?.text.substring(0, 80);

    if (processedText && processedText.split('```').length - 1 === 1) {
        processedText += '```';
    } else if (processedText && processedText.split('``').length - 1 === 1) {
        processedText += '``';
    } else if (processedText && processedText.split('`').length - 1 === 1) {
        processedText += '`';
    }

    if (!hasAuth) {
        return null;
    }

    const isEvent = postData?.type === POST_TYPE_EVENT;

    return postData && !postData?.deleted ? (
        <View style={styles.container}>
            {!postData?.anonymous && postData?.userName && (
                <Text style={styles.textUserName}>
                    post by {postData?.userName}
                </Text>
            )}
            <View style={styles.subContainer}>
                <Pressable
                    onPressIn={() => {
                        timer.current = new Date().getTime();
                    }}
                    onPress={() => {
                        if (new Date().getTime() - timer.current > 200) {
                            return;
                        }
                        handleNav();
                    }}>
                    <>
                        {isCommunityAllChat && !isCommunityPost && (
                            <View style={styles.textPostNameContainer}>
                                <FastImage
                                    source={{
                                        uri: getResizedImageUrl({
                                            origUrl:
                                                entity?.profileImgUrl ||
                                                images.personaDefaultProfileUrl,
                                            width: 100,
                                            height: 100,
                                        }),
                                    }}
                                    style={styles.profilePicture}
                                />
                                <Text style={styles.textPostName}>
                                    {entity.name}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.textPostTitle}>
                            {postData?.title || '(untitled post)'}
                        </Text>
                    </>
                </Pressable>

                <View style={{justifyContent: 'center'}}>
                    {postData.mediaType === 'gallery' &&
                        postData?.galleryUris?.[0] && (
                            <PostGallery post={postData} />
                        )}
                </View>

                <Pressable
                    onPressIn={() => {
                        timer.current = new Date().getTime();
                    }}
                    onPress={() => {
                        if (new Date().getTime() - timer.current > 200) {
                            return;
                        }
                        handleNav();
                    }}>
                    <>
                        <View style={{justifyContent: 'center'}}>
                            {postData?.text && (
                                <MarkDown
                                    text={
                                        processedText +
                                        (processedText.length ===
                                        postData?.text.length
                                            ? ''
                                            : ' ...')
                                    }
                                    fontFamily={fonts.regular}
                                    fontSize={14}
                                    hasMedia={false}
                                />
                            )}
                        </View>

                        {isEvent && (
                            <EventLink title={post?.title} postKey={postID} />
                        )}

                        <View style={{justifyContent: 'space-between'}}>
                            <PostEndorsements
                                vertical={false}
                                personaKey={entityID}
                                postKey={postID}
                            />
                            <Text style={styles.textPostName}>
                                {commentCount}{' '}
                                {pluralize('comment', commentCount)}
                            </Text>
                        </View>
                    </>
                </Pressable>
            </View>
        </View>
    ) : null;
}
