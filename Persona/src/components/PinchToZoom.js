import React from 'react';
import {Animated, Easing} from 'react-native';
import {
    PanGestureHandler,
    PinchGestureHandler,
    State,
} from 'react-native-gesture-handler';

export default function PinchToZoom({
    disabled = false,
    children,
    waitFor = [],
}) {
    const panRef = React.useRef(null);
    const pinchRef = React.useRef(null);
    const pinchScale = React.useRef(new Animated.Value(1)).current;
    const focalX = React.useRef(new Animated.Value(0)).current;
    const focalY = React.useRef(new Animated.Value(0)).current;
    const onPinchGestureEvent = Animated.event(
        [{nativeEvent: {scale: pinchScale}}],
        {
            useNativeDriver: true,
        },
    );
    const translationXRef = React.useRef(0);
    const translationX = React.useRef(new Animated.Value(0)).current;
    const translationYRef = React.useRef(0);
    const translationY = React.useRef(new Animated.Value(0)).current;
    const onPanGestureEvent = Animated.event(
        [{nativeEvent: {translationX, translationY}}],
        {
            useNativeDriver: true,
            listener: ({
                nativeEvent: {translationX: xVal, translationY: yVal},
            }) => {
                translationXRef.current = xVal;
                translationYRef.current = yVal;
            },
        },
    );

    const onPinchHandlerStateChange = event => {
        if (event.nativeEvent.state === State.ACTIVE) {
            focalX.setValue(event.nativeEvent.focalX + translationXRef.current);
            focalY.setValue(event.nativeEvent.focalY + translationYRef.current);
        }
        if (event.nativeEvent.oldState === State.ACTIVE) {
            Animated.timing(pinchScale, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
                easing: Easing.easeOut,
            }).start();
            Animated.timing(focalX, {
                toValue: pictureXRef.current,
                duration: 350,
                useNativeDriver: true,
                easing: Easing.easeOut,
            }).start();
            Animated.timing(focalY, {
                toValue: pictureYRef.current,
                duration: 350,
                useNativeDriver: true,
                easing: Easing.easeOut,
            }).start();
        }
    };
    const onPanHandlerStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            Animated.timing(translationX, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
                easing: Easing.easeOut,
            }).start();
            Animated.timing(translationY, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
                easing: Easing.easeOut,
            }).start();
        }
    };
    const clippedScale = pinchScale.interpolate({
        inputRange: [1, 99],
        outputRange: [1, 99],
        extrapolate: 'clamp',
    });

    const pictureHeight = React.useRef(new Animated.Value(50)).current;
    const pictureWidth = React.useRef(new Animated.Value(50)).current;

    const pictureXRef = React.useRef(150);
    const pictureYRef = React.useRef(150);
    const pictureX = React.useRef(new Animated.Value(0)).current;
    const pictureY = React.useRef(new Animated.Value(150)).current;
    const translateX = Animated.add(
        Animated.multiply(
            Animated.subtract(
                Animated.multiply(pictureWidth, 0.5),
                Animated.subtract(focalX, pictureX),
            ),
            Animated.subtract(clippedScale, 1),
        ),
        translationX,
    );
    const translateY = Animated.add(
        Animated.multiply(
            Animated.subtract(
                Animated.multiply(pictureHeight, 0.5),
                Animated.subtract(focalY, pictureY),
            ),
            Animated.subtract(clippedScale, 1),
        ),
        translationY,
    );

    return disabled ? (
        children
    ) : (
        <PanGestureHandler
            ref={panRef}
            waitFor={waitFor}
            simultaneousHandlers={pinchRef}
            avgTouches
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanHandlerStateChange}>
            <Animated.View>
                <PinchGestureHandler
                    ref={pinchRef}
                    waitFor={waitFor}
                    simultaneousHandlers={panRef}
                    onGestureEvent={onPinchGestureEvent}
                    onHandlerStateChange={onPinchHandlerStateChange}>
                    <Animated.View
                        onLayout={({
                            nativeEvent: {
                                layout: {height, width, x, y},
                            },
                        }) => {
                            pictureXRef.current = x;
                            focalX.setValue(0);
                            pictureX.setValue(pictureXRef.current);
                            pictureYRef.current = y;
                            focalY.setValue(0);
                            pictureY.setValue(pictureYRef.current);
                            pictureWidth.setValue(width || 150);
                            pictureHeight.setValue(height || 150);
                        }}
                        style={[
                            {
                                transform: [
                                    {scale: clippedScale},
                                    {
                                        translateX: Animated.divide(
                                            translateX,
                                            pinchScale,
                                        ),
                                    },
                                    {
                                        translateY: Animated.divide(
                                            translateY,
                                            pinchScale,
                                        ),
                                    },
                                ],
                            },
                        ]}>
                        {children}
                    </Animated.View>
                </PinchGestureHandler>
            </Animated.View>
        </PanGestureHandler>
    );
}
