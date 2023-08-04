import {StyleSheet} from 'react-native';
import {fonts} from 'resources';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginTop: 30,
        marginBottom: 20,
    },
    text: {
        fontFamily: fonts.light,
        fontWeight: 500,
        fontSize: 18,
        color: '#D0D3D6',
    },
});

export default styles;
