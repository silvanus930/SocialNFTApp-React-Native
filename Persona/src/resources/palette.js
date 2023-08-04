import colors from './colors';
import {heightOffset} from 'components/NotchSpacer';
import baseText from 'resources/text';
import {Platform} from 'react-native';

const palette = {
    statusBar: {
        height: 20,
        backgroundColor:
            Platform.OS === 'android' ? 'black' : colors.topBackground,
    },
    container: {
        center: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.homeBackground,
        },
    },
    icon: {
        color: colors.generalIcon,
        size: 17,
    },
    footer: {
        image: {
            height: 21,
            width: 21,
            resizeMode: 'contain',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.bottomBackground,
        },
    },
    studio: {
        icon: {
            action: {
                color: '#0088f8',
            },
        },
    },
    header: {
        prfilePicture: {
            height: 25,
            width: 25,
            borderRadius: 100,
            backgroundColor: colors.background,
            marginRight: 5,
        },
        profileImgContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        image: {
            height: 25,
            width: 25,
            resizeMode: 'contain',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        icon: {
            color: colors.generalIcon,
            size: 23,
        },
        title: {
            ...baseText,
            alignSelf: 'center',
            color: colors.text,
            fontSize: 16,
        },
        leftContainer: {
            paddingLeft: 10,
            paddingRight: 10,
            alignSelf: 'center',
        },
        headerLeftImage: {
            width: 25,
            height: 25,
            resizeMode: 'contain',
        },
        rightContainer: {
            paddingLeft: 10,
            paddingRight: 10,
            alignSelf: 'center',
        },
        headerRightImage: {
            width: 25,
            height: 25,
            resizeMode: 'contain',
        },
        style: {
            backgroundColor: colors.background,
            shadowColor: colors.topBackground,
            height:
                Platform.OS === 'android'
                    ? 40 + heightOffset
                    : 44 + heightOffset,
            paddingTop: 20,
        },
        text: {
            ...baseText,
            color: colors.postAction,
            fontWeight: 'bold',
            fontSize: 18,
        },
    },
    headerLeftContainer: {
        marginLeft: 5,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        ...baseText,
        color: colors.text,
    },
    post: {
        borderLeftColor: colors.homeBackground,
        borderRightColor: colors.homeBackground,
        borderBottomColor: colors.seperatorLineColor,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        marginLeft: 0,
        marginRight: 0,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderRightWidth: 1,
    },
    timeline: {
        line: {
            marginLeft: 35,
            width: 0.4,
            backgroundColor: colors.timeline,
        },
        numbers: {
            fontSize: 12,
            marginLeft: 19,
            textAlign: 'right',
            width: 25,
            backgroundColor: colors.homeBackground,
            position: 'absolute',
            color: colors.textFaded2,
        },
    },
};

export default palette;
