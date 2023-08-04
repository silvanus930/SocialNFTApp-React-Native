import {StyleSheet, Dimensions} from 'react-native';
import {baseText, colors, fonts} from 'resources';

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        borderColor: 'pink',
        borderWidth: 0,
    },
    subContainer: {
        width: Dimensions.get('window').width * 0.95,
        padding: 15,
        borderRadius: 6,
        backgroundColor: '#1B1D1F',
    },
    textUserName: {
        ...baseText,
        color: colors.maxFaded,
        fontFamily: fonts.regular,
        fontSize: 12,
        marginStart: 3,
        paddingBottom: 0,
    },
    textPostNameContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 3,
    },
    textPostName: {
        ...baseText,
        color: colors.textFaded,
        fontSize: 12,
    },
    textPostTitle: {
        ...baseText,
        color: colors.postAction,
        fontWeight: '500',
        marginTop: -3,
        paddingBottom: 8,
        fontSize: 16,
        marginStart: 3,
    },
    profilePicture: {
        height: 12,
        width: 12,
        borderRadius: 5,
        marginLeft: 0,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
        marginRight: 5,
    },
});

export default styles;
