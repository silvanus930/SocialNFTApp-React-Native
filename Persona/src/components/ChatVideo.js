import React, {useState} from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    Alert,
} from 'react-native';
import {
    NativeViewGestureHandler,
    State,
    TapGestureHandler,
} from 'react-native-gesture-handler';
import Video from 'react-native-video';
import {iwarn, clog, cwarn} from 'utils/log';
const CUSTOM_LOG_WARN_HEADER = '!! components/ChatVideo';
import Icon from 'react-native-vector-icons/Feather';
import palette from 'resources/palette';
import colors from 'resources/colors';
const log = (...args) =>
    global.LOG_VIDEO && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) => false && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
import {useFocusEffect} from '@react-navigation/native';
import getMediaUrl from 'utils/media/getMediaUrl';
import {FullScreenMediaStateContext, FullScreenMediaDispatchContext} from 'state/FullScreenMediaState';

/*

 prototype
  const registerMediaPlayer = ({player, stop, togglePaused, index}) => {
    if (!mediaArtifactRegistry[index] && player) {
      mediaArtifactRegistry[index] = setPaused;
    }
  };

*/

import isEqual from 'lodash.isequal';
function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(ChatVideo, propsAreEqual);
function ChatVideo({
    waitFor,
    startPaused = true,
    initialPaused = true,
    muted = false,
    small = false,
    pcs = false,
    feed = false,
    personaKey = '',
    size,
    postKey = '',
    style = {},
    post,
    offset = 0,
    registerMe,
    mediaDisabled = false,
    index
}) {
    const [paused, setPaused] = React.useState(initialPaused);
    const imageWidth = small
        ? Dimensions.get('window').width / 2 - offset
        : Dimensions.get('window').width - offset;

    let width = post?.mediaWidth;
    let height =
        post?.mediaHeight > Dimensions.get('window').height * 0.7
            ? post.mediaHeight / 1.5
            : post?.mediaHeight;

    let mediaRotate = !post.mediaRotate && width < height;

    let scale = mediaRotate ? height / width : width / height;
    let computedScaledHeight =
        width && height && scale !== Infinity ? scale * imageWidth : 0;

    let newScaledHeight = feed
        ? Math.min(computedScaledHeight, Dimensions.get('window').height * 0.45)
        : computedScaledHeight;

    const [scaledHeight, setScaledHeight] = React.useState(newScaledHeight);
    const [player, setPlayer] = React.useState(null);

    /*console.log(
    'rendering PostVideo of feed,imageWidth,scale,computedScaledHeight,width,height,max',
    feed,
    imageWidth,
    scale,
    computedScaledHeight,
    '::',
    scaledHeight,
    width,
    height,
    size,
    Dimensions.get('window').height * 0.45,
    personaKey,
    postKey,
  );*/
    const stop = () => typeof paused !== undefined && setPaused(false);
    const start = () => typeof paused !== undefined && setPaused(true);

    // create media muted state
    const [mediaMuted, setMuted] = useState(muted || Boolean(post.mediaMuted));
    const {
        state: {isFullScreen},
    } = React.useContext(FullScreenMediaStateContext);
    const {dispatch: mediaDispatch} = React.useContext(
        FullScreenMediaDispatchContext,
    );

    useFocusEffect(
        React.useCallback(() => {
            return () => {
                start();
            };
        }, [post.mediaUrl]),
    );

    const onBuffer = b => {
        warn('renderVideoPreview.onBuffer not implemented!', b);
    };

    const videoError = e => {
        warn('renderVideoPreview.videoError not implemented!', e);
    };

    const onAudioFocusChanged = () => {
        stop();
    };

    const Styles = StyleSheet.create({
        chatVideoLoading: {
            borderWidth: 0,
            borderColor: 'purple',
            width: imageWidth,
            height: pcs ? scaledHeight : newScaledHeight,
            backgroundColor: colors.loadingBackground,
            marginTop: 6,
            marginBottom: 6,
        },
        overlayContainer: {
            top: height / 2,
            left: width / 2 - 30,
            zIndex: 99,
            elevation: 99,
            position: 'absolute',
            backgroundColor: colors.overlayBackground,
            opacity: colors.overlayOpacity,
            borderRadius: colors.overlayBorderRadius,
        },
        overlayMuteContainer: {
            right: 40,
            zIndex: 99,
            elevation: 99,
            position: 'absolute',
            backgroundColor: colors.overlayBackground,
            opacity: colors.overlayOpacity,
            borderRadius: colors.overlayBorderRadius,
        },
        overlayFullScreenContainer: {
            right: 10,
            zIndex: 99,
            elevation: 99,
            position: 'absolute',
            backgroundColor: colors.overlayBackground,
            opacity: colors.overlayOpacity,
            borderRadius: colors.overlayBorderRadius,
        },
    });

    const opacity = React.useRef(new Animated.Value(1)).current;
    const onHandlerStateChange = ({nativeEvent}) => {
        if (nativeEvent.state === State.BEGAN && !mediaDisabled) {
            Animated.timing(opacity, {
                toValue: 0.95,
                duration: 20,
                useNativeDriver: true,
            }).start();
        }
        if (nativeEvent.oldState === State.ACTIVE && !mediaDisabled) {
            setPaused(!paused);
        }
        if (
            [
                State.END,
                State.FAILED,
                State.CANCELLED,
                State.UNDETERMINED,
            ].includes(nativeEvent.state)
        ) {
            opacity.stopAnimation(() =>
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }).start(),
            );
        }
    };

    const onFullScreenStateChange = ({nativeEvent}) => {
        if (nativeEvent.oldState === State.ACTIVE) {
            if (isFullScreen) {
                mediaDispatch({type: 'clearMediaPost'});
            } else {
                mediaDispatch({type: 'setMediaPost', payload: post});
                setPaused(true);
            }
        }
    };

    // https://github.com/react-native-video/react-native-video#resizemode
    // see Event Props
    return post.mediaUrl ? (
        <TapGestureHandler
            waitFor={waitFor}
            onHandlerStateChange={onHandlerStateChange}>
            <Animated.View style={{alignSelf: 'center', opacity}}>
                {paused && size !== 'grid' && size !== 'mini' ? (
                    <View style={Styles.overlayContainer}>
                        <Icon
                            color={palette.header.icon.color}
                            name="play"
                            size={40}
                        />
                    </View>
                ) : null}
                <TapGestureHandler
                    onHandlerStateChange={() => setMuted(!mediaMuted)}>
                    <View style={Styles.overlayMuteContainer}>
                        {mediaMuted ? (
                            <Icon
                                color={palette.header.icon.color}
                                name="volume-x"
                                size={20}
                            />
                        ) : (
                            <Icon
                                color={palette.header.icon.color}
                                name="volume-2"
                                size={20}
                            />
                        )}
                    </View>
                </TapGestureHandler>
                <TapGestureHandler
                    onHandlerStateChange={onFullScreenStateChange}>
                    <View style={Styles.overlayFullScreenContainer}>
                        {isFullScreen ? (
                            <Icon
                                color={palette.header.icon.color}
                                name="minimize-2"
                                size={20}
                            />
                        ) : (
                            <Icon
                                color={palette.header.icon.color}
                                name="maximize-2"
                                size={20}
                            />
                        )}
                    </View>
                </TapGestureHandler>

                {(pcs ? scaledHeight === 0 : newScaledHeight === 0) && (
                    <View style={{...Styles.chatVideoLoading, ...style}} />
                )}
                <Video
                    style={{
                        ...style,
                        width: width,
                        borderColor: 'purple',
                        borderWidth: 0,
                    }}
                    ref={ref => {
                        if (registerMe && ref) {
                            // console.log('registering a video player at index', index);

                            registerMe({
                                type: 'video',
                                stop: start,
                                start: stop,
                                startPaused: startPaused,
                                index: index,
                            });
                        } else {
                            setPlayer(ref);
                            warn(
                                'trying to register a video player! at index',
                                index,
                                'but registerMe is',
                                registerMe ? 'non-null' : null,
                                'while player is',
                                ref ? 'non-null' : null,
                            );
                        }
                    }}
                    // controls={true} // Jasmine: setting controls to true overrides registerMediaPlayer
                    muted={mediaMuted}
                    paused={paused || mediaDisabled}
                    repeat={true}
                    onBuffer={onBuffer} // Callback when remote video is buffering
                    onError={videoError} // Callback when video cannot be loaded
                    //disableFocus={this.state.isShowControl} // disables audio focus and wake lock (default false)
                    onAudioFocusChanged={onAudioFocusChanged} // Callback when audio focus has been lost - pause if focus has been lost
                    onLoad={async response => {
                        const {height, width} = response.naturalSize;
                        console.log(
                            'ChatVideo onLoad event',
                            height,
                            width,
                            personaKey,
                            postKey,
                            post?.mediaWidth,
                            post?.mediaHeight,
                        );

                        if (!post?.mediaWidth || !post?.mediaHeight) {
                            const docRef = firestore()
                                .collection('personas')
                                .doc(personaKey)
                                .collection('posts')
                                .doc(postKey);

                            const docResult = await docRef.get();

                            if (docResult.exists) {
                                console.log(
                                    'ChatVideo writing mediaHeight, mediaWidth',
                                    height,
                                    width,
                                    `personas/${personaKey}/posts/${postKey}`,
                                );
                                docRef.set(
                                    {
                                        mediaWidth: width,
                                        mediaHeight: height,
                                        userIDMediaUpdate:
                                            auth().currentUser.uid,
                                    },
                                    {merge: true},
                                );
                            } else {
                                console.log(
                                    'no document exists! not setting',
                                    `personas/${personaKey}/posts/${postKey}`,
                                );
                            }
                        }

                        let mediaRotate = !post.mediaRotate && width < height;

                        log(
                            `Platform.OS:${Platform.OS} post.mediaRotate:${post.mediaRotate} `,
                        );
                        log(
                            `post.mediaMuted ${post.mediaMuted} as projected to ${mediaMuted}`,
                        );
                        log(`small ${small}`);
                        const scale = mediaRotate
                            ? height / width
                            : width / height;
                        const newHeight =
                            scale !== Infinity ? scale * imageWidth : 0;
                        if (pcs) {
                            setScaledHeight(
                                //feed ?
                                newHeight,
                                //: Math.min(newHeight, Dimensions.get('window').height * 0.45),
                            );
                        }
                    }}
                    source={{uri: getMediaUrl(post.mediaUrl)}}
                />
            </Animated.View>
        </TapGestureHandler>
    ) : (
        <></>
    );
}
const Styles = StyleSheet.create({
    post: {
        marginTop: 8,
        paddingBottom: 15,
        width: Dimensions.get('window').width - 2.5,
        marginStart: 2.5,
        borderLeftWidth: 2.5,
        borderLeftColor: colors.seperatorLineColor,
        borderBottomColor: colors.seperatorLineColor,
        borderBottomWidth: 2.5,
        borderBottomLeftRadius: 10,
    },
});
