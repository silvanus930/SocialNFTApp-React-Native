import {StyleSheet, Dimensions} from 'react-native';
import {colors, baseText, fonts} from 'resources';

const styles = StyleSheet.create({
    loadingIndicator: {
        position: 'absolute',
        borderColor: 'blue',
        borderWidth: 0,
        left: 57,
        top: 6,
        zIndex: 99,
        elevation: 99,
        opacity: 0.8,
        marginTop: 30,
        marginBottom: 40,
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: 'purple',
        marginTop: 10,
        marginLeft: 40,
        marginRight: 40,
        borderWidth: 0,
        flexDirection: 'column',
    },
    subContainer: {
        position: 'absolute',
        top: -20,
        left: -40,
        right: -40,
        height: 100,
        borderWidth: 0,
        borderColor: 'turquoise',
    },
    profile: {
        height: 90,
        width: Dimensions.get('window').width,
        borderRadius: 0,
        borderColor: 'yellow',
        borderWidth: 0,
    },
    headerPictureContainer: hasAuth => ({
        opacity: hasAuth ? 1 : 0,
        position: 'absolute',
        top: 10,
        height: 80,
        width: '100%',
        zIndex: 9999999999,
        borderWidth: 0,
        borderColor: 'red',
    }),
    headerImage: personaProfileSize => ({
        height: personaProfileSize,
        width: personaProfileSize,
        borderRadius: personaProfileSize,
        marginBottom: 20,
        borderColor: 'black',
        borderWidth: 4,
    }),
    cameraContainer: {
        position: 'absolute',
        bottom: 0,
        top: 0,
        right: 10,
    },
    indicator: {
        top: 15,
        right: 8,
        zIndex: 9999999999,
        position: 'absolute',
    },
    channelNameText: {
        ...baseText,
        fontFamily: fonts.semibold,
        color: colors.text,
        size: 28,
        lineHeight: null,
    },
    bioText: {
        ...baseText,
        fontFamily: fonts.regular,
        color: colors.textFaded2,
        size: 18,
        lineHeight: null,
    },
});

export default styles;
