import {StyleSheet} from 'react-native';
import {Dimensions} from 'react-native';

export const deviceWidth = Dimensions.get('window').width;
export const width = deviceWidth / 2 - 37;

const styles = StyleSheet.create({
    centerContainer: index => {
        return {
            flexDirection: 'row',
            alignSelf: 'center',
            justifyContent: 'space-between',

            flexDirection: 'column',
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            alignSelf: 'center',
            alignItems: 'center',
            marginHorizontal: 10,
            width: width,
            marginLeft: index % 2 == 1 ? 0 : 5,
            marginRight: index % 2 == 1 ? 5 : 0,
            flex: 1,
            borderColor: 'blue',
            borderWidth: 0,
            borderBottomLeftRadius: 6,
            borderBottomRightRadius: 6,
        };
    },

    profileModeStyles: {
        height: 96,
        width: width,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        marginStart: 0,
        marginBottom: 0,
    },

    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#2E3133',
        borderColor: 'yellow',
        borderWidth: 0,
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
        padding: 8,
    },
    contentInnerContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        width: width,
    },

    // Text
    personaName: {
        fontSize: 12,
        fontWeight: '400',
        color: '#D0D3D6',
    },
    personaBalance: {
        fontSize: 14,
        fontWeight: '500',
        color: '#D0D3D6',
        paddingTop: 4,
    },
});

export default styles;
