import {StyleSheet, Dimensions} from 'react-native';
import {baseText} from 'resources';

export const USER_ICON_SIZE = 48;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        width: Dimensions.get('screen').width / 4,
    },

    userIcon: {
        width: USER_ICON_SIZE,
        height: USER_ICON_SIZE,
        borderRadius: 100,
    },
    usernameText: {
        ...baseText,
        fontWeight: '500',
        color: '#E6E8EB',
        fontSize: 12,
    },
});

export default styles;
