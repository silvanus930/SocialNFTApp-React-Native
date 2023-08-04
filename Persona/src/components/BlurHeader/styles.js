import {StyleSheet} from 'react-native';
import {fonts, baseText, constants, colors} from 'resources';

export const HEADER_LEFT_CONTAINER_WIDTH = 32;
export const HEADER_RIGHT_CONTAINER_WIDTH = 32;
export const HEADER_HEIGHT = 108;
export const HEADER_BUTTONS_HIT_SLOP = {
    bottom: 30,
    left: 30,
    right: 30,
    top: 30,
};

const styles = StyleSheet.create({
    blurContainer: {
        zIndex: constants.Z_INDEX_INFINITE,
        elevation: constants.Z_INDEX_INFINITE,
        backgroundColor:
            Platform.OS === 'ios'
                ? 'rgba(255, 255, 255, 0.12'
                : 'rgba(20, 20, 20, 0.95)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flex: 1,
    },
    container: {
        height: HEADER_HEIGHT,
        paddingTop: 62,
        paddingBottom: 12,
        paddingHorizontal: 20,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        borderBottomWidth: 1,
        flex: 1,
    },
    innerContainer: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    innerLeftContainer: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        width: HEADER_LEFT_CONTAINER_WIDTH,
    },
    innerCenterContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerRightContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        width: HEADER_RIGHT_CONTAINER_WIDTH,
    },

    iconBackArrow: {
        width: 18,
        height: 16,
    },
    iconOptions: {
        width: 4,
        height: 16,
    },

    //
    titleText: {
        color: '#D0D3D6',
        fontSize: 18,
        fontWeight: '500',
    },
});

export default styles;
