import {StyleSheet, Platform} from 'react-native';
import {fonts} from 'resources';

const styles = StyleSheet.create({
    tabBarTopContainer: translateY => ({
        width: '100%',
        zIndex: 999999999999999,
        elevation: 999999999999,
        position: 'absolute',
        top: 140,
        marginTop: Platform.OS === 'ios' ? 5 : 10,
        height: 37,
        transform: [{translateY: translateY}],
    }),
    tabBarLabelStyle: {
        fontSize: 12,
        fontFamily: fonts.semibold,
        textTransform: 'uppercase',
    },
    tabBarStyle: {backgroundColor: 'transparent'},
});

export default styles;
