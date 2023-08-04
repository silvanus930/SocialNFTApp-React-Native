import React from 'react';
import {TextInput} from 'react-native';
import styles from './styles';

const TextInputBox = ({
    value,
    placeholder,
    onChangeText,
    multiline = false,
    height = 44,
}) => (
    <TextInput
        style={styles.container(height)}
        editable={true}
        autoCapitalize="none"
        multiline={multiline}
        maxLength={2200}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={'grey'}
        onChangeText={onChangeText}
        keyboardAppearance={'dark'}
    />
);

export default TextInputBox;
