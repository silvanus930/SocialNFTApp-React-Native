import {StyleSheet} from 'react-native';
import {colors, baseText} from 'resources';

const styles = StyleSheet.create({
    container: {
        margin: 20,
        flex: 1,
        borderRadius: 12,
        bordercolor: 'red',
    },
    publicURL: {
        borderColor: '#81602F',
        borderWidth: 0.5,
        flexDirection: 'row',
        borderRadius: 6,
        padding: 10,
    },
    publicURLText: {
        ...baseText,
        fontSize: 14,
        marginLeft: 5,
    },
    postButton: {
        height: 50,
        marginTop: 10,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        borderWidth: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        alignSelf: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        padding: 12,
        paddingBottom: 10,
        backgroundColor: '#1B1D1F',
    },
});

export default styles;
