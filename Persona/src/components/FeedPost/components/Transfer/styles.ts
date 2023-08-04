import {Dimensions, StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    container: {
        borderWidth: 0,
        borderColor: 'red',
        backgroundColor: '#1B1D1F',
        borderRadius: 12,
        marginVertical: 6,
        padding: 6,
        marginHorizontal: 20,
    },

    bottomContainer: {padding: 6},
    buttomInnerContainer: {
        backgroundColor: '#292C2E',
        padding: 6.5,
        borderRadius: 8,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomContentContainerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: Dimensions.get('window').width * 0.3,
    },
    bottomContentContainerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: Dimensions.get('window').width * 0.3,
    },

    iconTransferArrowContainer: {
        marginHorizontal: 8,
    },
    iconTransferArrow: {
        marginHorizontal: 4,
        width: 20,
        height: 6,
    },
});

export default styles;
