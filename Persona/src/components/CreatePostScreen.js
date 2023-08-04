import React from 'react';
import {TextInput, KeyboardAvoidingView, Platform} from 'react-native';
import useDebounce from 'hooks/useDebounce';
import firestore from '@react-native-firebase/firestore';
import images from 'resources/images';
import {PostStateRefContext} from 'state/PostStateRef';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputPostDescription from 'components/InputPostDescription';
import CreatePostMedia from 'components/CreatePostMedia';
import LineSeperator from 'components/LineSeperator';
import palette from 'resources/palette';
import auth from '@react-native-firebase/auth';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import FastImage from 'react-native-fast-image';
import {CreatePostModalStateRefContext} from 'state/CreatePostModalStateRef';
import getResizedImageUrl from 'utils/media/resize';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {PostStateContext, POST_MEDIA_TYPE_GALLERY} from 'state/PostState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CreatePostModalStateContext} from 'state/CreatePostModalState';
import {ForumFeedDispatchContext} from 'state/ForumFeedStateContext';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import colors from 'resources/colors';
import Icon from 'react-native-vector-icons/Feather';
import _ from 'lodash';
import {
    ScrollView,
    Text,
    View,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    Switch,
} from 'react-native';
import UserAutocomplete from './UserAutocomplete';
import {
    createCommunityPost,
    createPost,
    updatePost,
    updateCommunityPost,
} from 'actions/posts';

function Header({
    communityID,
    personaID,
    galleryUris,
    editPost,
    parentNavigation,
}) {
    const createPostModalContextRef = React.useContext(
        CreatePostModalStateRefContext,
    );
    const {
        current: {user},
    } = React.useContext(GlobalStateRefContext);
    const communityContextRef = React.useContext(CommunityStateRefContext);
    const {dispatch} = React.useContext(ForumFeedDispatchContext);

    let communityMap = communityContextRef?.current?.communityMap;
    let community = communityMap[communityID];

    const postContext = React.useContext(PostStateContext);
    const postContextRef = React.useContext(PostStateRefContext);
    const readySubmit = Boolean(postContext?.post?.text);
    const closePostScreen = () => {
        if (editPost) {
            postContextRef.current.csetState({
                init: false,
            });
            parentNavigation.goBack();
        } else {
            createPostModalContextRef?.current?.toggleModalVisibility();
        }
    };

    const onSubmit = useDebounce(async () => {
        let newPost = Object.assign(
            {},
            {
                ...postContext.post,
                editPublishDate: firestore.Timestamp.now(),
                createDate: firestore.Timestamp.now(),
                editDate: firestore.Timestamp.now(),
                publishDate: firestore.Timestamp.now(),
                deleted: false,
                userID: auth().currentUser.uid,
                userName: user.userName,
                published: true,
                type: 'media',
                galleryUris: galleryUris,
                mediaType: POST_MEDIA_TYPE_GALLERY,
            },
        );
        if (editPost) {
            if (personaID) {
                await updatePost(personaID, newPost.pid, newPost);
            } else {
                await updateCommunityPost(communityID, newPost.pid, newPost);
            }
        } else {
            if (personaID) {
                await createPost(personaID, newPost);
            } else {
                await createCommunityPost(communityID, newPost);
            }
        }
        postContext.restoreVanilla({sNew: true, sInit: true});
        closePostScreen();
        dispatch({type: 'refreshFeed'});
    }, [
        postContext?.post?.text,
        postContext?.post?.title,
        postContext,
        postContext?.post,
        galleryUris,
    ]);

    return (
        <View
            style={{
                borderBottomColor: colors.timestamp,
                borderBottomWidth: 0.4,
                flexDirection: 'row',
                height: 50,
            }}>
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                <TouchableOpacity onPress={closePostScreen}>
                    <Icon name={'x'} color={colors.postAction} size={28} />
                </TouchableOpacity>
            </View>
            <View
                style={{
                    flex: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: 'red',
                    borderWidth: 0,
                }}>
                <Text
                    style={{
                        ...baseText,
                        lineHeight: null,
                        fontFamily: fonts.semibold,
                        fontSize: 18,
                        color: colors.textFaded,
                        paddingBottom: 4,
                    }}>
                    {community?.name}
                </Text>
            </View>
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: 'red',
                    borderWidth: 0,
                    paddingRight: 10,
                }}>
                <TouchableOpacity
                    disabled={!readySubmit}
                    onPress={onSubmit}
                    style={{
                        borderWidth: 1,
                        borderColor: readySubmit
                            ? colors.actionText
                            : colors.textFaded,
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 5,
                        paddingBottom: 5,
                        borderRadius: 6,
                        backgroundColor: readySubmit
                            ? colors.actionText
                            : colors.maxFaded,
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            fontSize: 18,
                        }}>
                        Post
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function AnonymousPostToggle() {
    const postContext = React.useContext(PostStateContext);
    let anonymous = postContext?.post?.anonymous;

    const toggleAnonymous = React.useCallback(
        val => {
            postContext?.csetState({
                post: {...postContext?.post, anonymous: val},
            });
        },
        [anonymous, postContext],
    );

    return (
        <View
            style={{
                flexDirection: 'row',
                borderColor: 'red',
                padding: 10,
                borderWidth: 0,
                marginStart: 10,
                marginTop: 10,
                marginBottom: 5,
                marginEnd: 10,
                backgroundColor: colors.paleBackground,
                borderRadius: 8,
                justifyContent: 'flex-start',
                alignItems: 'center',
            }}>
            <Text
                style={{
                    ...baseText,
                    flex: 4,
                    color: colors.maxFaded,
                    marginStart: 10,
                    fontFamily: fonts.semibold,
                }}>
                Post anonymously
            </Text>
            <Switch
                trackColor={{false: '#767577', true: colors.actionText}}
                ios_backgroundColor="#3e3e3e"
                value={anonymous}
                onValueChange={toggleAnonymous}
                style={{transform: [{scaleX: 0.7}, {scaleY: 0.7}]}}
            />
        </View>
    );
}

function IdentityBar({personaID, communityID}) {
    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const showProfile = useDebounce(() => {
        profileModalContextRef.current.csetState({
            showToggle: true,
            userID: auth().currentUser.uid,
        });
    }, []);
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    let user = userMap[auth().currentUser.uid];
    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    let community = personaID
        ? personaMap[personaID]
        : communityMap[communityID];
    let numMembers = personaID
        ? personaMap[personaID]?.authors?.filter(key => userMap[key]?.human)
              .length
        : communityMap[communityID]?.members?.filter(key => userMap[key]?.human)
              .length;

    const postContext = React.useContext(PostStateContext);
    let anonymous = postContext?.post?.anonymous;
    return (
        <View
            style={{
                borderColor: colors.timestamp,
                borderWidth: 0,
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                paddingLeft: 8,
            }}>
            <TouchableOpacity onPress={showProfile}>
                <FastImage
                    source={{
                        uri: anonymous
                            ? community?.profileImgUrl
                                ? getResizedImageUrl({
                                      origUrl: community?.profileImgUrl,
                                      height: Styles2.personImage.height,
                                      width: Styles2.personImage.width,
                                  })
                                : images.personaDefaultProfileUrl
                            : user.profileImgUrl
                            ? getResizedImageUrl({
                                  origUrl: user.profileImgUrl,
                                  height: Styles2.personImage.height,
                                  width: Styles2.personImage.width,
                              })
                            : images.userDefaultProfileUrl,
                    }}
                    style={{
                        ...Styles2.personImage,
                        marginStart: 20,
                        top: -2,
                    }}
                />
            </TouchableOpacity>
            <View
                style={{
                    flexDirection: 'column',
                    borderColor: 'orange',
                    borderWidth: 0,
                    paddingTop: 10,
                    paddingBottom: 10,
                }}>
                <Text
                    style={{
                        ...baseText,
                        marginStart: 10,
                        fontSize: 16,
                        color: colors.text,
                        fontFamily: fonts.semibold,
                    }}>
                    {anonymous ? 'Anonymous Member' : user?.userName}
                </Text>
                <View
                    style={{
                        marginTop: 2,
                        marginStart: 10,
                        borderWidth: 0.4,
                        borderColor: colors.timestamp,
                        borderRadius: 8,
                        padding: 2,
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            marginStart: 4,
                            color: colors.timestamp,
                            fontFamily: fonts.regular,
                            marginEnd: 4,
                            fontSize: 10,
                        }}>
                        <Ionicons
                            style={{
                                top: 2.5,
                                marginRight: 10,
                                paddingRight: 10,
                            }}
                            name={'people'}
                            size={12}
                            color={colors.timestamp}
                        />
                        <Text style={{fontSize: 5}}> </Text> {numMembers} member
                        {numMembers > 1 ? 's' : ''} of {community?.name}
                    </Text>
                </View>
            </View>
        </View>
    );
}

function PostTitleInput({postTitle}) {
    const postContextRef = React.useContext(PostStateRefContext);
    const [localPostTitle, setLocalPostTitle] = React.useState(postTitle);
    const setLocal = React.useCallback(
        title => {
            setLocalPostTitle(title);
            postContextRef?.current?.csetState({
                post: {...postContextRef?.current?.post, title},
            });
        },
        [localPostTitle, setLocalPostTitle, postContextRef],
    );

    const postFlavorTitle = 'Choose a title...';
    return (
        <View
            style={{
                width: Dimensions.get('window').width,
                height: 50,
                borderColor: 'blue',
                borderWidth: 0,
            }}>
            <TextInput
                editable={true}
                style={{
                    ...baseText,
                    marginTop: Platform.OS === 'ios' ? -10 : 0,
                    fontSize: 19,
                    marginBottom: 0,
                    marginStart: 20,
                    marginBottom: -10,
                    color: colors.text,
                    height: 50,
                    flex: 1,
                }}
                autoCapitalize="none"
                multiline={false}
                maxLength={2200}
                value={localPostTitle}
                placeholder={postFlavorTitle}
                placeholderTextColor={'grey'}
                textAlign={'left'}
                textAlignVertical={'top'}
                justifyContext={'left'}
                onChangeText={setLocal}
                keyboardAppearance={'dark'}
            />
        </View>
    );
}

function TextInputWrapper({personaID, communityID, postText}) {
    const postContextRef = React.useContext(PostStateRefContext);
    const [localPostText, setLocalPostText] = React.useState(postText);
    const setLocal = React.useCallback(
        txt => {
            setLocalPostText(txt);
            postContextRef?.current?.csetState({
                post: {...postContextRef?.current?.post, text: txt},
            });
        },
        [localPostText, setLocalPostText, postContextRef],
    );
    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    let community = communityMap[communityID];
    const {
        current: {personaMap},
    } = React.useContext(GlobalStateRefContext);

    return (
        <InputPostDescription
            localPostText={localPostText}
            setLocalPostText={setLocal}
            personaName={
                personaID ? personaMap[personaID]?.name : community?.name
            }
        />
    );
}

export default function CreatePostScreen({
    parentNavigation,
    personaID,
    inputPost,
    editPost,
    communityID,
}) {
    const [s3GalleryUris, setS3GalleryUris] = React.useState(
        inputPost?.galleryUris ? inputPost?.galleryUris : [],
    );
    const initWithMedia = React.useContext(CreatePostModalStateContext);
    const postContext = React.useContext(PostStateRefContext);

    React.useEffect(() => {
        if (editPost && !postContext.current.init) {
            parentNavigation.goBack();
        }
    }, []);
    return Platform.OS === 'ios' ? (
        <View
            style={{
                flex: 1,
                paddingTop: 50,
            }}>
            <Header
                personaID={personaID}
                communityID={communityID}
                galleryUris={s3GalleryUris}
                editPost={editPost}
                parentNavigation={parentNavigation}
            />
            <ScrollView
                style={{
                    flexDirection: 'column',
                    backgroundColor: colors.homeBackground,
                }}>
                <AnonymousPostToggle />
                <IdentityBar personaID={personaID} communityID={communityID} />
                <TextInputWrapper
                    personaID={personaID}
                    communityID={communityID}
                    postText={inputPost?.text}
                />
            </ScrollView>
            <UserAutoCompleteWrapped personaID={personaID} />
            {editPost ? (
                <KeyboardAvoidingView
                    style={Styles2.inputBottomTab}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <LineSeperator />
                    <PostTitleInput postTitle={inputPost?.title} />
                    <CreatePostMedia
                        s3GalleryUris={s3GalleryUris}
                        setS3GalleryUris={setS3GalleryUris}
                        initWithMedia={initWithMedia}
                    />
                </KeyboardAvoidingView>
            ) : (
                <View
                    style={{
                        ...Styles2.inputBottomTab,
                    }}>
                    <LineSeperator />
                    <PostTitleInput postTitle={inputPost?.title} />
                    <CreatePostMedia
                        s3GalleryUris={s3GalleryUris}
                        setS3GalleryUris={setS3GalleryUris}
                        initWithMedia={initWithMedia}
                    />
                </View>
            )}
        </View>
    ) : (
        <KeyboardAvoidingView
            style={{
                flex: 1,
                paddingTop: 50,
            }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Header
                personaID={personaID}
                communityID={communityID}
                galleryUris={s3GalleryUris}
                editPost={editPost}
                parentNavigation={parentNavigation}
            />
            <ScrollView
                style={{
                    flexDirection: 'column',
                    backgroundColor: colors.homeBackground,
                }}>
                <AnonymousPostToggle />
                <IdentityBar personaID={personaID} communityID={communityID} />
                <TextInputWrapper
                    personaID={personaID}
                    communityID={communityID}
                    postText={inputPost?.text}
                />
            </ScrollView>
            <UserAutoCompleteWrapped personaID={personaID} />
            {editPost ? (
                <KeyboardAvoidingView
                    style={Styles2.inputBottomTab}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <LineSeperator />
                    <PostTitleInput postTitle={inputPost?.title} />
                    <CreatePostMedia
                        s3GalleryUris={s3GalleryUris}
                        setS3GalleryUris={setS3GalleryUris}
                        initWithMedia={initWithMedia}
                    />
                </KeyboardAvoidingView>
            ) : (
                <KeyboardAvoidingView
                    style={{
                        ...Styles2.inputBottomTab,
                    }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <LineSeperator />
                    <PostTitleInput postTitle={inputPost?.title} />
                    <CreatePostMedia
                        s3GalleryUris={s3GalleryUris}
                        setS3GalleryUris={setS3GalleryUris}
                        initWithMedia={initWithMedia}
                    />
                </KeyboardAvoidingView>
            )}
        </KeyboardAvoidingView>
    );
}

const Styles2 = StyleSheet.create({
    loadingIndicator: {
        marginStart: 12,
    },
    exitReply: {
        width: 30,
        height: 30,
        borderRadius: 30,
        marginRight: 10,
        marginLeft: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyBox: {flex: 1, flexDirection: 'column'},
    replyRow: {
        flex: 1,
        flexDirection: 'row',
        marginLeft: 0,
        paddingTop: 7,
        paddingBottom: 8,
    },
    sendIcon: {
        width: 30,
        height: 25,
        flexDirection: 'column',
        alignContent: 'center',
        justifyContent: 'center',
    },
    commentContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 0,
        paddingTop: 5,
        paddingLeft: 16,
        paddingBottom: 5,
        alignItems: 'center',
    },
    postAction: {
        marginLeft: 10,
        marginRight: 8,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 5,
        paddingRight: 5,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: 'blue',
        borderWidth: 0,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    personImage: {
        top: -3,
        width: 34,
        height: 34,
        borderRadius: 34,
    },
    newCommentTimeline: {
        flex: 1,
        marginTop: -9,
        ...palette.timeline.line,
        marginLeft:
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth -
            15,
        backgroundColor: colors.timeline,
    },
    quotingTimeline: {
        marginTop: -11,
        marginRight: 50,
        ...palette.timeline.line,
        backgroundColor: colors.timeline,
        marginBottom: -10,
    },
    quotingTimelineFeedIn: {
        marginTop: 13,
        marginRight: 50,
        marginBottom: -10,
        marginLeft: palette.timeline.line.marginLeft,
        position: 'absolute',
        width: 46,
        height: 50,
        zIndex: 2,
        borderTopLeftRadius: 20,
        borderLeftWidth: 0.4,
        borderTopWidth: 0.4,
        borderLeftColor: colors.timeline,
        borderTopColor: colors.timeline,
    },
    threadTimelineEnd: {
        position: 'absolute',
        left: palette.timeline.line.marginLeft + 0.8 - 8 / 2,
        width: 8,
        height: 8,
        borderRadius: 8,
        borderWidth: 2,
        top: 7,
        borderColor: palette.timeline.line.backgroundColor,
    },
    textInput: {
        color: 'white',
        fontSize: 16,
        flex: 6,
        backgroundColor: colors.seperatorLineColor,
        color: colors.textBright,
        paddingTop: 5.5,
        paddingBottom: 7,
        paddingLeft: 8,
        borderRadius: 10,
        paddingRight: 10,
    },

    centeredView: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    modalView: {
        margin: 0,
        borderRadius: 20,
        paddingTop: 15,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
        borderColor: 'yellow',
        borderWidth: 0,
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxHeight: Dimensions.get('window').height * 0.75,
        width: Dimensions.get('window').width,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    profilePicture: {
        height: 60,
        width: 60,
        borderRadius: 45,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
    inputBottomTab: {
        flexDirection: 'column',
        borderColor: colors.homeBackground,
        backgroundColor: colors.homeBackground,
    },
});

function UserAutoCompleteWrapped({personaID}) {
    return (
        <UserAutocomplete
            showPings={false}
            style={{
                position: 'absolute',
                top: 420,
                width: 230,
                right: 140,
                borderRadius: 10,
                borderColor: colors.seperatorLineColor,
                borderWidth: 1,
                zIndex: 9999999999999999,
                elevation: 9999999999999999,
            }}
            personaID={personaID}
            isDM={false}
        />
    );
}
