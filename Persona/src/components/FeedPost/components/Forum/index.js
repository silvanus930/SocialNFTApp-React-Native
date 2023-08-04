import React, {useState} from 'react';
import {Pressable, Text, TouchableOpacity, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {DateTime} from 'luxon';
import {
    POST_TYPE_ARTIST,
    POST_TYPE_INVITE,
    POST_TYPE_PROPOSAL,
    POST_TYPE_TRANSFER,
    POST_TYPE_EVENT,
} from 'state/PostState';

import {FileList, InvitedUsers} from 'components/PostCommon';
import PostMedia from 'components/PostMedia';
import DeletePostButton from 'components/DeletePostButton';
import BookmarkPostButton from 'components/BookmarkPostButton';
import DiscussionInlineProposal from 'components/DiscussionInlineProposal';
import EditPostButton from 'components/EditPostButton';
import PinPostButton from 'components/PinPostButton';
import EventLink from 'components/EventLink';

import getResizedImageUrl from 'utils/media/resize';

import images from 'resources/images';
import colors from 'resources/colors';

import styles from './styles';

import ReportContentModal from './components/ReportModal';
import FeedPostText from './components/FeedPostText';

const Forum = ({
    post,
    postKey,
    postType,
    navToPost,
    showUserName,
    navToProfile,
    navToPersona,
    navToPostDiscussion,
    profileUri,
    personaProfileImgUrl,
    width,
    postUserName,
    persona,
    timestamp,
    personaKey,
    postHasMedia,
    noPostTitle,
    isCurrentUserAuthor,
    communityID,
    navigation,
    largeWidth,
    artistPersonaName,
    artistPersonaProfileUrl,
    index,
    registerMediaPlayer,
    maxHeight,
    onHandlerStateChange,
    fileUris,
    compact,
    bookmark,
    forumType,
}) => {
    const [showReportModal, setShowReportModal] = useState(false);

    let postTimestamp;

    if (post?.publishDate?._seconds || post?.publishDate?.seconds) {
        postTimestamp = DateTime.fromSeconds(
            post?.publishDate?._seconds || post?.publishDate?.seconds,
        )
            .toFormat('h:mm a')
            .toLowerCase();
    }

    function showName(showNameValue) {
        const name = showNameValue ? '' : persona.name;
        if (name.length > 17) {
            return `${name.substring(0, 17)}...`;
        }
        return name;
    }

    const iconWidth = 36;
    const timer = React.useRef(0);

    const isInvite = post?.type === POST_TYPE_INVITE;
    const isProposal = post?.type === POST_TYPE_PROPOSAL;
    const isEvent = post?.type === POST_TYPE_EVENT;
    const isArtist = post?.type === POST_TYPE_ARTIST;

    return (
        <View key={postKey} style={styles.container}>
            <View style={{flex: 1}}>
                <Pressable
                    onPressIn={() => {
                        timer.current = new Date().getTime();
                    }}
                    onPress={() => {
                        if (new Date().getTime() - timer.current > 200) {
                            return;
                        }
                        navToPost();
                    }}>
                    <View style={styles.reportModalContainer}>
                        <ReportContentModal
                            post={post}
                            postUserName={postUserName}
                            showUserName={showUserName}
                            persona={persona}
                            showReportModal={showReportModal}
                            setShowReportModal={setShowReportModal}
                        />
                    </View>
                    <View style={styles.userInfoContainer}>
                        <View>
                            <TouchableOpacity
                                onPress={
                                    showUserName ? navToProfile : navToPersona
                                }
                                disabled={false}
                                style={{marginLeft: 1}}>
                                <FastImage
                                    source={{
                                        uri: (
                                            showUserName
                                                ? profileUri
                                                : personaProfileImgUrl
                                        )
                                            ? getResizedImageUrl({
                                                  origUrl: showUserName
                                                      ? profileUri
                                                      : personaProfileImgUrl,
                                                  width: width,
                                                  height: width,
                                              })
                                            : showUserName
                                            ? images.userDefaultProfileUrl
                                            : images.personaDefaultProfileUrl,
                                    }}
                                    style={{
                                        width: width,
                                        height: width,
                                        borderRadius: width,
                                        borderColor: colors.postAction,
                                        borderWidth: 0,
                                    }}
                                />
                            </TouchableOpacity>
                        </View>

                        <View>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                }}
                                onPress={
                                    showUserName ? navToProfile : navToPersona
                                }
                                disabled={showUserName ? false : true}
                                hitSlop={{
                                    top: 10,
                                    bottom: 10,
                                    left: 0,
                                    right: 0,
                                }}>
                                <View style={styles.userNameContainer}>
                                    <Text style={styles.userNameText}>
                                        {showUserName
                                            ? postUserName
                                            : persona.name}

                                        <Text style={styles.timeStampText}>
                                            {'  '}
                                            {post?.publishDate?._seconds ||
                                            post?.publishDate?.seconds
                                                ? timestamp === '0m'
                                                    ? 'Now'
                                                    : timestamp
                                                : '(unpublished)'}
                                        </Text>
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {true && (
                        <View style={styles.postContainer}>
                            <View style={styles.postSubContainer}>
                                <View style={{flexDirection: 'row'}}>
                                    <Text
                                        numberOfLines={3}
                                        style={styles.postTitle}>
                                        {isProposal
                                            ? '     '
                                            : noPostTitle
                                            ? 'untitled'
                                            : post?.title || 'Untitled Post'}
                                    </Text>
                                    <View style={styles.postDetailContainer}>
                                        <View>
                                            <TouchableOpacity
                                                onPress={() =>
                                                    setShowReportModal(true)
                                                }
                                                style={{
                                                    right: 0,
                                                    position: 'absolute',
                                                }}>
                                                <MaterialIcons
                                                    name="report"
                                                    size={24}
                                                    color={colors.maxFaded}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <PinPostButton
                                            communityID={communityID}
                                            postID={postKey}
                                            personaID={personaKey}
                                            inStudio={false}
                                            cameFrom={'homePost/PostHeader'}
                                            size={23}
                                            style={styles.pinPostButton}
                                            background={true}
                                            navigation={navigation}
                                            persona={{
                                                ...persona,
                                                pid: personaKey,
                                            }}
                                            postType={postType}
                                            post={post}
                                            forumType={forumType}
                                        />
                                        {true &&
                                        post?.type !== POST_TYPE_TRANSFER &&
                                        isCurrentUserAuthor ? (
                                            <EditPostButton
                                                communityID={communityID}
                                                postID={postKey}
                                                inStudio={false}
                                                cameFrom={'homePost/PostHeader'}
                                                size={19.5}
                                                style={styles.editPostButton}
                                                background={true}
                                                navigation={navigation}
                                                persona={{
                                                    ...persona,
                                                    pid: personaKey,
                                                }}
                                                post={post}
                                            />
                                        ) : null}
                                        <BookmarkPostButton
                                            communityID={communityID}
                                            personaID={personaKey}
                                            postID={postKey}
                                            inStudio={false}
                                            cameFrom={'homePost/PostHeader'}
                                            size={17.5}
                                            style={styles.bookMarkPostButton}
                                            background={true}
                                            navigation={navigation}
                                            persona={{
                                                ...persona,
                                                pid: personaKey,
                                            }}
                                            post={post}
                                        />
                                        {true &&
                                        post?.type !== POST_TYPE_TRANSFER &&
                                        isCurrentUserAuthor ? (
                                            <DeletePostButton
                                                communityID={communityID}
                                                personaID={personaKey}
                                                postID={postKey}
                                                inStudio={false}
                                                cameFrom={'homePost/PostHeader'}
                                                size={17.5}
                                                style={{
                                                    borderWidth: 0,
                                                }}
                                                background={true}
                                                navigation={navigation}
                                                persona={{
                                                    ...persona,
                                                    pid: personaKey,
                                                }}
                                                post={post}
                                            />
                                        ) : null}
                                    </View>
                                </View>


                                {true && (
                                    <View
                                        style={{
                                            borderWidth: 0,
                                            borderColor: 'orange',
                                            flexDirection: 'row',
                                            marginStart: 5,
                                            marginTop: 10,
                                        }}>
                                        <View>
                                            <TouchableOpacity
                                                onPress={navToProfile}
                                                disabled={false}
                                                style={{}}>
                                                <FastImage
                                                    source={{
                                                        uri:
                                                            profileUri &&
                                                            !post?.anonymous
                                                                ? getResizedImageUrl(
                                                                      {
                                                                          origUrl:
                                                                              profileUri,
                                                                          width:
                                                                              iconWidth -
                                                                              10,
                                                                          height:
                                                                              iconWidth -
                                                                              10,
                                                                      },
                                                                  )
                                                                : post?.anonymous
                                                                ? images.userDefaultProfileUrl
                                                                : images.personaDefaultProfileUrl,
                                                    }}
                                                    style={{
                                                        width: iconWidth - 15,
                                                        height: iconWidth - 15,
                                                        borderRadius: 100,
                                                        borderColor:
                                                            colors.postAction,
                                                        borderWidth: 0,
                                                    }}
                                                />
                                            </TouchableOpacity>
                                        </View>

                                        <View
                                            style={{
                                                flex: 1,
                                                marginStart: 12,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                            }}>
                                            <Text
                                                style={{
                                                    fontWeight: '400',
                                                    color: '#D0D3D6',
                                                    fontSize: 14,
                                                }}>
                                                {post?.anonymous
                                                    ? 'anonymous'
                                                    : postUserName}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontWeight: '400',
                                                    color: '#D0D3D6',
                                                    fontSize: 14,
                                                    paddingLeft: 10,
                                                }}>
                                                ·
                                            </Text>
                                            {showName(showUserName) !== '' && (
                                                <>
                                                    <Text
                                                        style={{
                                                            fontWeight: '400',
                                                            color: '#D0D3D6',
                                                            fontSize: 14,
                                                            paddingLeft: 10,
                                                        }}>
                                                        {showName(showUserName)}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontWeight: '400',
                                                            color: '#D0D3D6',
                                                            fontSize: 14,
                                                            paddingLeft: 10,
                                                        }}>
                                                        ·
                                                    </Text>
                                                </>
                                            )}

                                            <Text
                                                style={{
                                                    marginStart: 8,
                                                    fontWeight: '400',
                                                    color: '#D0D3D6',
                                                    fontSize: 14,
                                                }}>
                                                {postTimestamp}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </Pressable>
                {isArtist && (
                    <View style={styles.artistContainer}>
                        <View style={styles.artistSubContainer(largeWidth)} />
                        <TouchableOpacity
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                            disabled={artistPersonaName === ''}
                            onPress={null}>
                            <FastImage
                                source={{
                                    uri: getResizedImageUrl({
                                        origUrl: artistPersonaProfileUrl,
                                        width: largeWidth - 15,
                                        height: largeWidth - 15,
                                    }),
                                }}
                                style={styles.artistImage(
                                    largeWidth,
                                    artistPersonaName,
                                )}
                            />
                            <Text style={styles.artistText(artistPersonaName)}>
                                {'  '}
                                {artistPersonaName !== ''
                                    ? artistPersonaName
                                    : ' This persona has since been deleted'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isInvite && (
                    <View style={{left: 6, marginTop: 3}}>
                        <InvitedUsers
                            invitedUsers={post?.invitedUsers}
                            navigation={navigation}
                        />
                    </View>
                )}

                {isProposal && (
                    <TouchableOpacity
                        onPress={navToPost}
                        style={{
                            paddingLeft: 15,
                            paddingRight: 15,
                            marginBottom: 10,
                        }}>
                        <DiscussionInlineProposal
                            post={post}
                            proposal={{
                                ...post?.proposal,
                                personaID: personaKey,
                                proposalTitle: post?.title,
                                proposalRef: post?.proposalRef,
                            }}
                        />
                    </TouchableOpacity>
                )}

                {isEvent && <View style={{marginTop:10, marginBottom:30}}><EventLink title={post?.title} postKey={postKey} /></View>}

                {!compact && postHasMedia && (
                    <View style={styles.postMediaContainer}>
                        <PostMedia
                            touchableOverride={navToPost}
                            postKey={postKey}
                            personaKey={personaKey}
                            enableMediaFullScreenButton={true}
                            index={index || postKey}
                            muted={true}
                            offset={40}
                            mediaDisabled={false}
                            navigation={navigation}
                            startPaused={false}
                            registerMediaPlayer={registerMediaPlayer}
                            post={post}
                            style={styles.postMedia(maxHeight)}
                        />
                    </View>
                )}

                {true && (
                    <Pressable
                        onPressIn={() => {
                            timer.current = new Date().getTime();
                        }}
                        onPress={() => {
                            if (new Date().getTime() - timer.current > 200) {
                                return;
                            }
                            navToPost();
                        }}>
                        <FeedPostText
                            post={post}
                            persona={persona}
                            navToPost={navToPost}
                            cacheNumComments={post?.numComments || 0}
                            hasMedia={postHasMedia}
                            navToPostDiscussion={navToPostDiscussion}
                            text={post?.text || ''}
                            onHandlerStateChange={onHandlerStateChange}
                            personaKey={personaKey}
                            postKey={postKey}
                            postType={postType}
                            compact={compact}
                            bookmark={bookmark}
                        />
                        {fileUris.length ? (
                            <FileList fileUris={fileUris} />
                        ) : null}
                    </Pressable>
                )}
            </View>
        </View>
    );
};

export default Forum;
