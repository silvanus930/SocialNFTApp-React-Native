import {Dimensions, StyleSheet, Text, View} from 'react-native';
import baseText from 'resources/text';
import palette from 'resources/palette';
import React from 'react';

export default function AppHeader() {
    return (
        <View style={palette.header.style}>
            <View style={Style.text}>
                <Text style={palette.header.text}>Persona</Text>
            </View>
        </View>
    );
}

const Style = StyleSheet.create({
    text: {
        ...baseText,
        alignItems: 'center',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        width: Dimensions.get('screen').width,
    },
});
