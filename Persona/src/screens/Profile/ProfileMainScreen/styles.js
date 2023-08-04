import {StyleSheet} from 'react-native';
import {colors} from 'resources';

const styles = StyleSheet.create({
    container: {},
    contentContainer: {
        padding: 20,
        paddingTop: 14,
    },
    menuSection: {
        backgroundColor: '#1B1D1F',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
    },
    footerContainer: {
        marginTop: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 14,
        fontWeight: 400,
        color: '#5F6266',
    },
    walletBalanceText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 500,
    },
});

export default styles;
