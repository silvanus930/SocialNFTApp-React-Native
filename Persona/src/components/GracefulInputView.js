import React from 'react';
import {
    KeyboardAvoidingView,
    Keyboard,
    Platform,
    View,
    TouchableWithoutFeedback,
} from 'react-native';

const GracefulInputView = ({children, ...props}) => (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        {...props}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View>{children}</View>
        </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
);

export default GracefulInputView;
