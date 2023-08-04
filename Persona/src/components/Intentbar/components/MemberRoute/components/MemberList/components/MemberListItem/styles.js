import {StyleSheet} from 'react-native';
import {colors, baseText, fonts} from 'resources';

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        left: 5,
        borderColor: 'purple',
        borderWidth: 0,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 5,
        marginBottom: 5,
        marginStart: 13,
    },
    container: {
        marginTop: 5,
        borderWidth: 0,
        borderColor: 'red',
        marginLeft: 0,
    },
    order99: {
        zIndex: 99,
    },
    profileModeStyles: {
        width: 33.5,
        height: 33.5,
        borderRadius: 33.5,
    },
    headerStyle: {
        ...baseText,
        lineHeight: null,
        color: '#D0D3D6',
        padding: 0,
        paddingVertical: 12,
        fontSize: 18,
        fontWeight: 500,
    },
    leftIcon: {
        left: 5,
        top: 15,
    },
    touchContainer: {
        flexDirection: 'row',
        borderWidth: 0,
        borderColor: 'red',
        borderRadius: 40,
        marginRight: 30,
        alignItems: 'center',
    },
    connectionStatusContainer: {
        width: 15,
        height: 15,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 20,
        left: 18.5,
        zIndex: 99,
    },
    connectionStatusBackground: {
        position: 'absolute',
        borderRadius: 14,
        width: 16,
        height: 16,
        marginTop: 1,
        top: 1,
        left: 4,
        zIndex: 99,
        borderWidth: 2,
        borderColor: colors.gridBackground,
    },
    timeStamps: length => ({
        ...baseText,
        position: 'absolute',
        left: length === 2 ? 7 : 5,
        fontSize: 7,
        top: -1,
        color: colors.textFaded,
        fontFamily: fonts.bold,
        elevation: 9000,
        zIndex: 100,
    }),
    userNameContainer: {
        display: 'flex',
        borderColor: 'yellow',
        borderWidth: 0,
        flexDirection: 'row',
        flex: 1,
        left: 2,
        paddingLeft: 5,
    },
    userRoleContainer: {
        padding: 0,
        alignItems: 'center',
        justifyContent: 'center',
        height: 22,
        width: 64,
        backgroundColor: '#523E21',
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: '#81602F',
        marginLeft: 10,
    },
    userRoleText: {
        color: 'white',
        fontSize: 12,
    },
    removeUserContainer: {
        borderColor: 'blue',
        borderWidth: 0,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        top: -15,
        marginEnd: 0,
    },
    leftIconContainer: {
        borderColor: 'blue',
        borderWidth: 0,
        flex: 0.33,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        top: -10,
        marginEnd: 20,
    },
    leftIconTouch: {
        marginLeft: -20,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
});

export default styles;