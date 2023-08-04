import {StyleSheet} from 'react-native';
import {colors} from 'resources';

const styles = StyleSheet.create({
    container: {},
    icon: {
        top: 1,
    },
    unreadIndicator: {
        position: 'absolute',
        top: 0,
        left: 19,
        bottom: 25,
        borderRadius: 100,
        backgroundColor: colors.actionBlue,
        height: 9,
        width: 9,
    },
});

export default styles;
