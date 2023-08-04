import {StyleSheet} from 'react-native';
import {baseText, fonts} from 'resources';

const styles = StyleSheet.create({
    text: {
        ...baseText,
        fontSize: 15,
        fontFamily: fonts.timestamp,
        margin: 5,
    },
});

export default styles;
