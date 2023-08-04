import {StyleSheet} from 'react-native';
import {baseText} from 'resources';

const styles = StyleSheet.create({
    container: {flexDirection: 'row'},
    textContainer: {flex: 1},
    titleText: {
        ...baseText,
        color: '#AAAEB2',
        fontSize: 15,
    },
    linkText: {
        ...baseText,
        textDecorationLine: 'underline',
        marginHorizontal: 10,
    },
    buttonContainer: {alignItems: 'flex-end'},
    button: {
        backgroundColor: '#2E3133',
        borderRadius: 8,
        borderColor: '#D0D3D6',
        borderWidth: 0.5,
        padding: 8,
        width: 70,
        alignItems: 'center',
    },
});

export default styles;
