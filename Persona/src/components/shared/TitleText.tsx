import React from 'react';
import baseText from 'resources/text';
import {Text} from 'react-native';
import colors from 'resources/colors';

import {ACTIVITY_FONT_SIZE} from 'utils/constants';

export const TitleText = props => (
    <Text
        style={{
            ...baseText,
            fontSize: ACTIVITY_FONT_SIZE,
            color: colors.textBright,
            ...props.style,
        }}>
        {props.children}
    </Text>
);
