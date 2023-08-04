import React from 'react';
import _ from 'lodash';
import {Animated, Easing, LayoutAnimation} from 'react-native';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
};

export function LeftRightSwipable({
    children,
    renderLeftIcon = () => {},
    renderRightIcon = () => {},
    onLeftTrigger = () => {},
    onRightTrigger = () => {},
    layout = undefined,
    isDM = false,
}) {
    const leftTriggerThresh = 60;
    const rightTriggerThresh = -52;
    const animatedTranslate = React.useRef(new Animated.Value(0)).current;
    const leftHapticTriggered = React.useRef(false);
    const rightHapticTriggered = React.useRef(false);
    const direction = React.useRef(0);
    const animatedRightAllowed = React.useRef(new Animated.Value(0)).current;
    const animatedLeftAllowed = React.useRef(new Animated.Value(0)).current;
    const _onPanGestureEvent = Animated.event(
        [{nativeEvent: {translationX: animatedTranslate}}],
        {
            useNativeDriver: true,
            listener: ({nativeEvent}) => {
                if (direction.current === 0) {
                    direction.current = Math.sign(nativeEvent.translationX);
                    if (direction.current > 0) {
                        animatedLeftAllowed.setValue(1);
                        animatedRightAllowed.setValue(0);
                    } else {
                        animatedRightAllowed.setValue(1);
                        animatedLeftAllowed.setValue(0);
                    }
                }
                if (
                    direction.current > 0 &&
                    !leftHapticTriggered.current &&
                    nativeEvent.translationX > leftTriggerThresh
                ) {
                    ReactNativeHapticFeedback.trigger('impactLight', options);
                    leftHapticTriggered.current = true;
                }
                if (
                    direction.current > 0 &&
                    leftHapticTriggered.current &&
                    nativeEvent.translationX < leftTriggerThresh
                ) {
                    leftHapticTriggered.current = false;
                }
                if (
                    direction.current < 0 &&
                    !rightHapticTriggered.current &&
                    nativeEvent.translationX < rightTriggerThresh
                ) {
                    ReactNativeHapticFeedback.trigger('impactLight', options);
                    rightHapticTriggered.current = true;
                }
                if (
                    direction.current < 0 &&
                    rightHapticTriggered.current &&
                    nativeEvent.translationX > rightTriggerThresh
                ) {
                    rightHapticTriggered.current = false;
                }
            },
        },
    );

    const onHandlerStateChange = ({nativeEvent}) => {
        if (
            [State.CANCELLED, State.END, State.UNDETERMINED].includes(
                nativeEvent.state,
            )
        ) {
            direction.current = 0;
            if (leftHapticTriggered.current) {
                LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                );
                onLeftTrigger();
            }
            if (rightHapticTriggered.current) {
                LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                );
                onRightTrigger();
            }
            leftHapticTriggered.current = false;
            rightHapticTriggered.current = false;
            Animated.parallel([
                Animated.timing(animatedRightAllowed, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                    easing: Easing.easeOut,
                }),
                Animated.timing(animatedLeftAllowed, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                    easing: Easing.easeOut,
                }),
                Animated.timing(animatedTranslate, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                    easing: Easing.easeOut,
                }),
            ]).start();
        }
    };
    const animatedTranslateItem = Animated.add(
        Animated.multiply(
            animatedRightAllowed,
            animatedTranslate.interpolate({
                inputRange: [-300, 0],
                outputRange: [-100, 0],
                extrapolate: 'clamp',
            }),
        ),
        Animated.multiply(
            animatedLeftAllowed,
            animatedTranslate.interpolate({
                inputRange: [0, 30, 200, 300],
                outputRange: [0, 25, 125, 160],
                extrapolate: 'clamp',
            }),
        ),
    );
    const animatedTranslateLeft = Animated.multiply(
        animatedLeftAllowed,
        Animated.multiply(
            -1,
            animatedTranslateItem.interpolate({
                inputRange: [40, 300],
                outputRange: [0, 300 - 40],
                extrapolate: 'clamp',
            }),
        ),
    );
    const animatedTranslateRight = Animated.multiply(
        animatedRightAllowed,
        Animated.add(
            animatedTranslate.interpolate({
                inputRange: [-50, 0],
                outputRange: [-29, 0],
                extrapolate: 'clamp',
            }),
            Animated.multiply(-1, animatedTranslateItem).interpolate({
                inputRange: [10, 300],
                outputRange: [0, 300 - 10],
                extrapolate: 'clamp',
            }),
        ),
    );

    const calculatePanArea = React.useMemo(() => {
        if (!layout || isDM) {
            return {left: 0, right: 0, top: 0, bottom: 0};
        }
        const {width, height, x} = layout;
        const horizontalInset = Math.min(0, 180 - (width - x));
        const verticalInset = Math.min(0, 300 - height);
        const hitSlops = {
            left: horizontalInset / 2 - x,
            right: horizontalInset / 2,
            top: verticalInset / 2,
            bottom: verticalInset / 2,
        };
        return hitSlops;
    }, [layout]);

    return (
        <PanGestureHandler
            activeOffsetX={[-5, 5]}
            failOffsetY={[-5, 5]}
            hitSlop={calculatePanArea}
            onGestureEvent={_onPanGestureEvent}
            onHandlerStateChange={onHandlerStateChange}>
            <Animated.View
                style={{
                    flex: 0,
                    transform: [{translateX: animatedTranslateItem}],
                }}>
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            zIndex: 99,
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            left: -30,
                        },
                        {transform: [{translateX: animatedTranslateLeft}]},
                    ]}>
                    {renderLeftIcon()}
                </Animated.View>
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            zIndex: 99,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            right: 0,
                        },
                        {
                            transform: [
                                {
                                    translateX: Animated.add(
                                        -65,
                                        animatedTranslateRight,
                                    ),
                                },
                            ],
                        },
                    ]}>
                    {renderRightIcon()}
                </Animated.View>
                {children}
            </Animated.View>
        </PanGestureHandler>
    );
}
