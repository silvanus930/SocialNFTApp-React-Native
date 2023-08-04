import {StyleSheet} from 'react-native';
import {baseText, colors} from 'resources';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#000000aa',
    },
    subContainer: {
        alignItems: 'center',
        backgroundColor: '#292C2ECC',
        width: '90%',
        borderRadius: 10,
        marginBottom: 100,
        padding: 30,
    },
    itemContainer: {
        zIndex: 100,
        elevation: 100,
        alignItems: 'center',
        padding: 5,
        flex: 1,
    },
    fileContainerStyle: {
        width: 120,
        height: 150,
        borderWidth: 0.5,
        borderColor: 'white',
        borderRadius: 16,
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
    },
    fileNameText: {...baseText, fontSize: 20, margin: 10},
    iconContainer: {
        flexDirection: 'row',
        marginTop: 10,
        borderBottomWidth: 0.5,
        paddingBottom: 10,
        borderColor: colors.neutralBackground,
    },
    buttonContainer: {
        flex: 0,
        borderWidth: 0,
        backgroundColor: '#375E8A',
        width: 300,
    },
    priceText: {
        color: 'white',
        margin: 5,
    },
    desText: {
        flexDirection: 'row',
        marginTop: 10,
        borderBottomWidth: 0.5,
        paddingBottom: 10,
        borderColor: colors.neutralBackground,
    },
    closeButton: {
        position: 'absolute',
        borderRadius: 100,
        zIndex: 9,
        right: -10,
        top: -10,
        padding: 3,
        backgroundColor: '#090C20',
    },
});

export default styles;
