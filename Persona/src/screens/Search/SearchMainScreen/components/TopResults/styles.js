import {StyleSheet} from 'react-native';

import {baseText} from 'resources';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
    },
    separator: {
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        borderBottomWidth: 1,
        marginVertical: 12,
    },
    title: {
        ...baseText,
        color: '#FFFFFF',
        fontWeight: 500,
        fontSize: 20,
        lineHeight: 27,
        marginBottom: 12,
    },
});

export default styles;
