import React from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import styles from './styles';

const BarButtonTextField = ({onPress, label, text}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onPress} style={styles.labelContainer}>
                <Text style={styles.labelText}>{label}</Text>
                <View style={styles.textContainer}>
                    <Text numberOfLines={1} style={styles.text}>
                        {text}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default BarButtonTextField;
