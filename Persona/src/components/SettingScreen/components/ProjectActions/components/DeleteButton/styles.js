import {StyleSheet} from 'react-native';
import {colors, fonts} from 'resources';

const styles = StyleSheet.create({
    container: {
        borderColor: 'orange',
        borderWidth: 0,
        backgroundColor: colors.paleBackground,
        borderRadius: 8,
        marginTop: 20,
        paddingTop: 11,
        paddingBottom: 11,
        marginStart: 40,
        marginEnd: 40,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingLeft: 20,
        alignItems: 'center',
    },
    text: {
        marginStart: 12,
        flexDirection: 'row',
        fontSize: 16,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: fonts.regular,
        color: colors.red,
    },
});

export default styles;
