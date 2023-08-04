import {StyleSheet} from 'react-native';
import colors from 'resources/colors';
import {ACTIVITY_PROFILE_SIZE} from 'components/ActivityEventSimple';
import {ACTIVITY_FONT_SIZE} from 'components/ActivityConstants';

const styles = StyleSheet.create({
    entityDisplayContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginRight: 5,
    },
    eventSimpleContainer: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        borderColor: 'purple',
        marginTop: 1.5,
    },
    eventItemTextContainer: {
        flex: 0.5,
    },
    eventItemText: {
        borderColor: 'yellow',
        borderWidth: 0,
        color: colors.text,
    },
    personaLocationText: {
        color: colors.text,
        fontSize: ACTIVITY_FONT_SIZE,
    },
    profilePicture: {
        height: ACTIVITY_PROFILE_SIZE,
        width: ACTIVITY_PROFILE_SIZE,
        borderRadius: 38,
        marginLeft: 0,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
    personaProfilePicture: {
        height: ACTIVITY_PROFILE_SIZE,
        width: ACTIVITY_PROFILE_SIZE,
        borderRadius: 5,
        marginLeft: 0,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
    userProfilePicture: {
        height: ACTIVITY_PROFILE_SIZE,
        width: ACTIVITY_PROFILE_SIZE,
        borderRadius: 100,
        marginLeft: 10,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
});

export default styles;