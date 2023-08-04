import auth from '@react-native-firebase/auth';
import {useRoute} from '@react-navigation/native';
import Timestamp from 'components/Timestamp';
import isEqual from 'lodash.isequal';
import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from 'resources/colors';
import images from 'resources/images';
import palette from 'resources/palette';
import baseText from 'resources/text';
import {OptionsModalStateContext} from 'state/OptionsModalState';
import {POST_TYPE_TRANSFER} from 'state/PostState';

import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import getResizedImageUrl from 'utils/media/resize';
import fonts from 'resources/fonts';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export const MoreComponent = ({
    isCurrentUserAuthor,
    postID,
    communityID,
    persona,
    personaID,
    post,
}) => {
    //console.log('MoreComponent', post);
    showMore = false;

    const {csetState} = React.useContext(OptionsModalStateContext);

    const toggleModal = React.useCallback(() => {
        csetState({
            showToggle: true,
            post: post,
            communityID: communityID,
            persona: persona,
            postID: postID,
            personaID: personaID,
            isCurrentUserAuthor: isCurrentUserAuthor,
        });
    }, [csetState, postID, persona, personaID, post, isCurrentUserAuthor]);

    return (
        <View>
            <TouchableOpacity
                hitSlop={{
                    top: 50,
                    bottom: 20,
                    left: 30,
                    right: 50,
                }}
                style={{opacity: post?.type === POST_TYPE_TRANSFER ? 0 : 1}}
                disabled={post?.type === POST_TYPE_TRANSFER}
                onPress={toggleModal}>
                <FontAwesome color={colors.maxFaded} name={'bars'} size={22} />
            </TouchableOpacity>
        </View>
    );
};
export default React.memo(PostHeader, propsAreEqual);
function PostHeader({
    disableNav = false,
    header = false,
    navigation,
    post,
    communityID,
    postKey,
    personaName,
    personaKey,
    personaProfileImgUrl,
    persona,
}) {
    const route = useRoute();
    const [postUserProfileImgUrl, setPostUserProfileImgUrl] = useState();
    const [postUserName, setPostUserName] = useState();
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);

    // get user image profile url
    useEffect(() => {
        const postUser = userMap[post.userID];
        const profileImgUrl =
            postUser?.profileImgUrl || images.userDefaultProfileUrl;
        setPostUserProfileImgUrl(profileImgUrl);
        setPostUserName(post.anonymous ? personaName : postUser?.userName);
    }, [userMap, post.userID]);

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );

    const navToProfile = React.useCallback(() => {
        if (post.anonymous && !disableNav) {
            if (post?.identityID && post.identityID !== '') {
                profileModalContextRef.current.csetState({
                    userID: 'PERSONA::' + post.identityID,
                    showToggle: true,
                });
            } else {
                profileModalContextRef.current.csetState({
                    userID: 'PERSONA::' + personaKey,
                    showToggle: true,
                });
            }
        } else {
            //console.log();
            profileModalContextRef.current.csetState({
                showToggle: true,
                userID: post.userID,
            });
        }
    }, [
        profileModalContextRef,
        navigation,
        post,
        post.userID,
        personaKey,
        personaName,
        personaProfileImgUrl,
        disableNav,
    ]);

    const isCurrentUserAuthor = persona?.authors?.includes(
        auth().currentUser?.uid,
    );
    let headerSize = 27;
    let MAX_LENGTH = 30;

    return (
        <View style={Styles.container}>
            <View style={Styles.nameContainer}>
                <TouchableOpacity
                    style={{zIndex: 2, elevation: 2}}
                    onPress={navToProfile}
                    disabled={
                        (route.name === 'Persona' && post.anonymous) ||
                        disableNav
                    }>
                    <FastImage
                        source={{
                            uri: getResizedImageUrl({
                                origUrl: post.anonymous
                                    ? post.identityID
                                        ? personaMap[post.identityID]
                                              ?.profileImgUrl ||
                                          images.personaDefaultProfileUrl
                                        : personaProfileImgUrl ||
                                          images.personaDefaultProfileUrl
                                    : postUserProfileImgUrl,
                                height: header
                                    ? headerSize
                                    : Styles.personImage.height,
                                width: header
                                    ? headerSize
                                    : Styles.personImage.width,
                            }),
                        }}
                        style={{
                            ...Styles.personImage,
                            top: 1,
                            width: header
                                ? headerSize
                                : Styles.personImage.width,
                            height: header
                                ? headerSize
                                : Styles.personImage.height,
                            borderWidth: 1,
                            borderColor: colors.timeline,
                        }}
                    />
                </TouchableOpacity>

                <View
                    style={{
                        ...Styles.rightContainer,
                    }}>
                    <View
                        style={{
                            paddingTop: 9,
                            paddingBottom: 3,
                            flex: 0,
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            borderColor: 'yellow',
                            borderWidth: 0,
                        }}>
                        {
                            <TouchableOpacity
                                onPress={navToProfile}
                                style={{flex: 1, top: 5}}
                                disabled={
                                    (route.name === 'Persona' &&
                                        post.anonymous) ||
                                    disableNav
                                }>
                                <Text
                                    style={{
                                        ...baseText,
                                        lineHeight: null,
                                        paddingBottom: 0,
                                        marginBottom: -5,
                                        marginTop: -20,
                                        top: 10,
                                        color: colors.faded,
                                        marginStart: 8,
                                    }}>
                                    <>
                                        <Text
                                            style={{
                                                ...baseText,
                                                color: colors.text,
                                                fontFamily: fonts.regular,
                                                fontSize: 12,
                                                lineHeight: null,
                                            }}>
                                            {postUserName}
                                        </Text>
                                    </>
                                </Text>
                            </TouchableOpacity>
                        }
                        <View
                            style={{
                                flexDirection: 'row',
                            }}>
                            <View
                                style={{
                                    borderColor: 'green',
                                    borderWidth: 0,
                                    flexDirection: 'row',
                                    marginStart: 8,
                                    padding: 0,
                                }}>
                                <Text
                                    style={{
                                        ...baseText,
                                        fontFamily: fonts.semibold,
                                        fontSize: header ? 13 : 13,
                                        color: colors.text,
                                    }}>
                                    {header
                                        ? post.title
                                              ?.trim()
                                              .substring(0, MAX_LENGTH)
                                              .trim() +
                                          (post?.title?.trim().length >
                                          MAX_LENGTH
                                              ? '...'
                                              : '')
                                        : post.title?.trim()}
                                </Text>
                                <View
                                    style={{
                                        left: 4,
                                        top: 1.3,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                    <Timestamp
                                        top={1}
                                        color={colors.textFaded}
                                        seconds={post.publishDate.seconds}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            top: 8,
                            flexDirection: 'row',
                            marginEnd: 10,
                            borderColor: 'mangenta',
                            borderWidth: 0,
                        }}>
                        <View style={{marginEnd: 20}}>
      {/*<FollowPersonaBig
                                showUnfollow={true}
                                personaID={personaKey}
                            />*/}
                        </View>
                        <View style={{marginTop: 1, marginRight: 10.5}}>
                            <MoreComponent
                                communityID={communityID}
                                isCurrentUserAuthor={isCurrentUserAuthor}
                                post={post}
                                persona={persona}
                                postID={postKey}
                                personaID={personaKey}
                                navigation={navigation}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const Styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingTop: 8,
        marginTop: 12,
        marginBottom: 25,
        marginEnd: 0,
        padding: 5,
        alignItems: 'center',
        height: 45,
        paddingBottom: 0,
        borderWidth: 0,
        borderColor: 'red',
        flex: 1,
    },

    rightContainer: {
        borderColor: 'blue',
        borderWidth: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flex: 1,
    },

    bottomContainer: {
        flex: 15,
        marginLeft: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    collabContainer: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },

    collabText: {
        zIndex: 1001,
        elevation: 1001,
        marginStart: 10,
        color: colors.actionText,
        fontSize: 14,
        marginTop: -2,
        marginRight: 4,
        paddingRight: 10,
    },

    nameContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderColor: 'red',
        borderWidth: 0,
    },

    personImage: {
        width: 24,
        height: 24,
        borderRadius: 36,
        borderWidth: 1,
        elevation: 100000,
        zIndex: 100000,
        borderColor: colors.seperatorLineColor,
    },

    postTitle: {
        lineHeight: null,
        fontFamily: fonts.medium,
        color: colors.text,
        fontSize: 14,
        marginStart: 10,
    },

    personName: {
        color: colors.text,
        fontSize: 14,
        marginStart: 10,
    },

    placeName: {
        color: colors.text,
        marginStart: 10,
        fontSize: 14,
    },

    iconMore: {
        height: 15,
        width: 15,
    },

    editPostTimeline: {
        ...palette.timeline.line,
        marginLeft:
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth,
        zIndex: 4,
        elevation: 4,
    },
    editPostBreakout: {
        position: 'absolute',
        marginLeft:
            1 +
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth,
        borderLeftWidth: palette.timeline.line.width,
        borderTopWidth: palette.timeline.line.width,
        borderTopLeftRadius: 37,
        width: 83,
        height: 60,
        marginTop: 67,
        borderTopColor: colors.timeline,
        borderLeftColor: colors.timeline,
        zIndex: 5,
        elevation: 5,
    },
    editPost: {
        borderRadius: 50,
        borderWidth: 1,
        backgroundColor: colors.homeBackground,
    },
    timelineCutout: {
        // ...palette.timeline.line,
        // position: 'absolute',
        height: 36,
        width: 100,
        // top: 0,
        backgroundColor: 'red',
    },
    expandButton: {
        opacity: 1,
        position: 'absolute',
        // backgroundColor: '#737373',
        width: 20,
        height: 20,
        left: 10,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        zIndex: 3000,
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
});
