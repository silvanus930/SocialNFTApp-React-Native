import React from 'react';
import {View} from 'react-native';
import colors from 'resources/colors';

export default function LineSeperator({
    style = {marginTop: 10, paddingTop: 0},
}) {
    return (
        <View
            style={{
                backgroundColor: colors.seperatorLineColor,
                height: 0.7,
                justifyContent: 'center',
                ...style,
            }}
        />
    );
}
