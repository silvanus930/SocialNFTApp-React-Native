import {StyleSheet} from 'react-native';
import {baseText, colors} from 'resources';

import {USER_ICON_SIZE} from 'screens/Search/styles';

const styles = StyleSheet.create({
    pageContainer: {
        padding: 12,
    },
    container: {
        backgroundColor: '#292C2E',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    topContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    userIcon: {
        width: USER_ICON_SIZE,
        height: USER_ICON_SIZE,
        borderRadius: 100,
    },
    noResultContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 30,
    },
    noResultText: {
        color: 'gray',
    },
    channelName: {
        ...baseText,
        color: '#F0F2F5',
        fontWeight: 500,
        fontSize: 16,
        lineHeight: 22,
    },
    channelContainer: {
        flex: 1,
    },
    channelDetail: {
        ...baseText,
        color: '#D0D3D6',
        fontSize: 14,
        flex: 1,
        fontWeight: 400,
    },
    receiverContainer: {
        backgroundColor: '#1B1D1F',
        borderWidth: 0.5,
        marginTop: 6,
        padding: 10,
        borderColor: '#2E3133',
        borderRadius: 6,
    },
    receiverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        paddingBottom: 12,
        marginBottom: 12,
        borderColor: '#2E3133',
        gap: 10,
    },
    receiveImg: {
        width: 24,
        height: 24,
        borderRadius: 100,
    },
    receiverContentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    receverUserName: {
        ...baseText,
        color: '#D0D3D6',
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 19,
    },
    largeDotContainer: {
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 3,
        paddingHorizontal: 5,
    },
    largeDot: {
        backgroundColor: '#868B8F',
        height: 5,
        width: 5,
        borderRadius: 200,
    },
    date: {
        ...baseText,
        color: '#868B8F',
        fontSize: 14,
        fontWeight: 400,
        letterSpacing: -0.16,
    },
    receiverDetailText: {
        ...baseText,
        color: '#868B8F',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 19,
        letterSpacing: -0.16,
    },
    receiverDetailTitle: {
        marginBottom: 8,
    },
    highlightedText: {
        color: '#fff',
        fontWeight: '500',
        backgroundColor: 'rgba(255,255,255, 0.12)',
    },
    externalLink: {
        color: colors.personaBlue,
        textDecorationLine: 'underline',
    },
    mentions: {
        color: colors.personaBlue,
    },
});

export default styles;
