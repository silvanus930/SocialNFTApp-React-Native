import {StyleSheet, Dimensions} from 'react-native';
import {colors} from 'resources';

const styles = StyleSheet.create({
    container: heightOffset => ({
        borderColor: 'green',
        borderWidth: 0,
        paddingTop: heightOffset + 30,
        paddingLeft: 4,
        paddingRight: 6,
        borderRightColor: colors.timeline,
        borderRightWidth: 0,
        height: Dimensions.get('window').height,
        width: 60, // WC just add this because FlashList's render error
    }),
    bioContainer: selected => ({
        borderWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 5,
        paddingBottom: 5,
        opacity: selected ? 1 : 0.4,
        borderColor: selected ? 'red' : 'purple',
    }),
});

export default styles;
