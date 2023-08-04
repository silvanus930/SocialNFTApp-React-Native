import React from 'react';
import DeviceInfo from 'react-native-device-info';
import colors from 'resources/colors';
import {View, Platform} from 'react-native';

export const notchHeight = 33;
export const heightOffset = DeviceInfo.hasNotch() ? notchHeight : 0;

export default function NotchSpacer() {
    return (
        <View
            style={{
                height: heightOffset,
                backgroundColor: 'transparent',
            }}
        />
    );
}
