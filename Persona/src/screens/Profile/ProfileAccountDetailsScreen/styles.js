import {StyleSheet} from 'react-native';
import {HEADER_HEIGHT} from 'components/BlurHeader/styles';

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: 'black'},
    contentContainer: {
        padding: 20,
        paddingTop: HEADER_HEIGHT + 20,
    },
    menuSection: {
        backgroundColor: '#1B1D1F',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
    },
});

export default styles;
