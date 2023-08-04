import React, {useState} from 'react';
import {
    TouchableOpacity,
    View,
    Dimensions,
    Text,
    StyleSheet,
    SafeAreaView,
} from 'react-native';

export default function Button({style, onPress, disabled, textStyle, message}) {
    return (
        <View style={{borderColor: 'white', borderWidth: 0.5}}>
            <TouchableOpacity disabled={disabled} onPress={onPress}>
                <Text style={textStyle}>{message.toUpperCase()}</Text>
            </TouchableOpacity>
        </View>
    );
}
