import {StyleSheet} from 'react-native';

import {baseText} from 'resources';

const styles = StyleSheet.create({
    recentSearchContainer: {
        padding: 22,
        paddingTop: 18,
        flex: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        borderTopWidth: 1,
    },
    recentText: {
        ...baseText,
        color: '#fff',
        fontWeight: 500,
        fontSize: 20,
        lineHeight: 27,
        marginBottom: 10,
    },
    recentItemContainer: {
        flexDirection: 'row',
        paddingVertical: 12,
        gap: 10,
    },
    recentItemText: {
        ...baseText,
        fontWeight: 400,
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: -0.16,
        color: '#D0D3D6',
        flex: 1,
    },
    divider: {
        borderWidth: 0.5,
        borderColor: '#2E3133',
    },
});

export default styles;
