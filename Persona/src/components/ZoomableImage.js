import React from 'react';
import {Animated, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import Pinachable from 'react-native-pinchable';

import {GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, RotationGestureHandler, State,} from 'react-native-gesture-handler';

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);
export default ZoomableImage = (props) => {

    const rotationRef = React.createRef();
    const pinchRef = React.createRef();
    const dragRef = React.createRef();

    const baseScale = new Animated.Value(1);
    const pinchScale = new Animated.Value(1);
    const scale = Animated.multiply(baseScale, pinchScale);

    const onPinchGestureEvent = Animated.event(
        [{nativeEvent: {scale: pinchScale}}],
        {useNativeDriver: true}
    );

    const rotate = new Animated.Value(0);
    const rotateStr = rotate.interpolate({
        inputRange: [-100, 100],
        outputRange: ['-100rad', '100rad'],
    });

    const onRotateGestureEvent = Animated.event(
        [{nativeEvent: {rotation: rotate}}],
        {useNativeDriver: true}
    );

    const tilt = new Animated.Value(0);

    const translateX = new Animated.Value(0);
    const translateY = new Animated.Value(0);

    const onGestureEvent = Animated.event(
        [
            {
                nativeEvent: {
                    translationX: translateX,
                    translationY: translateY,
                },
            },
        ],
        {useNativeDriver: true}
    );

    const onRotateHandlerStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            console.log('reset')
            reset();
        }
    };
    const onPinchHandlerStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            console.log('reset')
            reset();
        }
    };

    const onPanGestureStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            console.log('reset')
            reset();
        }
    };

    const reset = () => {
      baseScale.setValue(1);
      pinchScale.setValue(1);
      rotate.setOffset(0);
      rotate.setValue(0);
      tilt.setOffset(0);
      tilt.setValue(0);
      translateX.setOffset(0);
      translateX.setValue(0);
      translateY.setOffset(0);
      translateY.setValue(0);
    }; 

  return (
        <Pinachable 
            style={styles.container}
        >                 
            <AnimatedFastImage
                key={props.key}
                resizeMode={"contain"}
                style={
                    props.style
                }
                source={props.source}
            />
        </Pinachable>
    
  );
}

  
const styles = StyleSheet.create({

    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    wrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinchableImage: {
        width: 200,
        height: 200,
    },
});






