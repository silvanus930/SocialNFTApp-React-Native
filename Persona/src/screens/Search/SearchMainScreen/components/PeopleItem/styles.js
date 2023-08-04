import {StyleSheet} from 'react-native';
import {baseText} from 'resources';

import {USER_ICON_SIZE} from 'screens/Search/styles';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    userIcon: {
        width: USER_ICON_SIZE,
        height: USER_ICON_SIZE,
        borderRadius: 100,
    },
    contentContainer: {
        flex: 1,
    },
    highlightedText: {
        color: '#fff',
        fontWeight: '500',
        backgroundColor: 'rgba(255,255,255, 0.12)',
    },
    userName: {
        ...baseText,
        color: '#F0F2F5',
        fontWeight: 500,
        fontSize: 16,
        lineHeight: 22,
    },
    userDetail: {
        ...baseText,
        color: '#D0D3D6',
        fontSize: 14,
        fontWeight: 400,
    },
    actionContainer: {
        borderRadius: 6,
        paddingVertical: 7,
        width: 80,
        height: 36,
        alignItems: 'center',
    },
    actionPrimary: {
        backgroundColor: '#375E8A',
    },
    actionSecondary: {
        borderWidth: 0.5,
        borderColor: '#AAAEB2',
    },
    actionText: {
        ...baseText,
        color: '#FFFFFF',
        fontWeight: 500,
        fontSize: 14,
    },
});

export default styles;
