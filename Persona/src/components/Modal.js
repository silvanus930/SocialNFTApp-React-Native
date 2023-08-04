import React, {PropsWithChildren, useCallback, useEffect} from 'react';
import {BlurView} from '@react-native-community/blur';
import {
    Modal as RNModal,
    Animated,
    Easing,
    Dimensions,
    View,
    StyleSheet,
    Platform,
} from 'react-native';
import {KeyboardingAvoidingViewByTranslate} from './ReanimatedKeyboardAvodingView';
import {
    GestureHandlerRootView,
    PanGestureHandler,
    State,
    TapGestureHandler,
} from 'react-native-gesture-handler';
import {propsAreEqual} from 'utils/propsAreEqual';

let WINDOW_SCALE_EXTERNAL = 0.7;

const Modal = React.memo(BottomModalMemo, propsAreEqual);
export default Modal;

function BottomModalMemo({
    windowScale = 0.7,
    children,
    toggleModalVisibility,
    showToggle,
    touchAnywhereToClose = false,
    animationType = 'slide',
}) {
    if (Platform.OS === 'ios') {
        return (
            <IOSModal
                windowScale={windowScale}
                toggleModalVisibility={toggleModalVisibility}
                showToggle={showToggle}
                children={children}
                touchAnywhereToClose={touchAnywhereToClose}
                animationType={animationType}
            />
        );
    } else {
        //console.log('the android modal hodl branch');
        return (
            <AndroidModal
                windowScale={windowScale}
                toggleModalVisibility={toggleModalVisibility}
                showToggle={showToggle}
                children={children}
                touchAnywhereToClose={touchAnywhereToClose} // TODO implement touch anywhere on android
                animationType={animationType} // TODO implement this flag on android
            />
        );
    }
}

function AndroidModal({
    windowScale,
    children,
    toggleModalVisibility,
    showToggle,
    touchAnywhereToClose,
    animationType,
}) {
    let WINDOW_SCALE = windowScale;
    const onHandlerStateChange = ({nativeEvent}) => {
        if (nativeEvent.oldState === State.ACTIVE) {
            toggleModalVisibility();
        }
    };

    const flyInDelay = 100;
    const flyOutDelay = 100;
    const [showToggleDelayed, setShowToggleDelayed] =
        React.useState(showToggle);
    React.useEffect(() => {
        if (showToggle) {
            setShowToggleDelayed(true);
            Animated.timing(animatedTranslateY, {
                toValue: 0,
                duration: flyInDelay,
                useNativeDriver: true,
                easing: Easing.easeIn,
            }).start();
        } else {
            Animated.timing(animatedTranslateY, {
                toValue: Dimensions.get('window').height * WINDOW_SCALE,
                duration: flyOutDelay,
                useNativeDriver: true,
                easing: Easing.easeOut,
            }).start();
            const setDelayed = setInterval(() => {
                setShowToggleDelayed(false);
            }, flyOutDelay);
            return () => clearInterval(setDelayed);
        }
    }, [showToggle]);

    const animatedTranslateY = React.useRef(
        new Animated.Value(Dimensions.get('window').height * WINDOW_SCALE),
    ).current;
    const _onPanGestureEvent = ({nativeEvent}) => {
        if (nativeEvent.translationY > 10 && showToggle) {
            toggleModalVisibility();
        }
    };
    const animatedTranslateDown = animatedTranslateY.interpolate({
        inputRange: [0, 999],
        outputRange: [0, 999],
        extrapolate: 'clamp',
    });

    const RenderAndroidCompatibleBlurView = useCallback(() => {
        return (
            <>
                <AndroidCompatibleBlurView windowScale={windowScale}>
                    <Animated.View
                        style={{
                            width: '100%',
                            height: '100%',
                            borderColor: 'yellow',
                            borderWidth: 0,
                            elevation: 999999999999,
                            zIndex: 999999999999,
                        }}>
                        <PanGestureHandler
                            hitSlop={{
                                top: 30,
                                bottom: 30,
                                left: 200,
                                right: 200,
                            }}
                            onGestureEvent={_onPanGestureEvent}>
                            <Animated.View
                                style={{
                                    alignSelf: 'center',
                                    width: 80,
                                    height: 2.5,
                                    backgroundColor: '#a7a7a7',
                                    marginBottom: 15,
                                    borderRadius: 10,
                                }}
                            />
                        </PanGestureHandler>
                        {children}
                    </Animated.View>
                </AndroidCompatibleBlurView>
            </>
        );
    }, [windowScale, _onPanGestureEvent, children]);

    return (
        (showToggle || showToggleDelayed) && (
            <View
                style={[
                    {
                        position: 'absolute',
                        elevation: 999999999999999,
                        zIndex: 999999999999999,
                        width: '100%',
                        height: '130%',
                        borderColor: 'purple',
                        borderWidth: 0,
                    },
                ]}>
                <KeyboardingAvoidingViewByTranslate
                    animatedTranslateY={animatedTranslateDown}>
                    <TapGestureHandler
                        onHandlerStateChange={onHandlerStateChange}>
                        {touchAnywhereToClose ? (
                            <Animated.View
                                style={{
                                    borderWidth: 0,
                                    elevation: 999999999999999,
                                    borderColor: 'blue',
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                }}>
                                <RenderAndroidCompatibleBlurView />
                            </Animated.View>
                        ) : (
                            <Animated.View
                                style={{
                                    borderWidth: 0,
                                    elevation: 9999999999,
                                    zIndex: 9999999999,
                                    borderColor: 'green',
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                }}
                            />
                        )}
                    </TapGestureHandler>
                    {!touchAnywhereToClose && (
                        <RenderAndroidCompatibleBlurView />
                    )}
                </KeyboardingAvoidingViewByTranslate>
            </View>
        )
    );
}

function IOSModal({
    windowScale,
    children,
    showToggle,
    toggleModalVisibility,
    touchAnywhereToClose,
    animationType,
}) {
    const onHandlerStateChange = ({nativeEvent}) => {
        // {"x":104,"absoluteX":104,"absoluteY":397,"target":6925,"handlerTag":7,"y":397,"oldState":0,"numberOfPointers":1,"state":2}
        // {"x":104,"absoluteX":104,"absoluteY":397,"target":6925,"handlerTag":7,"y":397,"oldState":2,"numberOfPointers":1,"state":4}
        // {"x":104,"absoluteX":104,"absoluteY":397,"target":6925,"handlerTag":7,"y":397,"oldState":4,"numberOfPointers":1,"state":5}

        // {"x":104,"absoluteX":104,"absoluteY":397,"target":6925,"handlerTag":7,"y":397,"oldState":0,"numberOfPointers":1,"state":2}
        // {"x":104,"absoluteX":104,"absoluteY":397,"target":6925,"handlerTag":7,"y":397,"oldState":2,"numberOfPointers":1,"state":4}
        // {"x":104,"absoluteX":104,"absoluteY":397,"target":6925,"handlerTag":7,"y":397,"oldState":4,"numberOfPointers":1,"state":5}

        if (nativeEvent.oldState === State.ACTIVE) {
            toggleModalVisibility();
        }
    };

    const _onPanGestureEvent = ({nativeEvent}) => {
        if (nativeEvent.translationY > 10 && showToggle) {
            toggleModalVisibility();
        }
    };

    const RenderAndroidCompatibleBlurView = useCallback(() => {
        return (
            <>
                <AndroidCompatibleBlurView windowScale={windowScale}>
                    <View
                        style={{
                            elevation: 999999999999,
                            zIndex: 999999999999,
                            width: '100%',
                            height: '100%',
                            borderWidth: 0,
                            borderColor: 'yellow',
                        }}>
                        <PanGestureHandler
                            hitSlop={{
                                top: 30,
                                bottom: 30,
                                left: 200,
                                right: 200,
                            }}
                            onGestureEvent={_onPanGestureEvent}>
                            <Animated.View>
                                <Animated.View
                                    style={{
                                        alignSelf: 'center',
                                        width: 80,
                                        height: 2.5,
                                        backgroundColor: '#a7a7a7',
                                        marginBottom: 15,
                                        borderRadius: 10,
                                        borderWidth: 0,
                                        borderColor: 'purple',
                                    }}
                                />
                            </Animated.View>
                        </PanGestureHandler>
                        {children}
                    </View>
                </AndroidCompatibleBlurView>
            </>
        );
    }, [windowScale, _onPanGestureEvent, children]);

    return (
        showToggle && (
            <View
                style={[
                    {
                        position: 'absolute',
                        zIndex: 9999,
                        elevation: 9999,
                        width: '100%',
                        height: '100%',
                        borderColor: 'orange',
                        borderWidth: 0,
                    },
                ]}>
                <RNModal
                    animationType={animationType}
                    transparent={true}
                    visible={showToggle}>
                    <TapGestureHandler
                        onHandlerStateChange={onHandlerStateChange}>
                        {touchAnywhereToClose ? (
                            <Animated.View
                                style={{
                                    borderWidth: 0,
                                    borderColor: 'orange',
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                }}>
                                <RenderAndroidCompatibleBlurView />
                            </Animated.View>
                        ) : (
                            <Animated.View
                                style={{
                                    borderWidth: 0,
                                    borderColor: 'red',
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                }}
                            />
                        )}
                    </TapGestureHandler>
                    {!touchAnywhereToClose && (
                        <RenderAndroidCompatibleBlurView />
                    )}
                </RNModal>
            </View>
        )
    );
}

function AndroidCompatibleBlurView({windowScale, children}) {
    let WINDOW_SCALE = windowScale;
    if (Platform.OS === 'ios') {
        return (
            <BlurView
                blurType={'dark'}
                blurRadius={3}
                blurAmount={8}
                reducedTransparencyFallbackColor="black"
                style={{
                    ...Styles.modalView,

                    top: Dimensions.get('window').height * (1 - WINDOW_SCALE),
                    height: Dimensions.get('window').height * WINDOW_SCALE,
                    width: Dimensions.get('window').width,
                    borderWidth: 0.5,
                    borderColor: 'rgba(43,43,43,0.95)',
                }}>
                {children}
            </BlurView>
        );
    } else {
        return (
            <View
                style={{
                    ...Styles.modalView,
                    zIndex: 99999999999,
                    elevation: 9999999999,

                    top: Dimensions.get('window').height * (1 - WINDOW_SCALE),
                    height: Dimensions.get('window').height * WINDOW_SCALE,
                    width: Dimensions.get('window').width,
                    backgroundColor: 'rgba(30, 30, 30, 0.97)',
                    borderWidth: 0.5,
                    borderColor: 'rgba(55,55,55,0.95)',
                    borderWidth: 0,
                    borderColor: 'pink',
                    position: 'absolute',
                }}>
                {children}
            </View>
        );
    }
}

export const Styles = StyleSheet.create({
    modalView: {
        zIndex: 999,
        elevation: 999,
        margin: 0,
        borderRadius: 20,
        paddingTop: 15,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: Platform.OS === 'android' ? 35 : 0,
        top: Dimensions.get('window').height * (1 - WINDOW_SCALE_EXTERNAL),
        height: Dimensions.get('window').height * WINDOW_SCALE_EXTERNAL,
        width: Dimensions.get('window').width,
    },
});
