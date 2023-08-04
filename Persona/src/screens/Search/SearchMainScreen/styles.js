import {StyleSheet, Platform} from 'react-native';
import {constants, baseText, fonts} from 'resources';

export const HEADER_HEIGHT = 115;

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        marginTop: HEADER_HEIGHT,
    },
    pageContainer: {
        padding: 12,
        flex: 1,
    },

    headerBlurContainer: {
        zIndex: constants.Z_INDEX_INFINITE,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flex: 1,
    },
    headerContainer: {
        height: HEADER_HEIGHT,
        paddingTop: 52,
        paddingHorizontal: 20,
    },
    tabNavigator: {
        top: 9,
        fontSize: 12,
        fontFamily: fonts.semibold,
        textTransform: 'uppercase',
        height: 20,
    },
    emptyContentContainer: {
        flex: 1,
        alignItems: 'center',
        marginTop: 120,
    },
    emptyImage: {width: 108.93, height: 107, marginBottom: 25},

    emptyHeaderText: {
        ...baseText,
        color: '#D0D3D6',
        fontWeight: 500,
        fontSize: 20,
        textAlign: 'center',
        lineHeight: 27,
    },
    emptyText: {
        ...baseText,
        fontWeight: 400,
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
        letterSpacing: -0.16,
        color: '#868B8F',
    },

    // Search box
    searchContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        height: 40,
        paddingVertical: Platform.OS === 'ios' ? 9 : 0,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    searchTextInput: {
        color: 'white',
        fontWeight: '500',
        fontSize: 16,
        paddingRight: 25,
    },

    searchIconContainer: {
        position: 'absolute',
        right: 10,
        top: 10,
    },
    searchIcon: {
        width: 20,
        height: 20,
    },

    noResultContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 30,
    },
    noResultText: {
        color: 'gray',
    },
});

export default styles;
