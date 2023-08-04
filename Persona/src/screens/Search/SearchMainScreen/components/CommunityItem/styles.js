import {StyleSheet} from 'react-native';
import {baseText, colors} from 'resources';

import {USER_ICON_SIZE} from 'screens/Search/styles';

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1B1D1F',
        borderRadius: 8,
        padding: 15,
        marginBottom: 12,
    },
    topContainer: {
        flexDirection: 'row',
        columnGap: 10,
    },
    userIcon: {
        width: USER_ICON_SIZE,
        height: USER_ICON_SIZE,
        borderRadius: 100,
    },
    contentContainer: {
        flex: 1,
    },
    communityName: {
        ...baseText,
        color: '#F0F2F5',
        fontWeight: 500,
        fontSize: 16,
        lineHeight: 22,
    },
    communityDetails: {
        ...baseText,
        color: '#D0D3D6',
        fontSize: 14,
        fontWeight: 400,
    },
    largeDotContainer: {
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 4,
        paddingHorizontal: 5,
        paddingRight: 6,
    },
    largeDot: {
        backgroundColor: '#868B8F',
        height: 5,
        width: 5,
        borderRadius: 100,
    },
    hightLightedText: {
        color: '#fff',
        fontWeight: '500',
        backgroundColor: 'rgba(255,255,255, 0.12)',
    },
    detailText: {
        ...baseText,
        color: '#868B8F',
        fontWeight: 400,
        fontSize: 14,
        letterSpacing: -0.16,
        lineHeight: 19,
    },
    actionContainer: {
        backgroundColor: colors.personaBlue,
        borderRadius: 6,
        paddingVertical: 10,
        marginTop: 15,
        alignItems: 'center',
    },
    actionText: {
        ...baseText,
        color: '#FFFFFF',
        fontWeight: 500,
        fontSize: 16,
    },
});

export default styles;
