import {StyleSheet} from 'react-native';
import {fonts} from 'resources';

const styles = StyleSheet.create({
    container: height => ({
        fontFamily: fonts.light,
        fontSize: 16,
        fontWeight: '500',
        color: 'white',
        bordeRadius: 8,
        borderColor: '#2E3133',
        borderWidth: 0.5,
        backgroundColor: '#111314',
        padding: 10,
        marginBottom: 10,
        minWidth: 311,
        height: height,
        textAlignVertical: 'top',
    }),
});

export default styles;
