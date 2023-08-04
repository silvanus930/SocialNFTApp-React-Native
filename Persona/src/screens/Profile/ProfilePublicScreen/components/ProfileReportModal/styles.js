import { StyleSheet } from 'react-native';
import { colors, baseText } from 'resources';

export const PROFILE_TOP_OFFSET = -40;

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        flexDirection: 'column',
        borderColor: 'orange',
        borderWidth: 2,
        borderRadius: 10,
        marginLeft: 20,
        marginRight: 20,
        marginTop: 40,
        marginBottom: 10,
        padding: 16,
    },
    buttonContainer: {
        marginBottom: 20,
    },
    buttonIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    headerTextStyle: {
        ...baseText,
        color: colors.text,
        marginStart: 20,
        marginTop: 20,
        marginBottom: 20,
    },
    checkBoxContainer: {
        flexDirection: 'row',
    },
    checkBoxStyle: {
        width: 25,
        height: 25,
        margin: 5
    },
    checkBoxText: {
        ...baseText,
        color: colors.text,
    },
    submitReport: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
});

export default styles;