import React from 'react';
import baseText from 'resources/text';
import {Text} from 'react-native';
import colors from 'resources/colors';

export const ACTIVITY_TEXT_MAX_LENGTH = 125;
export const ACTIVITY_POST_PREVIEW_TEXT_MAX_LENGTH = 125;
export const ACTIVITY_PREVIEW_COLOR = colors.textFaded;
export const ACTIVITY_PREVIEW_TEXT_SIZE = 14;
export const MEDIA_SIZE = 100;
export const ACTIVITY_ICON_SIZE = 22;
export const ACTIVITY_PROFILE_SIZE = 36;
export const ACTIIVTY_TINY_PROFILE_SIZE = 15;
export const ITEM_BOTTOM_MARGIN = 8.4;
export const ITEM_TOP_MARGIN = 14.2;
export const ACTIVITY_FONT_SIZE = 14;

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
