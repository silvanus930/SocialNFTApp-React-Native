import {StyleSheet} from 'react-native';
import {constants} from 'resources';

const BORDER_DEBUG = false;

export const HEADER_IMAGE_HEIGHT = 202;
export const PROFILE_PIC_SIZE = 105;

export const DEFAULT_HIT_SLOP = {
    left: 10,
    right: 10,
    bottom: 10,
    top: 10,
};

const bd = color => {
    if (BORDER_DEBUG) {
        return {
            borderWidth: 3,
            borderColor: color,
        };
    }
};

const styles = StyleSheet.create({
    container: {
        ...bd('red'),
    },

    headerImageContainer: {
        ...bd('blue'),
        left: 0,
        right: 0,
        height: HEADER_IMAGE_HEIGHT,
    },

    headerImage: {
        height: HEADER_IMAGE_HEIGHT,
    },

    headerImageUpperContainer: {
        ...bd('yellow'),
        position: 'absolute',
        alignItems: 'flex-end',
        zIndex: constants.Z_INDEX_INFINITE,
        top: 10,
        left: 10,
        borderWidth: 2,
        padding: 5,
        borderRadius: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderColor: '#777',
    },

    headerImageActionContainer: {
        ...bd('green'),
        position: 'absolute',
        bottom: 88,
        left: 0,
        right: 5,
        alignItems: 'flex-end',
        zIndex: constants.Z_INDEX_INFINITE,
    },

    innerContainer: {
        ...bd('purple'),
    },

    contentContainer: {
        marginTop: -50,
        paddingLeft: 20,
    },

    buttonContainer: {
        ...bd('orange'),
        justifyContent: 'flex-end',
        flexDirection: 'row',
        position: 'absolute',
        right: 0,
        padding: 20,
        paddingBottom: 0,
        gap: 4,
        flexDirection: 'row',
        zIndex: constants.Z_INDEX_INFINITE,
        alignItems: 'center',
    },

    profilePicContainer: {
        ...bd('turquoise'),
        width: PROFILE_PIC_SIZE,
        zIndex: 2,
    },

    profilePic: {
        width: PROFILE_PIC_SIZE,
        height: PROFILE_PIC_SIZE,
        borderRadius: 100,
        borderColor: '#111314',
        borderWidth: 4,
    },

    usernameText: {
        fontSize: 24,
        fontWeight: 500,
        color: '#D0D3D6',
    },

    //

    editProfilePicContainer: {
        position: 'absolute',
        right: 5,
        bottom: 10,
    },

    editProfilePicCameraIcon: {
        color: 'rgba(255,255,255,0.777)',
    },

    editHeaderPicContainer: {
        ...bd('white'),
        zIndex: constants.Z_INDEX_INFINITE,
    },

    editHeaderPicCameraIcon: {
        color: 'rgba(255,255,255,0.777)',
        zIndex: constants.Z_INDEX_INFINITE,
    },
});

export default styles;
