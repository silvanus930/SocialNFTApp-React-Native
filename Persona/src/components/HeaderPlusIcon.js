import React from 'react';
import Icon from 'react-native-vector-icons/Feather';
import palette from 'resources/palette';

export default function HeaderPlusIcon() {
    return (
        <Icon
            color={palette.header.icon.color}
            name="plus"
            size={palette.header.icon.size}
        />
    );
}
