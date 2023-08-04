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
        backgroundColor: colors.emphasisBackground,
        borderRadius: 8,
        marginStart: 40,
        paddingTop: 4,
        paddingBottom: 4,
        marginEnd: 40,
        marginTop: 20,
    },
    subContainer: {
        marginStart: 6,
        marginBottom: 0,
        flexDirection: 'row',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    text: {
        marginStart: 0,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.text,
        left: 22,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        flex: 0,
        borderColor: 'orange',
        borderWidth: 0,
        width: '70%',
    },
    toggleText: {
        color: colors.maxFaded,
        fontFamily: fonts.regular,
        fontSize: 16,
    },
});

export default styles;
