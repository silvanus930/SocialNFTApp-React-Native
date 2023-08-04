import {Platform, StyleSheet} from 'react-native';

const styles = StyleSheet.create({
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
});

export default styles;
