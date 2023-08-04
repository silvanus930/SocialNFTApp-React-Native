import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 0, 0)',
    },
    subContainer: {
        flexDirection: 'row',
        paddingLeft: 20,
        paddingRight: 20,
    },
    text: {fontSize: 16, fontWeight: 500},
});

export default styles;
