import React, {useMemo} from 'react';
import baseText from 'resources/text';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import DiscussionEmojiList from './DiscussionEmojiList';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';
import colors from 'resources/colors';
import {timestampToDateString} from 'utils/helpers';
import images from 'resources/images';
import SeenCounter from 'components/SeenCounter';
import palette from 'resources/palette';
import useDebounce from 'hooks/useDebounce';
import ZeroMarginSeperator from './ZeroMarginSeperator';
import {useNavigation} from '@react-navigation/native';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineStateContext,
} from './DiscussionEngineContext';
import isEqual from 'lodash.isequal';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {useNavToPersona} from 'hooks/navigationHooks';
import getResizedImageUrl from 'utils/media/resize';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(DiscussionCommentHeader, propsAreEqual);

function DiscussionCommentHeader({
    parentObjPath,
    isSelf,
    hideFirstTimelineSegment,
    item,
    THREAD_OFFSET,
    transparentBackground = false,
}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const user = userMap[item.comment.userID];
    const identity = personaMap[item.comment.identityID];
    const numberSeen = (state.numberSeenPerCommentGroup || {})[item.key];
    const showThreadBranch =
        Boolean(item.comment.isThread) ||
        Boolean(item.comment.isThreadReplyHeader);
    const numHiddenComments = showThreadBranch
        ? state.numHiddenComments
        : undefined;

    const commentViewHeight = state.commentViewHeight;
    return useMemo(
        () => (
            <DiscussionCommentHeaderMemo
                isSelf={isSelf}
                parentObjPath={parentObjPath}
                transparentBackground={transparentBackground}
                hideTopTimelineSegment={hideFirstTimelineSegment && item?.first}
                item={item}
                numberSeen={numberSeen}
                identity={identity}
                user={user}
                THREAD_OFFSET={THREAD_OFFSET}
                showThreadBranch={showThreadBranch}
                numHiddenComments={numHiddenComments}
                commentViewHeight={commentViewHeight}
            />
        ),
        [
            hideFirstTimelineSegment,
            item,
            numberSeen,
            identity,
            user,
            THREAD_OFFSET,
            showThreadBranch,
            numHiddenComments,
            commentViewHeight,
        ],
    );
}

function DiscussionCommentHeaderMemo({
    isSelf,
    parentObjPath,
    transparentBackground = false,
    hideTopTimelineSegment,
    item,
    numberSeen,
    identity,
    user,
    THREAD_OFFSET,
    showThreadBranch,
    numHiddenComments,
    commentViewHeight,
}) {
    let isChat = parentObjPath.includes('chat');
    /*console.log(
        'isChat',
        isChat,
        'isSelf',
        isSelf,
        'renderHeaderText',
        renderHeaderText,
    );*/
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const clearThread = () => dispatch({type: 'clearThread'});

    const navigation = useNavigation();

    const navToPersona = useNavToPersona(navigation);

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );

    /*
  const navToProfile = useDebounce(() => {
    if (item.comment.anonymous) {
      if (item.comment?.identityID && item.comment.identityID !== '') {
        navToPersona(item.comment.identityID);
      } else {
        alert('something went wrong!');
      }
    } else {
      navigation.push('Profile', {userID: item.comment.userID});
    }
  });*/
    const navToProfile = React.useCallback(() => {
        if (item.comment.anonymous) {
            if (item.comment?.identityID && item.comment.identityID !== '') {
                navToPersona(item.comment.identityID);
            } else {
                alert('something went wrong!');
            }
        } else {
            profileModalContextRef.current.csetState({
                userID: item.comment.userID,
                showToggle: true,
            });
        }
    }, [item, profileModalContextRef]);

    const displayName = item.comment?.anonymous
        ? identity?.name
        : user?.userName;
    const profileUri = item.comment?.anonymous
        ? identity?.profileImgUrl || images.personaDefaultProfileUrl
        : user.profileImgUrl || images.userDefaultProfileUrl;
    const isThread = Boolean(item.comment?.isThread);
    let imageDimension = 28;

    const navToProfileComment = () => navToProfile(item.comment);
    const timelineMarginOffset = Platform.OS === 'ios' ? 4.75 : 4.5;
    const seperatorColor = transparentBackground ? '' : colors.darkSeperator;
    const timestamp =
        item.comment.timestamp?.seconds &&
        timestampToDateString(item.comment.timestamp.seconds);

    const isThreadParent = item?.comment?.numThreadComments > 0;
    const isThreadReplyHeader = item?.isThreadReplyHeader;

    let renderHeaderText =
        !isChat || (isChat && !isSelf) || (isChat && isThreadParent);

    return (
        <View
            style={{
                borderColor: 'white',
                borderWidth: 0,
                // flex: 1,
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginTop: 16,
                zIndex: 999999999999,
                paddingLeft: 12,
                paddingBottom: 10,
                top: 8,
            }}>
            <FastImage
                source={{
                    uri:
                        profileUri !== images.userDefaultProfileUrl &&
                        profileUri !== images.personaDefaultProfileUrl
                            ? getResizedImageUrl({
                                  origUrl: profileUri,
                                  width: imageDimension,
                                  height: imageDimension.height,
                              })
                            : item.comment.anonymous
                            ? images.personaDefaultProfileUrl
                            : images.userDefaultProfileUrl,
                }}
                style={{
                    borderRadius: 100,
                    width: 28,
                    height: 28,
                    marginRight: 8,
                }}
            />
            {/* <Text style={{color: '#E6E8EB', fontSize: 16, zIndex: 99999}}>
                {displayName}
            </Text> */}
            {showThreadBranch && (
                <>
                    <TouchableOpacity
                        onPress={clearThread}
                        style={{
                            left: 7,
                            top: -20,
                            zIndex: 3,
                            width: 53,
                            height: 80,
                            position: 'absolute',
                            borderRadius: 15,
                        }}
                    />
                    <View
                        style={{
                            ...Styles.threadBreakoutStyle,
                            marginTop: isThreadReplyHeader ? -12 : 8,
                        }}
                    />
                    {!item.comment.isThreadReplyHeader && (
                        <View
                            style={{
                                ...Styles.threadBreakoutLine,
                                height: commentViewHeight[item.commentKey]
                                    ? commentViewHeight[item.commentKey] + 16
                                    : 80,
                            }}
                        />
                    )}
                    {numHiddenComments > 0 && (
                        <Text style={Styles.threadTimelineEndText}>
                            {numHiddenComments}
                        </Text>
                    )}
                </>
            )}
        </View>
    );
}

const Styles = StyleSheet.create({
    threadTimeline: {
        ...palette.timeline.line,
        position: 'absolute',
        height: 26,
        top: 0,
    },
    commentTimeline: {
        ...palette.timeline.line,
        position: 'absolute',
        height: 57,
        top: -12,
        backgroundColor: colors.timeline,
    },
    commentTimelineCutout: {
        ...palette.timeline.line,
        position: 'absolute',
        height: 22,
        top: 0,
        backgroundColor: colors.homeBackground,
    },
    personImage: {
        top: 20,
        width: 28,
        height: 28,
        borderRadius: 22,
        borderColor: colors.timeline,
        borderWidth: 0,
        zIndex: 100,
    },
    threadTimelineEnd: {
        position: 'absolute',
        left: palette.timeline.line.marginLeft + 0.8 - 8 / 2,
        width: 8,
        height: 8,
        borderRadius: 8,
        top: 21,
        backgroundColor: palette.timeline.line.backgroundColor,
    },
    threadTimelineEndText: {
        ...baseText,
        position: 'absolute',
        top: -0,
        ...palette.timeline.numbers,
        marginLeft: palette.timeline.numbers.marginLeft - 4,
    },
    personContainer: {
        borderColor: 'pink',
        borderWidth: 0,
        alignSelf: 'flex-start',
        marginStart: 5,
        marginEnd: 2,
        // width: 30,
        zIndex: 100,
    },
    commentGroupHeader: {
        flexDirection: 'row',
        flex: 0,
        marginBottom: 0,
        alignItems: 'center',
    },
    messagesContainer: {
        borderColor: 'orange',
        borderWidth: 0,
        flexDirection: 'row',
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 4.5,
        alignItems: 'center',
    },
    timestamp: {
        fontSize: 12,
        color: colors.text,
        marginTop: 2,
        marginBottom: 3,
    },
    seenMark: {
        borderColor: 'pink',
        borderWidth: 0,
        alignSelf: 'center',
        marginTop: -2,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        flex: 1,
        marginRight: 8,
    },
    threadBreakoutStyle: {
        marginLeft: palette.timeline.line.marginLeft - 32,
        width: 34,
        height: 37,
        zIndex: -1,
        marginTop: 4,
        borderBottomLeftRadius: 15,
        borderLeftWidth: 0.5,
        borderBottomWidth: 0.5,
        borderLeftColor: colors.seperatorLineColor,
        borderBottomColor: colors.seperatorLineColor,
        position: 'absolute',
    },
    threadBreakoutLine: {
        marginLeft: palette.timeline.line.marginLeft - 32,
        width: 1,
        height: 80,
        zIndex: -1,
        marginTop: -15,
        borderLeftWidth: 0.5,
        borderLeftColor: colors.seperatorLineColor,
        position: 'absolute',
    },
});
