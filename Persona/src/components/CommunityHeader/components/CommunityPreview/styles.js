import {StyleSheet, Platform} from 'react-native';
import {colors} from 'resources';

const SIZE = 30;

const styles = StyleSheet.create({
    renderItemContainer: {
        marginTop: 0,
        marginRight: -5,
        shadowColor: Platform.OS === 'ios' ? colors.gridBackground : null,
        shadowRadius: 1,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 1,
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE,
    },
    renderItemImage: {
        borderColor: colors.timestamp,
        borderWidth: Platform.OS === 'ios' ? 0.4 : 1,
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE,
    },
    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        borderColor: 'purple',
        borderWidth: 0,
    },
    footerSubContainer: {
        marginTop: 0,
        marginLeft: 0,
        shadowColor: Platform.OS === 'ios' ? colors.gridBackground : null,
        shadowRadius: 1,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 1,
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE,
        borderWidth: 0,
        opacity: 1,
        borderColor: colors.maxFaded,
    },
    footerText: {
        marginTop: 5,
        fontSize: 16,
        color: colors.navSubProminent,
    },
    button: {
        top: -5,
        marginTop: 8,
        marginBottom: 8,
        marginRight: 15,
        flex: 0,
        width: 84,
    },
    contentContainerStyle: {
        paddingLeft: 20,
        paddingBottom: 8,
        paddingTop: 5,
    },
});

export default styles;
