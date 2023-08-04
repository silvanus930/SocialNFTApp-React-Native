import {StyleSheet} from 'react-native';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import baseText from 'resources/text';

const styles = StyleSheet.create({
    headerBackgroundImage: {
        opacity: 0.2,
    },
    communityToggleContainer: {
        position: 'absolute',
        top: 48,
        zIndex: 99999999,
        elevation: 99999999,
        marginStart: 15,
    },
    innerContainer: {
        marginTop: 75,
        marginHorizontal: 15,
        paddingBottom: 15,
    },

    headerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 20,
        fontWeight: '500',
    },

    subheaderContainer: {
        flexDirection: 'row',
        marginVertical: 5,
        alignItems: 'center',
    },
    subheaderText: {
        color: 'rgba(255,255,255,0.66)',
        fontWeight: '400',
        fontSize: 14,
    },
    subheaderSpacer: {
        marginHorizontal: 5,
    },

    inviteContainer: {
        marginVertical: 10,
    },

    walletContainer: {},

    channelHeaderContainer: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.faded,
    },

    visibilityIcon: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '300',
        marginRight: 5,
        marginBottom: 0,
    },
});

export default styles;
