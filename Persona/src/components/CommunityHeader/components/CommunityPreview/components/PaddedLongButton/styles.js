import {StyleSheet} from 'react-native';
import {colors, fonts, baseText} from 'resources';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
        marginRight: 10,
        padding: 6,
        paddingLeft: 3,
        paddingRight: 3,
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: colors.navSubProminent,
    },
    text: {
        ...baseText,
        lineHeight: null,
        fontFamily: fonts.regular,
        fontSize: 16,
        paddingLeft: 4,
        paddingRight: 4,
        color: colors.navIcon,
    },
});

export default styles;
