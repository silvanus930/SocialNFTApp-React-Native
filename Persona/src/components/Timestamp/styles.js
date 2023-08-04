import {StyleSheet} from 'react-native';
import fonts from 'resources/fonts';
import baseText from 'resources/text';

const styles = StyleSheet.create({
    timestamp: {
        ...baseText,
        fontSize: 12,
        fontFamily: fonts.timestamp,
        fontWeight: '500',
    },
});

export default styles;
