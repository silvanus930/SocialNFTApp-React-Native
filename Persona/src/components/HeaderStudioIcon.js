import React from 'react';
import Icon from 'react-native-vector-icons/Feather';
import palette from 'resources/palette';

export default function HeaderStudioIcon() {
    return (
        <Icon
            color={palette.header.icon.color}
            name="plus-circle"
            size={palette.header.icon.size}
        />
    );
}
