import {StyleSheet} from 'react-native';
import {fonts, baseText, constants, colors} from 'resources';
import {HEADER_HEIGHT} from 'components/BlurHeader/styles';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: 'black',
        paddingHorizontal: 20,
    },

    //
    headerContainer: {
        marginTop: 20 + HEADER_HEIGHT,
    },

    walletCardContainer: {
        borderWidth: 1,
        borderColor: '#424547',
        borderRadius: 10,
        backgroundColor: '#1B1D1F',
    },

    walletCardUpper: {
        height: 117,
        borderBottomWidth: 1,
        borderColor: '#424547',
    },
    walletCardLower: {
        paddingHorizontal: 20,
        paddingVertical: 12.5,
    },

    //
    transactionBarContainer: {
        marginTop: 12,
    },

    //
    walletCardButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 7,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#AAAEB2',
        backgroundColor: '#292C2E',
    },
    walletCardButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    //

    walletCardHeaderText: {
        fontSize: 16,
        fontWeight: 500,
        color: '#AAAEB2',
    },
    walletCardBalanceText: {
        fontSize: 28,
        fontWeight: 500,
        color: '#F0F2F5',
        marginTop: 8,
    },

    walletCardViewAssetDetailsText: {
        fontSize: 14,
        fontWeight: 500,
        color: '#E6E8EB',
    },

    //
    listTopContainer: {
        backgroundColor: '#1B1D1F',
        padding: 16,
        marginTop: 32,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    listTopText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#D0D3D6',
    },

    listBottomContainer: {
        backgroundColor: '#1B1D1F',
        padding: 10,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        height: 1,
        marginBottom: 20,
    },

    listEmptyContainer: {
        backgroundColor: '#1B1D1F',
        paddingHorizontal: 16,
    },

    listEmptyText: {
        color: 'gray',
    },

    //
    activityItemContainer: {
        backgroundColor: '#1B1D1F',
    },
    activityItemInnerContainer: {
        marginHorizontal: 16,
        paddingVertical: 16,

        borderBottomColor: '#424547',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
});

export default styles;
