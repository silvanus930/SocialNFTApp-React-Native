import React from 'react';
import {Animated, View, Dimensions} from 'react-native';
import {State, PinchGestureHandler, TapGestureHandler, PanGestureHandler} from 'react-native-gesture-handler';
import {
    FullScreenMediaDispatchContext,
    FullScreenMediaStateContext,
} from 'state/FullScreenMediaState';
import ChatVideo from './ChatVideo';
import getResizedImageUrl from 'utils/media/resize';
import Pinchable from 'react-native-pinchable';
import FastImage from 'react-native-fast-image';

const FullScreenMedia = React.memo(FullscreenMediaWrapped, () => true);
export default FullScreenMedia;
function FullscreenMediaWrapped() {
    const {
        state: {post},
    } = React.useContext(FullScreenMediaStateContext);
    const {dispatch: mediaDispatch} = React.useContext(
        FullScreenMediaDispatchContext,
    );
    const [viewingPost, setViewingPost] = React.useState();
    const [panEnabled, setPanEnabled] = React.useState(false);

    const mediaOpacity = React.useRef(new Animated.Value(0)).current;
    const scale = React.useRef(new Animated.Value(1)).current;
    const translateX = React.useRef(new Animated.Value(0)).current;
    const translateY = React.useRef(new Animated.Value(0)).current;
    const tapRef = React.useRef(null);
    const pinchRef = React.useRef(null);
    const panRef = React.useRef(null);

    React.useEffect(() => {
        if (post === null) {
            Animated.timing(mediaOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setViewingPost(null));
        } else {
            setViewingPost(post);
            Animated.timing(mediaOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [mediaOpacity, post]);

    const onTapStateChange = ({nativeEvent}) => {
        if (nativeEvent.state === State.BEGAN) {
            setPanEnabled(true);
        }

        if (nativeEvent.state === State.ACTIVE) {
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true
            }).start();
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true
            }).start();
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true
            }).start();
            mediaDispatch({type: 'clearMediaPost'});
        }
    };

    const onPinchEvent = Animated.event([
        {nativeEvent: { scale: scale }}
    ],
        {useNativeDriver: true},
    );
    const onPinchStateChange = ({nativeEvent}) => {
        const nScale = nativeEvent.scale;
        if (nativeEvent.state === State.END) {
            if (nScale < 1) {
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true
                }).start();
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true
                }).start();
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true
                }).start();
            }
        }
    }

    const onPanEvent = Animated.event([{
        nativeEvent: {
            translationX: translateX,
            translationY: translateY
        }
    }],
        {useNativeDriver: true},
    );
    const onPanStateChange = () => {
        // Extract offset so that panning resumes from previous location, rather than resetting
        translateX.extractOffset();
        translateY.extractOffset();
    };

    // viewingPost -> can be either discussionChatItem or feed Post
    return viewingPost ? (
        <TapGestureHandler
            ref={tapRef}
            onHandlerStateChange={onTapStateChange}
            simultaneousHandlers={[panRef, pinchRef]}
        >
            <Animated.View
                style={[
                    {opacity: mediaOpacity},
                    {
                        position: 'absolute',
                        backgroundColor: 'black',
                        zIndex: 2222222222222,
                        elevation: 2222222222222,
                        width: '100%',
                        height: '100%',
                    },
                ]}>
                <PanGestureHandler
                    onGestureEvent={onPanEvent}
                    onHandlerStateChange={onPanStateChange}
                    ref={panRef}
                    simultaneousHandlers={[pinchRef, tapRef]}
                    enabled={panEnabled}
                    failOffsetX={[-1000, 1000]}
                    shouldCancelWhenOutside
                >
                    <Animated.View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        {viewingPost.mediaUrl.slice(-3) === 'mp4' ? (
                            <ChatVideo
                                post={viewingPost}
                                navigation={null}
                                style={{
                                    borderRadius: 7,
                                    height: '80%',
                                    maxWidth: '100%',
                                }}
                            />
                            ) : (
                                <Pinchable>
                                <FastImage
                                    source={{
                                        uri: getResizedImageUrl(
                                            {
                                                origUrl: viewingPost.mediaUrl,
                                                width: viewingPost.mediaWidth,
                                                height: viewingPost.mediaHeight,
                                            },
                                        )
                                    }}
                                    style={{
                                        borderRadius: 5,
                                        width: Dimensions.get('window').width,
                                        height: viewingPost.mediaHeight,
                                    }}
                                    resizeMode={'contain'}
                                />
                            </Pinchable>
                        )}
                    </Animated.View>
                </PanGestureHandler>
            </Animated.View>
        </TapGestureHandler>
    ): null;
}
