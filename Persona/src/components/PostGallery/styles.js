import {StyleSheet} from 'react-native';
import {colors, baseText} from 'resources';

const styles = StyleSheet.create({
    container: height => ({
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    itemContainer: height => ({
        height: height,
        borderColor: 'red',
        borderWidth: 0,
        justifyContent: 'center',
    }),
    videoItemStyle: (width, height) => ({
        alignSelf: 'center',
        width: width,
        height: height,
        borderWidth: 0,
        borderColor: 'red',
    }),
    imageItemStyle: (width, height) => ({
        alignSelf: 'center',
        alignItems: 'center',
        borderColor: 'red',
        borderWidth: 0,
        borderRadius: 12,
        justifyContent: 'center',
        width: width,
        height: height,
    }),
    paginationContainer: {
        borderWidth: 0,
        borderColor: 'white',
        position: 'absolute',
        bottom: 0,
    },
});

export default styles;
