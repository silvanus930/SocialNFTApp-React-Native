import React from 'react';
import isEqual from 'lodash.isequal';
import {View, TouchableOpacity, Animated} from 'react-native';
import PostImage from 'components/PostImage';
//import PostAudio from 'components/PostAudio';
import PostGallery from 'components/PostGallery';
import {POST_MEDIA_TYPE_AUDIO, POST_MEDIA_TYPE_GALLERY} from 'state/PostState';

import {clog, cwarn, iwarn} from 'utils/log';
import {FullScreenMediaDispatchContext} from 'state/FullScreenMediaState';
import {State, TapGestureHandler} from 'react-native-gesture-handler';
import {FeedMenuDispatchContext} from 'state/FeedStateContext';
const CUSTOM_LOG_WARN_HEADER = '!! components/PostMedia';
const log = (...args) =>
    global.LOG_DEBUG && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_DEBUG && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
const mlog = (...args) =>
    global.LOG_MEDIA && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const mwarn = (...args) =>
    global.WARN_MEDIA && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(PostMediaEndorsementWrapped, propsAreEqual);

function PostMediaEndorsementWrapped(props) {
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
                if (
                    props?.postKey !== undefined &&
                    props?.personaKey !== undefined
                ) {
                    dispatch({
                        type: 'openEndorsementsMenu',
                        payload: {
                            touchY: nativeEvent.absoluteY,
                            postKey: props.postKey,
                            personaKey: props.personaKey,
                        },
                    });
                }
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
        [props?.personaKey, props?.postKey, textOpacity, dispatch],
    );

    // i dont know how you could possibly figure this out but the ref needs to be
    // null if undefined to be recognized as a viable ref in the gesture handler
    // system before having been defined
    const doubleTap = React.useRef(null);

    return props?.enableMediaFullScreenButton ? (
        <TapGestureHandler
            maxDeltaY={10}
            ref={doubleTap}
            onHandlerStateChange={onHandlerStateChange}
            numberOfTaps={2}>
            <Animated.View
                style={{
                    opacity: textOpacity,
                }}>
                <PostMedia {...props} waitFor={doubleTap} />
            </Animated.View>
        </TapGestureHandler>
    ) : (
        <Animated.View
            style={{
                opacity: textOpacity,
            }}>
            <PostMedia {...props} waitFor={[]} />
        </Animated.View>
    );
}

export function WrapWithExitFullScreen({
    children,
    simultaneousHandler,
    waitFor,
    enableMediaFullScreenButton,
    post,
}) {
    const {dispatch: mediaDispatch} = React.useContext(
        FullScreenMediaDispatchContext,
    );
    const onSingleTapHandlerStateChange = ({nativeEvent}) => {
        if (
            nativeEvent.oldState === State.ACTIVE &&
            enableMediaFullScreenButton
        ) {
            mediaDispatch({type: 'setMediaPost', payload: post});
        }
    };
    return (
        <TapGestureHandler
            simultaneousHandlers={
                simultaneousHandler !== undefined ? simultaneousHandler : []
            }
            waitFor={waitFor}
            onHandlerStateChange={onSingleTapHandlerStateChange}>
            {children}
        </TapGestureHandler>
    );
}

function PostMedia({
    simultaneousHandler,
    waitFor,
    muted = false,
    feed = false,
    small = false,
    style,
    post,
    personaKey,
    postKey,
    offset = 0,
    mediaDisabled = false,
    inStudio = false,
    registerMediaPlayer,
    index,
    startPaused = true,
    initialPaused = false,
    navigation,
    size,
    showcase = false,
    enableMediaFullScreenButton = false,
    enableZoom = false,
}) {
    // ensure post.mediaType is defined
    const sw = post.mediaType ? post.mediaType : POST_MEDIA_TYPE_GALLERY;
    const sizeTypes = ['small', 'thumbnail', 'mini', 'grid'];
    if (size !== undefined && !sizeTypes.includes(size)) {
        warn(`PostMedia size type ${size} not recognized`);
    }

    switch (sw) {
        case POST_MEDIA_TYPE_AUDIO: {
            return (
                <>
                    {post?.galleryUris?.length ? (
                        <WrapWithExitFullScreen
                            simultaneousHandler={simultaneousHandler}
                            waitFor={waitFor}
                            enableMediaFullScreenButton={
                                enableMediaFullScreenButton
                            }
                            post={post}>
                            <View
                                style={{
                                    marginTop: 14,
                                    marginBottom: 11,
                                    ...style,
                                }}>
                                <PostGallery
                                    feed={feed}
                                    enableZoom={enableZoom}
                                    simultaneousHandler={simultaneousHandler}
                                    inStudio={inStudio}
                                    size={size}
                                    small={small}
                                    mediaDisabled={mediaDisabled}
                                    registerMe={registerMediaPlayer}
                                    style={style}
                                    post={post}
                                    offset={offset}
                                    navigation={navigation}
                                />
                            </View>
                        </WrapWithExitFullScreen>
                    ) : null}
                    {post.audioUrl && post.mediaUrl ? (
                        <View
                            style={{
                                marginTop: 7,
                                marginBottom: 2,
                                ...style,
                            }}>
                            <PostImage
                                enableZoom={enableZoom}
                                personaKey={personaKey}
                                postKey={postKey}
                                inStudio={inStudio}
                                small={small}
                                size={size}
                                mediaDisabled={mediaDisabled}
                                registerMe={registerMediaPlayer}
                                post={post}
                                offset={offset}
                                navigation={navigation}
                            />
                        </View>
                    ) : null}

                    {/*post?.mediaUrl || post?.audioUrl ? (
                        <PostAudio
                            inStudio={inStudio}
                            small={small}
                            registerMe={registerMediaPlayer}
                            mediaDisabled={mediaDisabled}
                            startPaused={true}
                            index={index}
                            navigation={navigation}
                            style={style}
                            post={post}
                            offset={offset}
                        />
                    ) : null*/}
                </>
            );
        }

        // GALLERY is used for both photo and video media types
        case POST_MEDIA_TYPE_GALLERY: {
            return (
                // <WrapWithExitFullScreen
                //     simultaneousHandler={simultaneousHandler}
                //     waitFor={waitFor}
                //     enableMediaFullScreenButton={enableMediaFullScreenButton}
                //     post={post}>
                <View
                    style={{
                        marginBottom: 11,
                        borderWidth: 0,
                        borderColor: 'blue',
                        // ...style,
                    }}>
                    <PostGallery
                        // feed={feed}
                        // index={index}
                        // enableZoom={enableZoom}
                        // inStudio={inStudio}
                        // size={size}
                        // small={small}
                        // mediaDisabled={mediaDisabled}
                        // registerMe={registerMediaPlayer}
                        // style={style}
                        post={post}
                        // offset={offset + 20}
                        // navigation={navigation}
                    />
                </View>
                // </WrapWithExitFullScreen>
            );
        }

        case 'richtext': {
            //iwarn('richtext media artifact not implemented!');
            mlog('richtext media artifact not implemented!');
            return null;
        }

        default: {
            return null;
            throw Error('PostMedia post has invalid mediaType:', post);
        }
    }
}
