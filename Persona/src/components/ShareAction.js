import React from 'react';
import {Text, StyleSheet} from 'react-native';
import baseText from 'resources/text';
import colors from 'resources/colors';

export default function ShareAction({
    style = {},
    disabled = false,
    message = 'Post',
}) {
    return (
        <Text
            style={{
                ...Styles.shareText,
                ...baseText,
                color: disabled ? colors.textFaded2 : colors.actionText,
                ...style,
            }}>
            {message}
        </Text>
    );
}

const Styles = StyleSheet.create({
    shareText: {
        color: colors.actionText,
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 2,
        marginRight: 4,
    },
});
