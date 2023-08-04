import React from 'react';
import Icon from 'react-native-vector-icons/Feather';
import palette from 'resources/palette';
import colors from 'resources/colors';

export default function HeaderDeleteIcon() {
    return (
        <Icon
            color={colors.navSubProminent}
            name="x"
            size={palette.header.icon.size}
        />
    );
}
