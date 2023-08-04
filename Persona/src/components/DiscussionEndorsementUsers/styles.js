import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    emojiButtonsFlatlist: {
        flexGrow: 0,
        flexShrink: 0,
    },
    endorsementUsersRootContainer: {
        flex: 1,
        flexGrow: 1,
        marginLeft: 8,
    },
    renderUserContainer: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: -10,
        marginTop: 5,
    },
    renderUserText: {
        color: '#fff',
        fontSize: 20,
        padding: 10,
    },
    renderEmojiButtonContainer: (emoji, item) => ({
        display: 'flex',
        flexDirection: 'row',
        padding: 12,
        paddingLeft: 15,
        paddingRight: 15,
        margin: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderColor: '#5F6266',
        borderWidth: emoji === item ? 1 : 0.5,
        backgroundColor: emoji !== item ? '#292C2E' : '#424547',
    }),
    renderEmojiButtonTextItem: {
        color: '#D0D3D6',
        fontSize: 15,
        fontWeight: 500,
    },
    renderEmojiButtonTextEndorsersLength: {
        color: '#D0D3D6',
        fontSize: 18,
        fontWeight: 500,
        marginLeft: 10,
        marginTop: -1,
    },
    h24: {
        height: 24,
    },
    flex1: {
        flex: 1,
    },
    m10: {
        margin: 10,
    },
    mt10: {
        marginTop: 10,
    },
});

export default styles;
