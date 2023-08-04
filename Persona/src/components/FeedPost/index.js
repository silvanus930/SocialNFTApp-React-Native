import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React from 'react';
import {Animated} from 'react-native';
import {State} from 'react-native-gesture-handler';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PresenceStateRefContext} from 'state/PresenceStateRef';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {timestampToDateString} from 'utils/helpers';
import useDebounce from 'hooks/useDebounce';
import useNavPushDebounce from 'hooks/navigationHooks';

import {FeedMenuDispatchContext} from 'state/FeedStateContext';

import images from 'resources/images';

import Transfer from './components/Transfer';
import Forum from './components/Forum';

import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {postTypes} from 'resources/constants';

const FeedPost = props => {
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const [post, setPost] = React.useState(props.post);
    const persona = props.personaKey ? personaMap[props.personaKey] : {};
    const artistPersonaProfileUrl =
        personaMap[post?.subPersonaID] &&
        personaMap[post?.subPersonaID]?.profileImgUrl?.length > 0
            ? personaMap[post?.subPersonaID]?.profileImgUrl
            : images.personaDefaultProfileUrl;
    const artistPersonaName = personaMap[post?.subPersonaID]?.name || '';
    const postUser = userMap[post?.userID];
    const profileImgUrl = postUser?.profileImgUrl;
    const postUserName = postUser?.userName;

    React.useEffect(() => {
        const unsubscribe =
            props.personaKey === props.post.communityID ||
            props.postType === postTypes.COMMUNITY
                ? firestore()
                      .collection('communities')
                      .doc(props.personaKey)
                      .collection('posts')
                      .doc(props.postKey)
                      .onSnapshot(postDoc => setPost(postDoc?.data()))
                : firestore()
                      .collection('personas')
                      .doc(props.personaKey)
                      .collection('posts')
                      .doc(props.postKey)
                      .onSnapshot(postDoc => setPost(postDoc?.data()));
        return () => {
            //unsubscribe();
        };
    }, [
        props.personaKey,
        props.post.communityID,
        props.postKey,
        props.postType,
    ]);

    return React.useMemo(
        () => (
            <>
                {!post || post?.deleted || persona?.deleted ? (
                    <></>
                ) : (
                    <FeedPostWrapped
                        {...props}
                        post={post}
                        postType={props.postType}
                        postUserName={postUserName}
                        profileImgUrl={profileImgUrl}
                        artistPersonaName={artistPersonaName}
                        artistPersonaProfileUrl={artistPersonaProfileUrl}
                    />
                )}
            </>
        ),
        [
            post,
            persona?.deleted,
            props,
            postUserName,
            profileImgUrl,
            artistPersonaName,
            artistPersonaProfileUrl,
        ],
    );
};

const FeedPostWrapped = ({
    maxHeight = null,
    showIdentity = false,
    personaKey,
    persona,
    post,
    communityID,
    postKey,
    postType,
    navigation,
    registerMediaPlayer = null,
    index = undefined,
    postUserName,
    profileImgUrl,
    artistPersonaName,
    artistPersonaProfileUrl,
    compact,
    bookmark,
    forumType,
}) => {
    const fileUris = post?.fileUris ? post?.fileUris : [];
    const postHasMedia = Boolean(
        post?.mediaUrl ||
            post?.audioUrl ||
            post?.galleryUris?.length ||
            post?.imgUrl,
    );

    const largeWidth = 120;
    const width = 38;

    const textOpacity = React.useRef(new Animated.Value(1)).current;
    const {dispatch} = React.useContext(FeedMenuDispatchContext);
    const onHandlerStateChange = React.useCallback(
        ({nativeEvent}) => {
            if (nativeEvent.state === State.BEGAN) {
                Animated.timing(textOpacity, {
                    toValue: 0.95,
                    duration: 20,
                    useNativeDriver: true,
                }).start();
            }
            if (nativeEvent.oldState === State.ACTIVE) {
                dispatch({
                    type: 'openEndorsementsMenu',
                    payload: {
                        touchY: nativeEvent.absoluteY,
                        postKey,
                        personaKey,
                    },
                });
            }
            if (
                [
                    State.END,
                    State.FAILED,
                    State.CANCELLED,
                    State.UNDETERMINED,
                ].includes(nativeEvent.state)
            ) {
                textOpacity.stopAnimation(() =>
                    Animated.timing(textOpacity, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }).start(),
                );
            }
        },
        [personaKey, postKey, textOpacity, dispatch],
    );

    const {
        current: {personaMap},
    } = React.useContext(GlobalStateRefContext);

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const navToProfile = useDebounce(() => {
        if (post?.anonymous) {
            if (post?.identityID && post?.identityID !== '') {
                profileModalContextRef.current.csetState({
                    userID: `PERSONA::${post?.identityID}`,
                    showToggle: true,
                });
            } else {
                profileModalContextRef.current.csetState({
                    userID: `PERSONA::${personaKey}`,
                    showToggle: true,
                });
            }
        } else {
            profileModalContextRef.current.csetState({
                userID: post?.userID,
                showToggle: true,
            });
        }
    }, [navigation, post, persona, personaKey]);

    const navToPersona = () => {
        profileModalContextRef.current.csetState({
            userID: `PERSONA::${personaKey}`,
            showToggle: true,
        });
    };

    const profileUri = post?.anonymous
        ? post?.identityID
            ? personaMap[post?.identityID]?.profileImgUrl ||
              images.personaDefaultProfileUrl
            : post?.identityProfileImgUrl || images.personaDefaultProfileUrl
        : profileImgUrl;

    const myUserID = auth().currentUser?.uid;
    const personaProfileImgUrl = persona.profileImgUrl;

    const presenceContextRef = React.useContext(PresenceStateRefContext);

    const updatePresence = React.useCallback(async () => {
        let presenceObjPath = `personas/${personaKey}/posts/${postKey}`;
        let myUserID = auth().currentUser.uid;

        const postRef = await firestore().doc(presenceObjPath).get();
        const post = postRef.data();
        const persona = personaMap[personaKey];

        if (
            persona.private &&
            !(
                persona.authors.includes(myUserID) ||
                persona.communityMembers.includes(myUserID)
            )
        ) {
            alert('You do not have access to this persona!');
            return null;
        }

        presenceContextRef.current.csetState({
            roomPostID: postKey,
            roomPersonaID: personaKey,
            roomTitle: post?.title,
            roomSlug: post?.slug,
            roomPost: post,
            presenceObjPath: presenceObjPath,
            pastRooms: {
                ...presenceContextRef.current.pastRooms,
                [presenceObjPath]: Date.now(),
            },

            pastRoomsStack: [
                ...presenceContextRef.current.pastRoomsStack,
                presenceObjPath,
            ],
            presenceIntent: `${post?.title ? post?.title : 'Untitled Post'} • ${
                persona.name
            }`,
        });
    }, [presenceContextRef, personaMap, personaKey, postKey]);

    const navToPostDiscussionBase = useNavPushDebounce(
        'PostDiscussion',
        {
            personaKey: personaKey,
            postKey: postKey,
            communityID: communityID,
        },
        [personaKey, postKey],
    );
    const navToPostDiscussion = React.useCallback(() => {
        !presenceContextRef.current.sticky && updatePresence();
        navToPostDiscussionBase();
    }, [updatePresence, presenceContextRef, navToPostDiscussionBase]);

    const navToPostBase = useNavPushDebounce(
        'PostDiscussion',
        {
            personaKey: personaKey,
            postKey: postKey,
            communityID: communityID,
            renderFromTop: true,
            scrollToMessageID: null,
            openToThreadID: null,
        },
        [personaKey, postKey, communityID],
    );
    const personaContext = React.useContext(PersonaStateRefContext);
    const navToPost = React.useCallback(() => {
        console.log('called navToPost');
        personaContext.current.csetState({
            openToThreadID: null,
            scrollToMessageID: null,
            threadID: null,
        });
        !presenceContextRef.current.sticky && updatePresence();
        navToPostBase();
    }, [personaContext, presenceContextRef, updatePresence, navToPostBase]);
    const isCurrentUserAuthor = persona?.authors?.includes(
        auth().currentUser?.uid,
    );

    const timestamp = timestampToDateString(
        post?.publishDate?._seconds
            ? post?.publishDate?._seconds
            : post?.publishDate?.seconds,
    );

    const showUserName = showIdentity && !post?.anonymous;

    const noPostTitle = post?.title === undefined || post?.title === '';

    if (!post?.published && !persona.authors.includes(myUserID)) {
        return null;
    }

    if (post?.title?.trim().toLowerCase() === 'new author invited') {
        return null;
    }

    if (post?.type === 'transfer') {
        return <Transfer postKey={postKey} post={post} navToPost={navToPost} />;
    }

    return (
        <Forum
            post={post}
            postKey={postKey}
            postType={postType}
            navToPost={navToPost}
            showUserName={showUserName}
            showIdentity={showIdentity}
            navToProfile={navToProfile}
            navToPersona={navToPersona}
            navToPostDiscussion={navToPostDiscussion}
            profileUri={profileUri}
            personaProfileImgUrl={personaProfileImgUrl}
            width={width}
            postUserName={postUserName}
            persona={persona}
            timestamp={timestamp}
            personaKey={personaKey}
            postHasMedia={postHasMedia}
            noPostTitle={noPostTitle}
            isCurrentUserAuthor={isCurrentUserAuthor}
            communityID={communityID}
            navigation={navigation}
            largeWidth={largeWidth}
            artistPersonaName={artistPersonaName}
            artistPersonaProfileUrl={artistPersonaProfileUrl}
            index={index}
            registerMediaPlayer={registerMediaPlayer}
            maxHeight={maxHeight}
            onHandlerStateChange={onHandlerStateChange}
            fileUris={fileUris}
            compact={compact}
            bookmark={bookmark}
            forumType={forumType}
        />
    );
};

export default FeedPost;
