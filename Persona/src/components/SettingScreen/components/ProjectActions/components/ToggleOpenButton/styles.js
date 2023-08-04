import {StyleSheet} from 'react-native';
import {colors, fonts} from 'resources';

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderColor: 'orange',
        borderWidth: 0,
        backgroundColor: colors.paleBackground,
        borderRadius: 8,
        marginStart: 40,
        paddingTop: 4,
        paddingBottom: 4,
        marginEnd: 40,
        marginTop: 20,
    },
    subContainer: {
        marginStart: 8,
        marginBottom: 0,
        flexDirection: 'row',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    text: {
        marginStart: 22,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.text,
    },
    toggleContainer: pid => ({
        flexDirection: 'row',
        justifyContent: 'flex-end',
        flex: 0,
        borderColor: 'orange',
        borderWidth: 0,
        width: pid ? '50%' : '40%',
    }),
    toggleText: {
        color: colors.maxFaded,
        fontFamily: fonts.regular,
        fontSize: 16,
    },
});

export default styles;
