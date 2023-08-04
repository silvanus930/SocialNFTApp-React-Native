import {StyleSheet} from 'react-native';
import {colors} from 'resources';

const styles = StyleSheet.create({
    container: style => ({
        flexDirection: 'row',
        padding: 4,
        justifyContent: 'center',
        alignSelf: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        ...style,
    }),
    iconContainer: {
        justifyContent: 'center',
        alignSelf: 'center',
        padding: 2,
        height: 24,
        width: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.paleBackground,
        backgroundColor: colors.paleBackground,
    },
    icon: {
        flex: 1,
        justifyContent: 'center',
        alignSelf: 'center',
        alignItems: 'center',
    },
});

export default styles;
