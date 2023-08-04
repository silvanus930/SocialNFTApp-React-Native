import baseText from 'resources/text';
import fonts from 'resources/fonts';
import {PresenceFeedStateContext} from 'state/PresenceFeedState';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {PresenceStateContext} from 'state/PresenceState';
import MintNFTButton from 'components/MintNFTButton';
import {
    TouchableOpacity,
    Dimensions,
    FlatList,
    Clipboard,
    StyleSheet,
    View,
    Text,
    Animated,
    Platform,
} from 'react-native';
import {State} from 'react-native-gesture-handler';
import isEqual from 'lodash.isequal';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Feather';
import PostMedia from 'components/PostMedia';
import React, {useCallback, useContext} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
    POST_TYPE_ARTIST,
    POST_TYPE_INVITE,
    POST_TYPE_PROPOSAL,
    POST_TYPE_TRANSFER,
    POST_TYPE_EVENT,
} from 'state/PostState';
import colors from 'resources/colors';
import palette from 'resources/palette';
import {useNavToPersona} from 'hooks/navigationHooks';
import FastImage from 'react-native-fast-image';
import images from 'resources/images';
import {vanillaPersona} from 'state/PersonaState';
import {FeedMenuDispatchContext} from 'state/FeedStateContext';
import {
    AutoSavePostText,
    InvitedUsers,
    PostEndorsements,
} from 'components/PostCommon';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineFrameStateContext,
} from 'components/DiscussionEngineContext';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import getResizedImageUrl from 'utils/media/resize';
import {safeAreaOffset} from 'components/DiscussionEngineConstants';
import DiscussionInlineProposal from 'components/DiscussionInlineProposal';
import EventLink from 'components/EventLink';
import TransactionActions from './components/TransactionActions';
import Transfer from 'components/FeedPost/components/Transfer';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}
export default React.memo(Post, propsAreEqual);

function Post(props) {
    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    const postHeight = frameState.postHeight;
    const contentLength = frameState.contentLength;
    const approxKeyboardHeight = 300;
    const addPadding = approxKeyboardHeight - 100 > contentLength - postHeight;

    return React.useMemo(
        () => <PostWrapped {...props} addPadding={addPadding} />,
        [addPadding, props],
    );
}

function PostWrapped({
    addPadding,
    animatedKeyboardOffset,
    personaName,
    personaKey,
    persona,
    post,
    small = false,
    postKey,
    navigation,
    personaProfileImgUrl,
    mediaDisabled = false,
    navToPost = false,
    registerMediaPlayer = null,
    startPaused = true,
    index = undefined,
    showSeperator = false,
    mediaBorderRadius = 0,
    style = {},
}) {
    console.log('RENDER PostDiscussionPost', post);
    const {dispatch: menuDispatch} = React.useContext(FeedMenuDispatchContext);
    const textOpacity = React.useRef(new Animated.Value(1)).current;
    const [proposal, setProposal] = React.useState(null);

    const onHandlerStateChange = ({nativeEvent}) => {
        if (nativeEvent.state === State.BEGAN) {
            Animated.timing(textOpacity, {
                toValue: 0.95,
                duration: 20,
                useNativeDriver: true,
            }).start();
        }
        if (nativeEvent.oldState === State.ACTIVE) {
            menuDispatch({
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
    };
    let postStyle = Styles.post;
    if (!showSeperator) {
        postStyle = {...postStyle, borderBottomWidth: 0, ...style};
    }
    const postHasMedia = Boolean(
        post?.mediaUrl || post?.galleryUris?.length || post?.imgUrl,
    );
    const onHandlerStateChangeNoOpacity = ({nativeEvent}) => {
        if (nativeEvent.state === State.END) {
            menuDispatch({
                type: 'openEndorsementsMenu',
                payload: {
                    touchY: nativeEvent.absoluteY,
                    postKey,
                    personaKey,
                },
            });
        }
    };

    const isCurrentUserAuthor = persona?.authors?.includes(
        auth().currentUser?.uid,
    );
    const myUserID = auth().currentUser?.uid;
    const myPersona = persona?.authors?.includes(myUserID);
    const myPost = post?.userID === myUserID || (myPersona && post?.anonymous);

    const isInvite = post?.type === POST_TYPE_INVITE;
    const isProposal = post?.type === POST_TYPE_PROPOSAL;
    const isEvent = post?.type === POST_TYPE_EVENT;
    const isTransfer = post?.type === POST_TYPE_TRANSFER;

    return (
        <View
            style={{
                flexDirection: 'column',
                backgroundColor: colors.gridBackground,
                borderWidth: 0,
                borderColor: 'magenta',
                marginBottom: 12,
            }}>
            <ManageHeader
                personaKey={personaKey}
                postKey={postKey}
                post={post}
                persona={persona}
                personaName={personaName}
                personaProfileImgUrl={personaProfileImgUrl}
                navigation={navigation}
            />

            {isTransfer ? (
                <>
                    <Transfer
                        postKey={postKey}
                        post={post}
                        navToPost={navToPost}
                    />
                    <TransactionActions transfer={post?.transfer} />
                </>
            ) : (
                <View style={postStyle}>
                    {isInvite && (
                        <View style={{left: 16}}>
                            <InvitedUsers
                                invitedUsers={post?.invitedUsers}
                                navigation={navigation}
                            />
                        </View>
                    )}
                    {!isProposal && (
                        <View
                            style={{
                                borderColor: 'orange',
                                borderWidth: 0,
                                marginStart: 20,
                                marginEnd: 20,
                                marginTop: 20,
                            }}>
                            <Text
                                style={{
                                    ...baseText,
                                    fontWeight: '500',
                                    fontSize: 18,
                                    color: !post?.title
                                        ? colors.maxFaded
                                        : colors.textBright,
                                    marginBottom: postHasMedia ? 16 : 0,
                                }}>
                                {post?.title}
                            </Text>
                        </View>
                    )}
                    {isProposal && post?.proposal && (
                        <View
                            style={{
                                padding: 16,
                            }}>
                            <DiscussionInlineProposal
                                disableNav
                                proposal={{
                                    ...post?.proposal,
                                    personaID: persona.pid,
                                    proposalTitle: post.title,
                                    proposalRef: post.proposalRef,
                                }}
                            />
                        </View>
                    )}
                    <PostMediaDisplay
                        addPadding={addPadding}
                        animatedKeyboardOffset={animatedKeyboardOffset}
                        myPersona={myPersona}
                        myPost={myPost}
                        textOpacity={textOpacity}
                        onHandlerStateChangeNoOpacity={
                            onHandlerStateChangeNoOpacity
                        }
                        onHandlerStateChange={onHandlerStateChange}
                        navToPostDiscussion={() => {}}
                        postHasMedia={postHasMedia}
                        post={post}
                        small={small}
                        postKey={postKey}
                        personaKey={personaKey}
                        navigation={navigation}
                        mediaDisabled={mediaDisabled}
                        navToPost={navToPost}
                        registerMediaPlayer={registerMediaPlayer}
                        startPaused={startPaused}
                        index={index}
                        mediaBorderRadius={mediaBorderRadius}
                    />
                    {isEvent && (
                        <View style={{margin: 10}}>
                            <EventLink title={post?.title} postKey={postKey} />
                        </View>
                    )}
                    <EndorsementsRow
                        personaKey={personaKey}
                        postKey={postKey}
                    />
                    <View style={{marginRight: 40}}>
                        <MintNFTButton
                            post={post}
                            postID={postKey}
                            isCurrentUserAuthor={isCurrentUserAuthor}
                            personaID={personaKey}
                            size={18}
                            containerStyle={{
                                marginLeft: 42,
                                marginBottom: 5,
                                marginTop: 10,
                            }}
                            style={{
                                zIndex: 1000,
                                elevation: 1000,
                                borderWidth: 0,
                                borderColor: 'blue',
                                marginRight: 10,
                                marginEnd: 15,
                                left: 0,
                            }}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

function PostMediaDisplay({
    addPadding,
    animatedKeyboardOffset,
    myPost,
    myPersona,
    postHasMedia,
    post,
    small = false,
    postKey,
    navigation,
    mediaDisabled = false,
    registerMediaPlayer = null,
    startPaused = true,
    index = undefined,
    mediaBorderRadius = 0,
    personaKey,
}) {
    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);

    const subPersona = personaMap[post.subPersonaID]
        ? personaMap[post.subPersonaID]
        : vanillaPersona;

    const fileUris = post.fileUris ? post.fileUris : [];
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const onFocusPostText = () => {
        if (!addPadding) {
            animatedKeyboardOffset.value = safeAreaOffset;
        }
        dispatch({type: 'setEditingPost', payload: true});
    };
    const onBlurPostText = () => {
        dispatch({type: 'setEditingPost', payload: false});
    };
    const isArtist = post?.type === POST_TYPE_ARTIST;
    return (
        <View style={{marginStart: 0}}>
            <PostMedia
                postKey={postKey}
                personaKey={personaKey}
                enableMediaFullScreenButton={true}
                index={index || postKey}
                mediaDisabled={mediaDisabled}
                navigation={navigation}
                startPaused={startPaused}
                style={{borderTopLeftRadius: 8, borderTopRightRadius: 8}}
                offset={40}
                registerMediaPlayer={registerMediaPlayer}
                small={small}
                post={post}
                style={{
                    borderRadius: mediaBorderRadius,
                    marginTop: 0,
                }}
            />
            {isArtist && (
                <ArtistWrapped
                    navigation={navigation}
                    subPersona={subPersona}
                />
            )}
            <View style={{marginStart: 0, marginTop: 6, marginEnd: 0}}>
                {/* Inline edit does not work on Android in post discussion because
         the component is scale inverted. This is fixable by moving the
         post discussion components outside of the inverted list header,
         however, it will require updating some measurements in the
         discussion engine - expect 4-8 hours of bugfixing.*/}
                <AutoSavePostText
                    inlineEditDisable={true}
                    onFocusPostText={onFocusPostText}
                    onBlurPostText={onBlurPostText}
                    postKey={postKey}
                    hasMedia={postHasMedia}
                    personaKey={personaKey}
                    fullText={post.text}
                    displayText={post.text}
                    myPersona={myPersona}
                    myPost={myPost}
                    postAnonymous={post?.anonymous}
                    postIdentityID={post?.identityID}
                />
            </View>
            {fileUris.length ? <FileList fileUris={fileUris} /> : null}
        </View>
    );
}

function ArtistWrapped({subPersona, navigation}) {
    const navToPersona = useNavToPersona(navigation);
    const navToArtist = () => navToPersona(subPersona.pid);

    const width = 50;
    const subPersonaExists =
        subPersona?.name !== undefined && subPersona?.name !== '';
    return (
        <View
            style={{
                left: 50,
                marginTop: 35,
                marginBottom: 10,
            }}>
            {Platform.OS === 'ios' ? (
                <LinearGradient
                    colors={[
                        colors.background,
                        colors.timeline,
                        colors.timeline,
                        colors.background,
                    ]}
                    style={Styles.artistTimeline}
                />
            ) : (
                <View style={Styles.artistTimeline} />
            )}
            <View style={Styles.artistPostBreakout} />
            <View
                style={{
                    position: 'absolute',
                    top: -1,
                    width: width,
                    height: width,
                    borderRadius: width,
                    borderWidth: 1.5,
                    borderColor: colors.seperatorLineColor,
                    backgroundColor: colors.homeBackground,
                    zIndex: 4,
                }}
            />
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    top: 0,
                    alignItems: 'center',
                    zIndex: 4,
                }}
                disabled={!subPersonaExists}
                onPress={navToArtist}>
                <FastImage
                    source={{
                        uri: getResizedImageUrl({
                            origUrl:
                                subPersona.profileImgUrl ||
                                images.personaDefaultProfileUrl,
                            width: width,
                            height: width,
                        }),
                    }}
                    style={{
                        width: width,
                        height: width,
                        borderRadius: width,
                        borderWidth: 1.5,
                        borderColor: colors.timeline,
                        opacity: subPersonaExists ? 1 : 0.5,
                    }}
                />
                <Text
                    style={{
                        ...baseText,
                        color: subPersonaExists
                            ? colors.text
                            : colors.textFaded2,
                        fontWeight: subPersonaExists ? 'bold' : null,
                        fontSize: 14,
                        opacity: subPersonaExists ? 1 : 0.7,
                    }}>
                    {'  '}
                    {subPersonaExists
                        ? subPersona.name
                        : ' This persona has since been deleted'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

function FileList({fileUris}) {
    const renderItem = useCallback(({item}) => {
        return (
            <TouchableOpacity
                onPress={() => Clipboard.setString(item.uri)}
                style={{
                    borderColor: 'blue',
                    borderWidth: 0,
                    marginLeft: 5,
                    marginTop: -5,
                    width: 50,
                    zIndex: 100,
                    elevation: 100,
                    marginStart: 15,
                    marginEnd: 15,
                }}>
                <Icon
                    color={'white'}
                    style={{
                        zIndex: 0,
                        elevation: 0,
                        borderRadius: 5,
                        backgroundColor: colors.defaultImageBackground,
                        marginTop: 10,
                    }}
                    size={22}
                    name={'file'}
                />
                <View
                    style={{
                        alignSelf: 'center',
                        borderWidth: 0,
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            color: colors.weakEmphasisOrange,
                            fontSize: 14,
                        }}>
                        {item.name}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }, []);

    return (
        <FlatList
            bounces={false}
            showsHorizontalScrollIndicator={false}
            style={{
                borderColor: 'purple',
                borderWidth: 0,
                flexDirection: 'row-reverse',
            }}
            contentContainerStyle={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                alignSelf: 'center',
                justifyContent: 'center',
            }}
            horizontal={true}
            data={fileUris}
            keyExtractor={item => {
                return item.uri;
            }}
            renderItem={renderItem}
        />
    );
}

export const Styles = StyleSheet.create({
    blackboardButton: {
        borderWidth: 1,
        borderColor: colors.maxFaded,
        padding: 7,
        borderRadius: 25,
    },
    blackboardButtonText: {
        fontSize: 14,
        color: colors.text,
    },
    promiseContainer: {
        position: 'absolute',
        left: 27,
        top: 7,
    },
    promiseEndUp: {
        ...palette.timeline.line,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderBottomLeftRadius: 13,
        borderBottomColor: colors.timeline,
        borderLeftColor: colors.timeline,
        width: 30,
        marginLeft: 4,
        marginTop: 29.5,
        position: 'absolute',
        height: 23,
        backgroundColor: null,
    },
    promiseText: {
        marginStart: 21,
        paddingRight: 10,
        color: colors.textFaded2,
        fontWeight: 'bold',
        fontSize: 14,
        marginTop: 4,
        marginRight: 4,
    },
    promiseUp: {
        position: 'absolute',
        marginLeft: 1,
        marginTop: 22.5,
        width: 8,
        height: 8,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: colors.timeline,
    },
    promiseEndDown: {
        ...palette.timeline.line,
        borderLeftWidth: 2,
        borderTopWidth: 2,
        borderTopLeftRadius: 13,
        borderTopColor: colors.timeline,
        borderLeftColor: colors.timeline,
        width: 30,
        marginLeft: 4,
        marginTop: 49.5,
        position: 'absolute',
        height: 23,
        backgroundColor: null,
    },
    promiseDown: {
        position: 'absolute',
        marginLeft: 1,
        marginTop: 70.5,
        width: 8,
        height: 8,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: colors.timeline,
        backgroundColor: colors.timeline,
    },
    artistTimeline: {
        ...palette.timeline.line,
        position: 'absolute',
        top: -5,
        width: 2,
        height: 70,
        left: -64,
        marginTop: -11.5,
        zIndex: 4,
    },
    artistPost: {
        flex: 1,
        paddingRight: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.timeline,
        marginRight: 22,
        marginLeft: 33,
        marginTop: 10,
        paddingLeft: -20,
        marginBottom: 15,
        backgroundColor: colors.homeBackground,
    },
    post: {
        backgroundColor: '#181D1F',
        marginStart: 20,
        marginEnd: 20,
        // marginTop: 20,
        borderRadius: 8,
    },
    transferPost: {
        backgroundColor: '#181D1F',
    },
    showcasePost: {
        paddingTop: 20,
        paddingBottom: 20,
        width: Dimensions.get('window').width - 2.5,
    },
    upperTimeline: {
        ...palette.timeline.line,
        marginLeft:
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth +
            1,
        position: 'absolute',
        height: 75,
        backgroundColor: colors.timeline,
    },
    lowerTimeline: {
        borderTopRightRadius: 5,
        borderTopLeftRadius: 5,
        ...palette.timeline.line,
        marginLeft:
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth +
            1,
        position: 'absolute',
        bottom: -1,
        backgroundColor: colors.timeline,
    },
    expandButton: {
        opacity: 1,
        position: 'absolute',
        backgroundColor: '#737373',
        width: 16,
        height: 16,
        left: 28,
        bottom: 1,
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
    contractedSeperator: {
        marginLeft: 10,
        marginRight: 10,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        height: 20,
        width: '95%',
        position: 'absolute',
        zIndex: 100,
        borderBottomColor: colors.seperatorLineColor,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    endorsementsContainer: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    endorsementBtn: {
        marginLeft: 7,
        marginRight: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.topBackground,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        opacity: 1,
        shadowOpacity: 0.23,
        shadowRadius: 1,
        height: 42,
        width: 42,
        borderRadius: 40,
    },
    endorsementsMenuIos: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        height: 60,
        paddingLeft: 5,
        paddingRight: 6,
        borderRadius: 30,
    },
    endorsementsMenuAndroid: {
        alignSelf: 'center',
        top: 200,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        elevation: 6,
        height: 60,
        paddingLeft: 5,
        paddingRight: 6,
        borderRadius: 30,
        backgroundColor: '#919191',
        opacity: 0.8,
    },
    commentEndorsements: {
        marginLeft: 3,
        marginRight: 3,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 25,
        paddingLeft: 5,
        paddingRight: 7,
        width: 50,
        borderRadius: 40,
        marginTop: 2,
        marginBottom: 4,
    },
    threadBreakoutStyle: {
        marginLeft: palette.timeline.line.marginLeft - 5,
        width: 30,
        height: 30,
        zIndex: 0,
        marginTop: 7,
        borderBottomLeftRadius: 15,
        borderLeftWidth: 2,
        borderBottomWidth: 1.5,
        borderLeftColor: colors.timeline,
        borderBottomColor: colors.timeline,
        position: 'absolute',
    },
    threadTextBox: {
        marginLeft: 46,
        marginRight: 20,
        fontSize: 14,
        borderRadius: 5,
        borderWidth: 0.5,
        borderColor: colors.darkSeperator,
        paddingLeft: 8,
        paddingRight: 9,
        paddingBottom: 7,
        paddingTop: 4,
        marginBottom: 0,
        marginTop: 3,
        backgroundColor: colors.homeBackground,
    },
    text: {
        color: colors.text,
        marginLeft: 10,
        marginRight: 10,
        fontSize: 14,
    },
    replyText: {
        color: colors.textFaded2,
        fontSize: 14,
        fontStyle: 'italic',
        paddingLeft: 17.5,
    },
    replyHeaderText: {
        color: colors.textFaded2,
        fontSize: 14,
    },
    replyTextHeader: {
        height: 13,
        marginTop: 3,
        marginBottom: 4,
        flexDirection: 'row',
    },
    infoContainer: {
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        flex: 1,
    },
    personName: {
        color: colors.text,
        fontSize: 14,
        marginStart: 10,
        fontWeight: 'bold',
    },
    tinyPersonImage: {
        width: 13,
        height: 13,
        borderRadius: 13,
        marginRight: 4,
        opacity: 0.75,
    },
    threadBoxInfo: {
        marginLeft: 0,
        fontSize: 14,
        color: colors.textFaded2,
        marginTop: 2,
        marginBottom: 0,
        height: 20,
    },
    artistPostBreakout: {
        position: 'absolute',
        marginLeft: -29,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderBottomLeftRadius: 25,
        width: 70,
        height: 40,
        top: -15,
        borderBottomColor: colors.timeline,
        borderLeftColor: colors.timeline,
        zIndex: 3,
    },
});

function EndorsementsRow({postKey, personaKey}) {
    const {dispatch} = React.useContext(FeedMenuDispatchContext);
    return (
        <View
            style={{
                flexDirection: 'row',
                marginLeft: 12,
                marginBottom: 10,
                alignItems: 'flex-start',
            }}>
            <TouchableOpacity
                onPress={({nativeEvent}) =>
                    dispatch({
                        type: 'openEndorsementsMenu',
                        payload: {
                            touchY: nativeEvent.pageY,
                            postKey,
                            personaKey,
                        },
                    })
                }
                hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                style={{
                    flexDirection: 'row',
                    padding: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}>
                <View
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 32,
                        height: 24,
                        borderRadius: 8,
                        backgroundColor: '#2E3133',
                    }}>
                    <FastImage
                        source={images.endorsementsAddBtn}
                        style={{width: 12, height: 12}}
                    />
                </View>
            </TouchableOpacity>
            <PostEndorsements personaKey={personaKey} postKey={postKey} />
        </View>
    );
}

function ManageHeader({navigation}) {
    const roomContext = useContext(PresenceStateContext);
    const presenceFeedStateContext = useContext(PresenceFeedStateContext);
    const rooms = presenceFeedStateContext.rooms;
    const currentRoom = rooms && pObjPath ? rooms[pObjPath] : {};
    let pObjPath = roomContext.presenceObjPath;
    let participants = currentRoom
        ? Object.keys(currentRoom).filter(userID => {
              let now = new Date();
              let hb = new Date(currentRoom[userID].heartbeat?.seconds * 1000);
              return (now - hb) / 1000 < HEARTBEAT_THRESHOLD;
          })
        : [auth().currentUser.uid];

    participants = participants.sort();
    const onBackData = React.useRef({
        sticky: roomContext.sticky,
        multipleParticipants: participants.length > 1,
    });
    React.useEffect(() => {
        onBackData.current = {
            sticky: roomContext.sticky,
            multipleParticipants: participants.length > 1,
        };
    }, [roomContext.sticky, participants.length]);

    /*const headerLeft = React.useCallback(
        () => (
            <View style={{flexDirection: 'row', top: 20}}>
                <TouchableOpacity
                    hitSlop={{left: 20, right: 30, bottom: 25, top: 20}}
                    onPress={onBack}
                    style={{
                        flexDirection: 'row',
                        top: 26,
                        elevation: 999999,
                        zIndex: 99999,
                        marginLeft: 0,
                        marginRight: 5,
                        paddingLeft: 10,
                    }}>
                    <AntDesign
                        name={'left'}
                        size={palette.header.icon.size}
                        color={colors.navSubProminent}
                    />
                </TouchableOpacity>

                <View
                    style={{
                        marginTop: 8,
                        marginLeft: -10,
                        borderColor: 'pink',
                        borderWidth: 0,
                        flexWrap: 'nowrap',
                        marginRight: 2,
                    }}>
                    <PostHeader
                        header={true}
                        navigation={navigation}
                        persona={persona}
                        post={post}
                        postKey={postKey}
                        showFollowButton={false}
                        personaName={personaName}
                        personaKey={personaKey}
                        personaProfileImgUrl={personaProfileImgUrl}
                        faded={false}
                    />
                </View>
            </View>
        ),
        [
            navigation,
            persona,
            post,
            postKey,
            personaName,
            personaKey,
            personaProfileImgUrl,
        ],
    );*/

    /*React.useEffect(() => {
        console.log(`useEffect setting PostHeader with postKey${postKey}`);

        navigation.setOptions({
            headerStyle: {
                position: 'absolute',
                height: 40 + heightOffset,
                backgroundColor: colors.background,
                borderBottomColor: '',
                borderBottomWidth: 0,
            },
            headerLeft: headerLeft,
        });
    }, [postKey, persona, personaName, personaKey, personaProfileImgUrl]);*/

    const leaveRoom = React.useCallback(async () => {
        //console.log('RoomsSmolStatus.leaveRoom', roomContext.presenceObjPath);

        //console.log('RoomsSmallStatus.leaveRoom after csetState');

        //let deadEntries = Object.keys(pastRooms);
        /*let killDeadEntries = {};
    deadEntries.forEach(entry => {
      killDeadEntries = {
        ...killDeadEntries,
        [entry]: {[myUserID]: firestore.FieldValue.delete()},
      };
    });*/

        /*console.log(
      'roomssmallstatus about to set firestore',
      presenceObjPath,
      myUserID,
    );*/
        //console.log(JSON.stringify(killDeadEntries, undefined, 4));
        // firestore()
        //     .doc(ROOMS_ADDRESS)
        //     .set(
        //         {
        //             rooms: {
        //                 //...killDeadEntries,
        //                 [presenceObjPath]: {
        //                     [myUserID]: firestore.FieldValue.delete(),
        //                 },
        //             },
        //         },
        //         {merge: true},
        //     );

        navigation.navigate('Persona');

        await roomContext.roomEngine?.leaveChannel();
        roomContext.csetState({
            presenceIntent: 'unset',
            presenceObjPath: 'unset',
            sticky: false,
            roomTitle: '',
            currentRoom: '',
            channelName: '',
            uid: 0,
            muted: {},
            micMuted: true,
            peerIds: [],
            pastRoomsStack: Object.assign([]),
            joinSucceed: false,
            roomUsersPresent: [],
            roomPersonaID: '',
            roomPostID: '',
            roomPost: {},
            roomPersona: {},
        });
        // await firestore()
        //     .collection('pings')
        //     .where('requesterID', '==', myUserID)
        //     .where('requesterID', '==', myUserID)
        //     .where('roomPostID', '==', oldRoomPostID)
        //     .where('roomPersonaID', '==', oldRoomPersonaID)
        //     .where('cancelled', '==', false)
        //     .get()
        //     .then(async pingsToCancel => {
        //         const batch = firestore().batch();
        //         for (const doc of pingsToCancel.docs) {
        //             batch.set(doc.ref, {cancelled: true}, {merge: true});
        //         }
        //         await batch.commit();
        //     });
    }, [roomContext, navigation]);
    return null;
}
