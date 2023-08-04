import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import styles from './styles';

const Button = ({title, onPress, style, textStyle, noBorder, disable}) => {
    if (disable) {
        return (
            <View
                style={styles.container(style, noBorder)}
                onPress={!disable ? onPress : () => {}}>
                <Text style={styles.text(textStyle)}>{title}</Text>
            </View>
        );
    }
    return (
        <TouchableOpacity
            style={styles.container(style, noBorder)}
            onPress={onPress}>
            <Text style={styles.text(textStyle)}>{title}</Text>
        </TouchableOpacity>
    );
};

export default Button;
