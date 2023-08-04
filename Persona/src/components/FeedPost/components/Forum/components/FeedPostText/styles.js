import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    container: {
        borderWidth: 0,
        borderColor: 'purple',
    },
    subContainer: {
        borderWidth: 0,
        borderColor: 'green',
        margin: 0,
        padding: 0,

    },
    markDownElement: {
        paragraph: {
            marginBottom: 0,
            paddingBottom: 0,
            marginTop: 0,
        },
        textDefault: {
            color: '#AAAEB2',
        },
    },
    commentContainer: {
        marginBottom: 10,
        flexDirection: 'row',
        justifyContents: 'space-between',
        borderWidth: 0,
        borderColor: 'red',
        flex: 1,
        alignItems: 'center',
    },
    endorsementContainer: {
        flexDirection: 'row',
        justifyContents: 'flex-end',
        flex: 1,
        borderWidth: 0,
        borderColor: 'red',
    },
    navToPostDiscussion: {
        flex: 1,
        marginTop: 0,
        flexDirection: 'column',
        borderWidth: 0,
        borderColor: 'green',
    },
    commentCounter: {
        borderColor: 'blue',
        borderWidth: 0,
        paddingTop: 0,
        alignItems: 'center',
    },
    postEndorSementPaneContainer: {
        borderWidth: 0,
        marginBottom: 5,
        borderColor: 'blue',
        flex: 1,
    },
    endorsementButton: {
        width: 50,
        bottom: 3,
        justifyContent: 'flex-start',
        borderWidth: 0,
        borderColor: 'green',
    },
});

export default styles;
