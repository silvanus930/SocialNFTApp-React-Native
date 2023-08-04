import {StyleSheet} from 'react-native';

import {baseText} from 'resources';

const styles = StyleSheet.create({
    flatList: style => ({
        borderColor: 'red',
        borderWidth: 0,
        width: '80%',
        margin: 0,
        padding: 0,
        flex: 0,
        ...style,
    }),
    headerContainer: {
        borderColor: 'blue',
        borderWidth: 0,
        flexDirection: 'row',
        marginBottom: 10,
        marginLeft: 10,
        marginTop: 17,
        flex: 0,
    },
    headerText: {
        ...baseText,
        marginLeft: 10,
        marginEnd: 10,
        fontSize: 18,
        marginTop: 5,
        color: '#AAAEB2',
    },
    footerContainer: {
        borderColor: 'blue',
        borderWidth: 0,
        flexDirection: 'row',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        left: -10,
    },
    footerText: {
        fontSize: 14,
        color: '#fff',
        textDecorationLine: 'underline',
    },
});

export default styles;
