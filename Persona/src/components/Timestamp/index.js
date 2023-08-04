import React from 'react';
import {Text} from 'react-native';
import colors from 'resources/colors';
import {timestampToDateString} from 'utils/helpers';

import defaultStyles from './styles';

export default ({
    top = 0,
    color = colors.timestamp,
    seconds,
    style,
    format = 'default',
}) => {
    const [hack, setHack] = React.useState(true);
    React.useEffect(() => {
        const interval = setInterval(async () => {
            setHack(!hack);
        }, 60000);

        return () => clearInterval(interval);
    }, [hack, setHack]);

    return (
        <Text style={[style ? style : defaultStyles.timestamp, {top, color}]}>
            {timestampToDateString(seconds, format)}
        </Text>
    );
};
