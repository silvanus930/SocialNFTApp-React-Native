import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import styles from './styles';

const PaddedLongButton = ({
    IconComponent = null,
    label,
    style = {},
    onPress = null,
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{...styles.container, ...style}}>
            {IconComponent && <IconComponent />}
            <Text style={styles.text}>{label}</Text>
        </TouchableOpacity>
    );
};

export default PaddedLongButton;
