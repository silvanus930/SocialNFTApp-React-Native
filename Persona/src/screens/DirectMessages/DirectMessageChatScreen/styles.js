import {Platform, StyleSheet} from 'react-native';
import {fonts, baseText, constants, colors} from 'resources';

export const HEADER_HEIGHT = 108;
export const USER_ICON_SIZE = 36;

const styles = StyleSheet.create({
    discussionEngineContainer: {
        flex: 1,
    },
    headerCenterStyleContainer: {
        justifyContent: 'flex-start',
    },

    headerUserIconContainer: {marginRight: 12},
    userIcon: {
        width: USER_ICON_SIZE,
        height: USER_ICON_SIZE,
        borderRadius: 100,
    },
    headerUsername: {
        color: '#E6E8EB',
        fontWeight: 500,
        fontSize: 18,
    },
});

export default styles;
