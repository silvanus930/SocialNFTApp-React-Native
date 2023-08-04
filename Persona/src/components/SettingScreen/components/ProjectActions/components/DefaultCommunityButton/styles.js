import {StyleSheet} from 'react-native';
import {colors, fonts} from 'resources';

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        borderColor: 'orange',
        borderWidth: 0,
        backgroundColor: colors.paleBackground,
        borderRadius: 8,
        marginStart: 40,
        paddingTop: 4,
        paddingBottom: 4,
        marginEnd: 40,
        marginTop: 20,
        height: 45,
    },
    text: {
        marginTop: 7,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.text,
    },
});

export default styles;
