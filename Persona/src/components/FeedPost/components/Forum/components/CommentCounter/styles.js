import {StyleSheet} from 'react-native';
import baseText from 'resources/text';
import fonts from 'resources/fonts';

const styles = StyleSheet.create({
    container: style => ({
        flexDirection: 'row',
        ...style,
    }),
    image: {width: 18, height: 18, marginRight: 6},
    text: {
        ...baseText,
        color: 'white',
        fontFamily: fonts.medium,
    },
});

export default styles;
