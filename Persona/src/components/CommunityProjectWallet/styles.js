import {StyleSheet} from 'react-native';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import baseText from 'resources/text';

const styles = StyleSheet.create({
    // ------------------------------------------------------------------------
    // -- SMALL ---------------------------------------------------------------
    // ------------------------------------------------------------------------

    smallContainer: {
        borderWidth: 1,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
        borderStyle: 'dashed',
        borderColor: '#868B8F',
    },

    smallInnerTopContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    smallInnerBottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },

    smallTotalBalanceText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#BFC3C7',
    },

    smallSpacerText: {
        fontSize: 14,
        fontWeight: '400',
        marginHorizontal: 5,
        color: '#BFC3C7',
    },
    smallViewAllAssetsText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#FFF',
        textDecorationLine: 'underline',
    },

    smallActionButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 6,
        borderColor: '#AAAEB2',
        padding: 7,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
    },

    smallActionButtonWithdraw: {
        marginLeft: 12,
    },

    smallActionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFF',
    },

    // ------------------------------------------------------------------------
    // -- BIG -----------------------------------------------------------------
    // ------------------------------------------------------------------------

    container: {
        padding: 10,
        paddingHorizontal: 20,
    },

    // -----------------------------------------
    sectionContainer: {
        backgroundColor: '#1B1D1F',
        borderRadius: 10,
        padding: 16,
        marginTop: 32,
    },

    sectionPill: {
        borderRadius: 100,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        flexDirection: 'row',
        marginBottom: 12,
    },
    sectionPillIcon: {
        marginRight: 6.5,
    },

    sectionPillText: {
        fontStyle: 'italic',
        color: '#868B8F',
        fontSize: 14,
        fontWeight: '500',
    },

    // ------------------------------------------
    walletAddressText: {
        paddingBottom: 5,
        fontSize: 16,
        color: '#E6E8EB',
    },

    // ------------------------------------------
    contentContainer: {
        marginTop: 12,
        backgroundColor: '#292C2E',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        flexDirection: 'row',
    },
    contentContainerInnerLeft: {
        justifyContent: 'center',
    },
    contentContainerInnerCenter: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    contentContainerInnerRight: {
        alignItems: 'flex-end',
    },
    contentTextPrimary: {
        fontSize: 16,
        fontWeight: '400',
        color: '#E6E8EB',
        marginBottom: 4,
    },
    contentTextSecondary: {
        fontSize: 14,
        fontWeight: '400',
        color: '#868B8F',
    },
    contentIcon: {
        width: 36,
        height: 36,
        borderRadius: 100,
        borderColor: colors.seperatorLineColor,
        borderColor: colors.postAction,
        borderWidth: 0,
    },
    contentButtonContainer: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#AAAEB2',
        borderRadius: 6,
    },
    contentButtonText: {
        fontSize: 14,
        color: '#FFF',
    },
});

export default styles;
