import {StyleSheet, Platform, Dimensions} from 'react-native';
import {colors, baseText, fonts} from 'resources';

export const SIZE = 48;

const styles = StyleSheet.create({
    touchContainer: {
        borderColor: 'magenta',
        borderWidth: 0,
        width: '100%',
        padding: 16,
        paddingLeft: 10,
        paddingBottom: 8,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
        marginRight: 10,
        padding: 6,
        paddingLeft: 3,
        paddingRight: 3,
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: colors.navSubProminent,
    },
    image: scale => ({
        borderColor: colors.text,
        borderWidth: Platform.OS === 'ios' ? 0.75 : 1,
        width: SIZE,
        height: SIZE,
        marginStart: 2,
        borderRadius: SIZE,
        top: 15.8,
        marginEnd: -5.5,
        transform: [
            {translateX: SIZE * 0.5},
            {translateY: SIZE * -0.5},
            {scale},
            {translateX: SIZE * -0.5},
            {translateY: SIZE * 0.5},
        ],
    }),
    titleContainer: {
        borderColor: 'magenta',
        borderWidth: 0,
        width: '100%',
        flexDirection: 'column',
        padding: 16,
        paddingLeft: 14.3,
        paddingBottom: 8,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    nameContainer: {
        marginStart: 4,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: Dimensions.get('window').width - 150,
    },
    nameText: {
        ...baseText,
        lineHeight: null,
        fontFamily: fonts.semibold,
        fontSize: 23,
        color: colors.textBright,
        paddingBottom: 4,
    },
    bioContainer: opacity => ({
        marginStart: 4,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        opacity,
    }),
    bioText: {
        marginTop: -2,
        ...baseText,
        top: 0,
        lineHeight: null,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.navSubProminent,
    },
});

export default styles;
