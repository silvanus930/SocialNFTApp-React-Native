import {StyleSheet} from 'react-native';
import {colors, baseText} from 'resources';

const styles = StyleSheet.create({
    roomsepContainer: style => ({
        width: '92%',
        backgroundColor: colors.searchBackground,
        paddingTop: 8,
        paddingBottom: 0,
        borderWidth: 0,
        borderRadius: 22,
        marginStart: 20,
        borderColor: 'red',
        marginBottom: 8,
        ...style,
    }),
    roomsepSubContainer: {
        flexDirection: 'row',
        marginLeft: 5,
        marginTop: -4,
    },
    profileImage: {
        marginLeft: 17,
        width: 30,
        height: 30,
        borderRadius: 30,
        borderColor: colors.darkSeperator,
        borderWidth: 0,
        marginRight: 0,
        marginTop: 2,
        paddingTop: 2,
    },
    titleContainer: {
        flexDirection: 'column',
        borderColor: 'blue',
        borderWidth: 0,
        marginTop: 0,
    },
    titleText: {
        ...baseText,
        lineHeight: null,
        flex: 1,
        color: colors.textFaded2,
        fontSize: 14,
        marginLeft: 10,
        marginTop: -1,
        marginRight: 5,
        borderColor: 'white',
        borderWidth: 0,
        maxWidth: '90%',
    },
    userListContainer: {
        width: 200,
        height: 24,
        marginLeft: 2,
        marginTop: -2,
    },
    contentContainerStyle: {
        padding: 20,
        paddingBottom: 10,
        paddingLeft: 1,
        paddingTop: 1,
    },
});

export default styles;
