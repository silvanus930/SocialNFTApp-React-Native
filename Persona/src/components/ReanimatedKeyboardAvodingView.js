import React from 'react';
import {Animated, Platform, Keyboard, Easing} from 'react-native';

export function KeyboardingAvoidingViewByTranslate({
    children,
    animatedTranslateY,
    style = {},
}) {
    const animatedKeyboardHeight = React.useRef(new Animated.Value(0)).current;

    function keyboardWillShow(e) {
        Animated.timing(animatedKeyboardHeight, {
            toValue: -e.endCoordinates.height,
            duration: e.duration || 200,
            useNativeDriver: true,
            easing: Easing.Keyboard,
        }).start();
    }

    function keyboardWillHide(e) {
        Animated.timing(animatedKeyboardHeight, {
            toValue: 0,
            duration: e.duration || 200,
            useNativeDriver: true,
            easing: Easing.Keyboard,
        }).start();
    }

    React.useEffect(() => {
        Keyboard.addListener('keyboardWillShow', keyboardWillShow);
        Keyboard.addListener('keyboardWillHide', keyboardWillHide);
        Keyboard.addListener('keyboardDidShow', keyboardWillShow);
        Keyboard.addListener('keyboardDidHide', keyboardWillHide);
        return () => {
            Keyboard.removeListener('keyboardWillShow', keyboardWillShow);
            Keyboard.removeListener('keyboardWillHide', keyboardWillHide);
            Keyboard.removeListener('keyboardDidShow', keyboardWillShow);
            Keyboard.removeListener('keyboardDidHide', keyboardWillHide);
        };
    }, []);

    return (
        <Animated.View
            style={[
                {
                    height: '110%',
                    transform: [
                        {
                            translateY: Animated.add(
                                animatedKeyboardHeight,
                                animatedTranslateY,
                            ),
                        },
                    ],
                },
                style,
            ]}>
            {children}
        </Animated.View>
    );
}
