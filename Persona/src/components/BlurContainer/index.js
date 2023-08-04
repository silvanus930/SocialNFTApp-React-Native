import React from 'react';
import {Platform} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Animated from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const BlurContainer =
    Platform.OS === 'android' ? Animated.View : AnimatedBlurView;

export default BlurContainer;
