import React, { useCallback } from 'react';
import isEqual from 'lodash.isequal';
import { BlurView } from '@react-native-community/blur';
import {
    Modal,
    Animated,
    Easing,
    Dimensions,
    View,
    StyleSheet,
    Keyboard,
    TouchableOpacity,
} from 'react-native';
import {
    PanGestureHandler,
    State,
    TapGestureHandler,
} from 'react-native-gesture-handler';

let WINDOW_SCALE_EXTERNAL = 0.7;
function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

const BottomModal = React.memo(BottomModalMemo, propsAreEqual);
export default BottomModal;
function BottomModalMemo({
    windowScale = 0.1,
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
    showToggle,
    toggleModalVisibility,
    touchAnywhereToClose,
    animationType,
}) {

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
                        {children}
                    </View>
                </AndroidCompatibleBlurView>
            </>
        );
    }, [windowScale, children]);

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
                <Modal
                    animationType={animationType}
                    transparent={true}
                    visible={showToggle}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => {
                            toggleModalVisibility();
                        }}>

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
                    </TouchableOpacity>
                    {!touchAnywhereToClose && (
                        <RenderAndroidCompatibleBlurView />
                    )}
                </Modal>
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
    const onHandlerStateChange = ({ nativeEvent }) => {
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

    const _onPanGestureEvent = ({ nativeEvent }) => {
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
                <Modal
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
                </Modal>
            </View>
        )
    );
}

function AndroidCompatibleBlurView({ windowScale, children }) {

    const [offset, setOffset] = React.useState(0);

    function keyboardWillShow(e) {
        console.log(e);
        setOffset(e.endCoordinates.height);
    }

    function keyboardWillHide(e) {
        setOffset(0);
    }

    function keyboardDidShow(e) {
        console.log(e);
        setOffset(e.endCoordinates.height);
    }

    function keyboardDidHide(e) {
        setOffset(0);
    }

    React.useEffect(() => {
        const keyboardShow = Platform.OS === 'ios' ? Keyboard.addListener(
            'keyboardWillShow',
            keyboardWillShow,
        ) : Keyboard.addListener(
            'keyboardDidShow',
            keyboardDidShow,
        );

        const keyboardHide = Platform.OS === 'ios' ? Keyboard.addListener(
            'keyboardWillHide',
            keyboardWillHide,
        ) : Keyboard.addListener(
            'keyboardDidHide',
            keyboardDidHide,
        );

        return () => {
            keyboardShow.remove();
            keyboardHide.remove();
        };
    }, []);

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

                    top: Dimensions.get('window').height * (1 - WINDOW_SCALE) - offset,
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

                    top: Dimensions.get('window').height * (1 - WINDOW_SCALE) - offset,
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
    container: {
        flex: 1,
        justifyContent: 'center',
    },
});
