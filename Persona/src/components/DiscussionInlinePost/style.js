import {Dimensions, StyleSheet} from 'react-native';
import baseText from 'resources/text';
import colors from 'resources/colors';
import fonts from 'resources/fonts';

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        borderColor: 'pink',
        borderWidth: 0,
    },
    noFeedback: {
        width: Dimensions.get('window').width * 0.8,
        padding: 15,
        borderRadius: 6,
        backgroundColor: '#1B1D1F',
    },
    allChat: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 3,
    },
    containerText: {
        ...baseText,
        color: colors.maxFaded,
        fontFamily: fonts.regular,
        fontSize: 12,
        marginStart: 3,
        paddingBottom: 0,
    },
    allChatText: {
        ...baseText,
        color: colors.textFaded,
        fontSize: 12,
    },
    untitledText: {
        ...baseText,
        color: colors.postAction,
        fontWeight: '500',
        marginTop: -3,
        paddingBottom: 8,
        fontSize: 16,
        marginStart: 3,
    },
    personaProfilePicture: {
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
