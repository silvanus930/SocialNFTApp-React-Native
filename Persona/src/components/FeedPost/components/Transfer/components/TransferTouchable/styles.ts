import {StyleSheet} from 'react-native';
import colors from 'resources/colors';

const styles = StyleSheet.create({
    textTransfer: {
        textAlign: 'center',
        color: '#BFC3C7',
        fontWeight: '400',
        fontSize: 11,
    },
    transferTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    iconTransferPersona: {
        marginHorizontal: 4,
        width: 20,
        height: 20,
        borderRadius: 100,
        borderColor: colors.seperatorLineColor,
    },
});

export default styles;
