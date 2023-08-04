import {StyleSheet, Dimensions} from 'react-native';
import {colors} from 'resources';

const styles = StyleSheet.create({
    container: ({gap, containerHeight}) => ({
        backgroundColor: colors.gridBackground,
        flexDirection: 'column',
        marginTop: gap ? 0 : 6,
        alignItems: 'center',
        height: containerHeight,
        borderColor: 'white',
        borderWidth: 0,
    }),
    detailContainer: {
        zIndex: 99999999999,
        elevation: 99999999999,
        borderColor: 'red',
        borderWidth: 0,
        width: Dimensions.get('window').width,
        paddingTop: 0,
    },
    animatedMaskViewStyle: {
        zIndex: 99999999999,
        elevation: 99999999999,
        marginTop: 40,
        marginStart: 30,
        width: '100%',
    },
});

export default styles;
