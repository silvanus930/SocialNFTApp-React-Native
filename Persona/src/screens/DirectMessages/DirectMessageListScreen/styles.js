import {Platform, StyleSheet} from 'react-native';
import {constants} from 'resources';

export const HEADER_HEIGHT = 157;

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
    },

    noResultContainer: {
        flex: 1,
        marginTop: HEADER_HEIGHT,
        padding: 20,
        alignItems: 'center',
    },
    noResultText: {
        color: 'gray',
    },

    headerBlurContainer: {
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
    headerContainer: {
        height: HEADER_HEIGHT,
        paddingTop: 52,
        paddingBottom: 12,
        paddingHorizontal: 20,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        borderBottomWidth: 1,
    },
    headerText: {
        color: '#FFF',
        fontWeight: '500',
        fontSize: 24,
    },
    headerSearchContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        height: 40,
        paddingVertical: Platform.OS === 'ios' ? 9 : 0,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    headerSearchTextInput: {
        color: 'white',
        fontWeight: '500',
        fontSize: 16,
    },
    headerSearchIconContainer: {
        position: 'absolute',
        right: 10,
        top: 10,
    },
    headerSearchIcon: {
        width: 20,
        height: 20,
    },
    connectionContainer: {
        marginTop: HEADER_HEIGHT,
        flexDirection: 'row',
        borderBottomColor: '#2E3133',
        borderBottomWidth: 1,
        paddingVertical: 15,
    },
});

export default styles;
