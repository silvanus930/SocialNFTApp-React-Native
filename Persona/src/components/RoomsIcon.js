import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function RoomsIcon({focused, color = 'white', style = {}}) {
    return (
        <Ionicons
            name={focused ? 'ios-radio-sharp' : 'ios-radio-outline'}
            size={24}
            color={color}
            style={{...style}}
        />
    );
}
