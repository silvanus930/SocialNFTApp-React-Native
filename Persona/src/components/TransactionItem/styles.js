import {StyleSheet} from 'react-native';
import {fonts, baseText, constants, colors} from 'resources';

const styles = StyleSheet.create({
    innerContainer: {flexDirection: 'row', padding: 6},
    contentContainerCenter: {
        flex: 1,
        flexDirection: 'column',
        marginLeft: 10,
        marginRight: 10,
    },
    contentContainerRight: {alignItems: 'flex-end'},

    textHeader: {
        color: '#E6E8EB',
        fontSize: 16,
        fontWeight: '400',
        paddingBottom: 5,
    },
    textSubheader: {
        color: '#868B8F',
        fontSize: 14,
        fontWeight: '400',
    },
    iconTransferType: {
        marginEnd: 4,
        width: 40,
        height: 40,
    },
    iconCheckbox: {
        width: 12,
        height: 12,

        position: 'absolute',
        top: -2,
        right: 2,
    },
});

export default styles;
