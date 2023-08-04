import {
    Animated as RNAnimated,
    Platform,
    StyleSheet,
    Dimensions,
} from 'react-native';
import {colors} from 'resources';

const styles = StyleSheet.create({
    iosMaskViewStyle: {
        zIndex: 9999999,
        elevation: 9999998,
        width: '100%',
        position: 'absolute',
    },
    image: height => ({
        width: '100%',
        height: height,
        borderColor: colors.seperatorLineColor,
    }),
    androidImage: height => ({
        width: '100%',
        height: height,
        borderColor: colors.seperatorLineColor,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        opacity: 0.25,
    }),
    iosBlueViewStyle: (height, blurAmount) => ({
        height: height,
        opacity: blurAmount,
        flexDirection: 'column',
        zIndex: 999999,
        elevation: 999999,
        position: 'absolute',
        top: 0,
        width: '100%',
    }),
    androidContainer: {
        width: '100%',
        zIndex: 9999999,
        elevation: 9999998,
        position: 'absolute',
    },
    detailContainer: {
        zIndex: 99999999999,
        elevation: 99999999999,
        borderColor: 'red',
        borderWidth: 0,
        width: Dimensions.get('window').width,
        paddingTop: 0,
    },
});

export default styles;
