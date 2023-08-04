import {useEffect, useRef, useState} from 'react';
import {Animated, Keyboard, Platform} from 'react-native';

export let useKeyboard;

if (Platform.OS === 'android') {
    useKeyboard = (onDidShow, onDidHide) => {
        const keyboardHeight = useRef(new Animated.Value(0)).current;
        const [keyboardHeightNum, setKeyboardHeightNum] = useState(0);
        const [keyboardHeightAnimatedNum, setKeyboardHeightAnimatedNum] =
            useState(0);

        function droidKeyboardDidShow(e) {
            setKeyboardHeightNum(e.endCoordinates.height);
            setKeyboardHeightAnimatedNum(0);
            Animated.timing(keyboardHeight, {
                toValue: e.endCoordinates.height,
                duration: 250,
                useNativeDriver: true,
            }).start();

            setKeyboardHeightAnimatedNum(e.endCoordinates.height);

            if (onDidShow) {
                onDidShow();
            }
        }

        function droidKeyboardDidHide(e) {
            Animated.timing(keyboardHeight, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start(() => {
                setKeyboardHeightNum(e.endCoordinates.height);
                setKeyboardHeightAnimatedNum(0);
                if (onDidHide) {
                    onDidHide();
                }
            });
        }

        useEffect(() => {
            keyboardHeight.addListener(({value}) => {
                setKeyboardHeightAnimatedNum(value);
            });
            Keyboard.addListener('keyboardDidShow', droidKeyboardDidShow);
            Keyboard.addListener('keyboardDidHide', droidKeyboardDidHide);

            return () => {
                Keyboard?.removeListener &&
                    Keyboard.removeListener(
                        'keyboardDidShow',
                        droidKeyboardDidShow,
                    );
                Keyboard?.removeListener &&
                    Keyboard.removeListener(
                        'keyboardDidHide',
                        droidKeyboardDidHide,
                    );
                keyboardHeight?.removeAllListeners &&
                    keyboardHeight.removeAllListeners();
            };
        }, []);

        return [keyboardHeightAnimatedNum];
    }; // droidUseKeyboard
} else {
    // iosUseKeyboard

    useKeyboard = (onDidShow, onDidHide) => {
        const keyboardHeight = useRef(new Animated.Value(0)).current;

        //const [keyboardHeight, setKeyboardHeight] = useState(new Animated.Value(0));
        const [keyboardHeightNum, setKeyboardHeightNum] = useState(0);
        const [keyboardHeightAnimatedNum, setKeyboardHeightAnimatedNum] =
            useState(0);

        function keyboardWillShow(e) {
            setKeyboardHeightNum(e.endCoordinates.height);
            setKeyboardHeightAnimatedNum(0);
            Animated.timing(keyboardHeight, {
                toValue: e.endCoordinates.height,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                if (onDidShow) {
                    onDidShow();
                }
            });
        }

        function keyboardWillHide(e) {
            Animated.timing(keyboardHeight, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                // completion callback

                setKeyboardHeightNum(e.endCoordinates.height);
                setKeyboardHeightAnimatedNum(0);
                if (onDidHide) {
                    onDidHide();
                }
            });
        }

        useEffect(() => {
            keyboardHeight?.addListener &&
                keyboardHeight.addListener(({value}) => {
                    setKeyboardHeightAnimatedNum(value);
                });

            Keyboard?.addListener &&
                Keyboard.addListener('keyboardWillShow', keyboardWillShow);
            Keyboard?.addListener &&
                Keyboard.addListener('keyboardWillHide', keyboardWillHide);

            return () => {
                Keyboard?.removeListener &&
                    Keyboard.removeListener(
                        'keyboardWillShow',
                        keyboardWillShow,
                    );
                Keyboard?.removeListener &&
                    Keyboard.removeListener(
                        'keyboardWillHide',
                        keyboardWillHide,
                    );
                keyboardHeight?.removeAllListeners &&
                    keyboardHeight.removeAllListeners();
            };
        }, []);

        return [keyboardHeightAnimatedNum];
    };
}
