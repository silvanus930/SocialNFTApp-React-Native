import React from 'react';
import {View} from 'react-native';
import colors from 'resources/colors';

export default function ZeroMarginSeperator({style}) {
    return (
        <View
            style={{
                backgroundColor: colors.seperatorLineColor,
                height: 0.4,
                justifyContent: 'center',
                ...style,
            }}
        />
    );
}
