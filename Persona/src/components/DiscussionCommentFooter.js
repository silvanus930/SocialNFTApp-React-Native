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

export default React.memo(DiscussionCommentFooter, propsAreEqual);

function DiscussionCommentFooter({
    parentObjPath,
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
    const showThreadBranch = item.commentKey === state.firstThreadID;
    const numHiddenComments = showThreadBranch
        ? state.numHiddenComments
        : undefined;

    return useMemo(
        () => (
            <DiscussionCommentFooterMemo
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
        ],
    );
}

function DiscussionCommentFooterMemo({
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
}) {
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

    const navToProfileComment = () => navToProfile(item.comment);
    const timelineMarginOffset = Platform.OS === 'ios' ? 4.75 : 4.5;
    const seperatorColor = transparentBackground ? '' : colors.darkSeperator;
    const timestamp =
        item.comment.timestamp?.seconds &&
        timestampToDateString(item.comment.timestamp.seconds);

    return (
        <View>
            <View
                style={{
                    marginLeft: isThread ? THREAD_OFFSET : 0,
                }}>
                <View style={Styles.messagesContainer}>
                    <View style={{flexDirection: 'column', flex: 1}}>
                        <View style={Styles.commentGroupHeader}>
                            <View
                                style={{
                                    ...Styles.commentTimelineCutout,
                                    marginLeft:
                                        palette.timeline.line.marginLeft -
                                        timelineMarginOffset,
                                }}
                            />
                            <View style={Styles.personContainer}>
                                <TouchableOpacity onPress={navToProfileComment}>
                                    <FastImage
                                        source={{
                                            uri:
                                                profileUri !==
                                                    images.personaDefaultProfileUrl &&
                                                profileUri !==
                                                    images.userDefaultProfileUrl
                                                    ? getResizedImageUrl({
                                                          origUrl: profileUri,
                                                          width: Styles
                                                              .personImage
                                                              .width,
                                                          height: Styles
                                                              .personImage
                                                              .height,
                                                      })
                                                    : item.comment?.anonymous
                                                    ? images.personaDefaultProfileUrl
                                                    : images.userDefaultProfileUrl,
                                        }}
                                        style={Styles.personImage}
                                    />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={navToProfileComment}>
                                <Text
                                    style={{
                                        ...baseText,
                                        ...Styles.timestamp,
                                        alignItems: 'flex-end',
                                        justifyContent: 'flex-end',
                                        alignSelf: 'center',
                                        color: colors.maxFaded,
                                        fontSize: 10,
                                    }}>
                                    <Text
                                        style={{
                                            ...baseText,
                                            color: colors.maxFaded,
                                            fontSize: 12,
                                        }}>
                                        {displayName}
                                    </Text>
                                    {' · '}
                                    {timestamp === '0m' ? 'Now' : timestamp}
                                </Text>
                            </TouchableOpacity>

                            <View style={Styles.seenMark}>
                                <SeenCounter numberOthersSeen={numberSeen} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
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
                    <View style={Styles.threadTimeline} />
                    <View style={Styles.threadTimelineEnd} />
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
        height: 30,
        top: 0,
        backgroundColor: colors.homeBackground,
    },
    personImage: {
        width: 22,
        height: 22,
        borderRadius: 22,
        borderColor: colors.timeline,
        borderWidth: 0,
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
        alignSelf: 'flex-start',
        marginStart: 6.5,
        marginEnd: 2,
        width: 30,
    },
    commentGroupHeader: {
        flexDirection: 'row',
        flex: 1,
        marginBottom: 0,
        alignItems: 'center',
    },
    messagesContainer: {
        borderColor: 'orange',
        borderWidth: 0.4,
        flexDirection: 'row',
        paddingTop: 3,
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
});
