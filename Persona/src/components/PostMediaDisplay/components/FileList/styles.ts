import {StyleSheet} from 'react-native';
import {colors} from 'resources';
import baseText from 'resources/text';

const styles = StyleSheet.create({
    item: {
        borderColor: 'blue',
        borderWidth: 0,
        marginLeft: 5,
        marginTop: -5,
        width: 50,
        zIndex: 100,
        elevation: 100,
        marginStart: 15,
        marginEnd: 15,
    },
    itemIcon: {
        zIndex: 0,
        elevation: 0,
        borderRadius: 5,
        backgroundColor: colors.defaultImageBackground,
        marginTop: 10,
    },
    itemTitleWrapper: {
        alignSelf: 'center',
        borderWidth: 0,
    },
    itemTitle: {
        ...baseText,
        color: colors.weakEmphasisOrange,
        fontSize: 14,
    },
    list: {
        borderColor: 'purple',
        borderWidth: 0,
        flexDirection: 'row-reverse',
    },
    listContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
    },
});

export default styles;
