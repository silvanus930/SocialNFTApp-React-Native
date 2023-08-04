import {StyleSheet} from 'react-native';
import {baseText} from 'resources';

const styles = StyleSheet.create({
    emptyContentContainer: {
        flex: 1,
        borderColor: 'pink',
        alignItems: 'center',
        marginTop: 120,
    },
    emptyImage: {width: 108.93, height: 107, marginBottom: 25},

    emptyHeaderText: {
        ...baseText,
        color: '#D0D3D6',
        fontWeight: 500,
        fontSize: 20,
        textAlign: 'center',
        lineHeight: 27,
    },
    emptyText: {
        ...baseText,
        fontWeight: 400,
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
        letterSpacing: -0.16,
        color: '#868B8F',
    },
});

export default styles;
