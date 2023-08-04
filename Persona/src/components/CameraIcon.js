import React from 'react';
import {TouchableOpacity, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import colors from 'resources/colors';

export default function CameraIcon({
    onPress = null,
    style = {},
    containerStyle = {},
}) {
    return (
        <TouchableOpacity
            style={{zIndex: 999999, elevation: 999999}}
            onPress={onPress}>
            <View style={{...Styles.cameraContainer, ...containerStyle}}>
                <View style={{...Styles.cameraIconContainer, ...style}}>
                    <Icon name="camera" size={16} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const Styles = StyleSheet.create({
    cameraIconContainer: {
        flex: 1,
        paddingLeft: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraContainer: {
        opacity: 0.9,
        height: 35,
        width: 35,
        borderRadius: 40,
        backgroundColor: colors.cameraIcon,
        position: 'absolute',
        marginStart: 95,
        marginTop: 60,
        zIndex: 1,
        elevation: 1,
        flexDirection: 'row',
    },
});
