import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    animContainer: opacity => ({
        width: '100%',
        opacity,
    }),
    container: {
        justifyContent: 'flex-start',
        width: '100%',
        paddingTop: 0,
    },
});

export default styles;
