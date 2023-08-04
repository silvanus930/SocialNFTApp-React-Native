import {StyleSheet, Platform} from 'react-native';
import {baseText, colors} from 'resources';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderColor: 'red',
        borderWidth: 0,
    },
    roomItemStyle: {
        borderColor: 'red',
        borderWidth: 0,
        flex: 1,
    },
    memberItemStyle: {
        borderColor: 'green',
        borderWidth: 0,
        flex: 1,
    },
    headerContainer: {
        borderColor: 'blue',
        borderWidth: 0,
        width: '80%',
        flexDirection: 'row',
        marginBottom: 5,
    },
    headerSubContainer: {
        flexDirection: 'row',
        marginLeft: 5,
        marginTop: 17,
        marginBottom: 5,
        borderColor: 'purple',
        borderWidth: 0,
        flex: 0,
    },
    titleSubContainer: {
        width: '80%',
        flexDirection: 'row',
        marginLeft: 5,
        marginTop: 10,
        marginBottom: 5,
        borderColor: 'purple',
        borderWidth: 0,
        flex: 0,
    },
    titleText: {
        ...baseText,
        marginLeft: 10,
        marginEnd: 10,
        fontSize: 18,
        marginTop: 5,
        color: '#AAAEB2',
    },
    headerText: {
        ...baseText,
        marginLeft: 10,
        marginEnd: 10,
        fontSize: 18,
        marginTop: 5,
        color: colors.maxFaded,
    },
    bottomContainer: {
        marginTop: Platform.OS === 'android' ? 34 : 32.5,
        borderWidth: 0.4,
        borderColor: colors.maxFaded,
        flex: 1,
        height: 0,
    },
});

export default styles;
