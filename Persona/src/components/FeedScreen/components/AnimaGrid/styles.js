import {StyleSheet} from 'react-native';
import {colors} from 'resources';

const styles = StyleSheet.create({
    container: {
        borderColor: 'orange',
        backgroundColor: colors.gridBackground,
        borderWidth: 0,
        width: '100%',
        height: '100%',
    },
    innerContainer: {
        borderWidth: 0,
        borderColor: 'green',
        flex: 1,
    },
});

export default styles;
