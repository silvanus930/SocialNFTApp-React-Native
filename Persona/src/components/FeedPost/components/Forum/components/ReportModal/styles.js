import {StyleSheet} from 'react-native';
import {colors, baseText} from 'resources';

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        flexDirection: 'column',
        borderColor: 'orange',
        borderWidth: 2,
        borderRadius: 10,
        marginLeft: 20,
        marginRight: 20,
        marginTop: 10,
        marginBottom: 10,
        padding: 16,
    },
    icon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    text1: {
        ...baseText,
        color: colors.text,
        marginStart: 20,
        marginTop: 20,
        marginBottom: 20,
    },
    text2: {
        ...baseText,
        color: colors.text,
        marginStart: 20,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    text3: {
        ...baseText,
        color: colors.text,
    },
    sendIcon: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
});

export default styles;
