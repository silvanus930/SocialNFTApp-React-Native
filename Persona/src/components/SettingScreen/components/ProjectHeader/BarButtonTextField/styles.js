import {StyleSheet} from 'react-native';
import {colors, fonts} from 'resources';

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderColor: 'magenta',
        borderWidth: 0,
        backgroundColor: colors.paleBackground,
        borderRadius: 8,
        paddingTop: 4,
        marginLeft: 40,
        marginRight: 40,
        width: '100%',
        height: 48,
        paddingBottom: 4,
        marginTop: 20,
    },
    labelContainer: {
        marginBottom: 0,
        borderColor: 'blue',
        borderWidth: 0,
        width: '100%',
        flexDirection: 'row',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100%',
    },
    labelText: {
        marginStart: 20,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.text,
    },
    textContainer: {
        flex: 1,
        borderColor: 'magenta',
        borderWidth: 0,
        justifyContent: 'flex-end',
        flexDirection: 'row',
        marginRight: 20,
    },
    text: {
        marginStart: 20,
        color: colors.maxFaded,
        fontFamily: fonts.regular,
        fontSize: 16,
    },
});

export default styles;
