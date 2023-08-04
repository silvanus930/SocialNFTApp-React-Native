import {StyleSheet} from 'react-native';
import {baseText} from 'resources';

export const USER_ICON_SIZE = 48;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        flex: 1,
        paddingHorizontal: 20,
    },
    innerContainer: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2E3133',
    },
    userIcon: {
        width: USER_ICON_SIZE,
        height: USER_ICON_SIZE,
        borderRadius: 100,
    },
    contentContainer: {
        flex: 1,
        marginStart: 12,
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    contentContainerUsername: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    contentContainerMessage: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainerMessageInner: {
        flex: 1,
    },
    usernameText: {
        ...baseText,
        fontWeight: '500',
        color: '#E6E8EB',
        fontSize: 16,
    },
    messageText: beenSeen => ({
        fontWeight: 400,
        fontSize: 14,
        color: !beenSeen ? '#E6E8EB' : '#AAAEB2',
    }),

    notSeenIndiciator: {
        color: '#5F7EA1',
        fontSize: 10,
    },

    timestamp: {
        fontWeight: '400',
        fontSize: 12,
        color: '#868B8F',
    },

    error: {
        ...baseText,
        color: 'red',
        fontWeight: 'bold',
        fontStyle: 'italic',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'pink',
        marginVertical: 2,
    },
});

export default styles;
