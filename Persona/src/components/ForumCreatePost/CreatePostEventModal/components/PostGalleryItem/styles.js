import {StyleSheet} from 'react-native';
import {colors, baseText} from 'resources';

const styles = StyleSheet.create({
    container: {
        zIndex: 100,
        elevation: 100,
        margin: 10,
        flex: 1,
    },
    closeButtonContainer: {
        position: 'absolute',
        borderRadius: 100,
        zIndex: 99999999,
        elevation: 99999999,
        right: -10,
        top: -10,
        backgroundColor: '#868B8F',
    },
    videoItem: {
        marginLeft: 12,
        width: 150,
        height: 200,
        borderRadius: 5,
    },
    imageItem: {
        width: 150,
        height: 200,
        padding: 10,
        zIndex: 0,
        elevation: 0,
        borderRadius: 5,
        backgroundColor: colors.defaultImageBackground,
    },
    fileContainerStyle: {
        width: 150,
        height: 200,
        borderWidth: 0.5,
        borderColor: 'white',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileNameText: {...baseText, fontSize: 20, margin: 10},
});
export default styles;
