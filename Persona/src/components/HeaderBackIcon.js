import React from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import palette from 'resources/palette';
import colors from 'resources/colors';

import AntDesign from 'react-native-vector-icons/AntDesign';

export default function HeaderBackIcon({back}) {
    return back ? (
        <View style={{borderColor: 'blue', borderWidth: 0, padding: 0}}>
            <Icon
                color={colors.navIcon}
                name={'chevron-left'}
                size={palette.header.icon.size}
            />
        </View>
    ) : (
        <View style={{borderColor: 'blue', borderWidth: 0, padding: 10}}>
            <AntDesign
                color={colors.navIcon}
                name={'menufold'}
                size={palette.header.icon.size + 2}
            />
        </View>
    );
}
