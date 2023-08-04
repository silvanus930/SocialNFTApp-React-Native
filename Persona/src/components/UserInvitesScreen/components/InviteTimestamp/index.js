import React, {useState, useEffect} from 'react';
import {
    Text
} from 'react-native';

import fonts from 'resources/fonts';
import colors from 'resources/colors';
import baseText from 'resources/text';

import {timestampToDateString} from 'utils/helpers';

import { ACTIVITY_TIMESTAMP_FONT_SIZE } from 'components/ActivityEventSimple';

const InviteTimestamp = ({invite}) => {
    const [hack, setHack] = React.useState(true);
    React.useEffect(() => {
        const interval = setInterval(async () => {
            setHack(!hack);
        }, 60000);

        return () => clearInterval(interval);
    }, [hack, setHack]);

    return (
        <Text
            style={{
                ...baseText,
                fontSize: ACTIVITY_TIMESTAMP_FONT_SIZE,
                fontFamily: fonts.timestamp,
                color: colors.timestamp,
                marginTop: 10,
            }}>
            {timestampToDateString(invite.createdAt.seconds)}
        </Text>
    );
};

export default InviteTimestamp;