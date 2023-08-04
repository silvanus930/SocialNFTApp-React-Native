import React from 'react';
import {Text, View} from 'react-native';
import colors from 'resources/colors';
import baseText from 'resources/text';

import {clog, cwarn, iwarn} from 'utils/log';
import Feather from 'react-native-vector-icons/Feather';
const CUSTOM_LOG_WARN_HEADER = '!! components/homePost/PostHeader';
const log = (...args) =>
    global.LOG_DEBUG && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_DEBUG && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);

export default function SeenCounter({
    numberOthersSeen,
    showNumber = undefined,
}) {
    return numberOthersSeen > 0 ? (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                height: 10,
                marginRight: 3,
            }}>
            {(showNumber || numberOthersSeen > 1) && (
                <Text
                    style={{
                        ...baseText,
                        lineHeight: null,
                        color: colors.maxFaded,
                        marginRight: 2,
                        fontSize: 12,
                        top: 2,
                    }}>
                    {numberOthersSeen}
                </Text>
            )}
            <Feather
                name="eye"
                color={colors.maxFaded}
                size={10}
                style={{top: Platform.OS === 'ios' ? 2.2 : 1.3}}
            />
        </View>
    ) : (
        <></>
    );
}
