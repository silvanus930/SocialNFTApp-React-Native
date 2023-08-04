import {StyleSheet} from 'react-native';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import baseText from 'resources/text';

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
    centerContainer: {
        flex: 1,
        left: 5,
        borderColor: 'purple',
        borderWidth: 0,
        paddingTop: 9,
        paddingBottom: 9,
        paddingStart: 13,
        marginRight: 20,
    },
    textStyle: {
        ...baseText,
        flex: 1.22,
        fontFamily: fonts.medium,
        color: colors.textFaded,
        padding: 8,
        paddingLeft: 0,
        paddingRight: 0,
        fontSize: 18,
    },
    textStyleHighlight: {
        color: 'white',
        fontWeight: '500',
    },
    authorCount: {
        color: colors.timestamp,
    },
    listItem: ({deleting}) => {
        return {
            backgroundColor: deleting ? '#220f0f' : null,
            borderColor: 'purple',
            borderWidth: 0,
            marginRight: -3,
            height: 55,
            justifyContent: 'center',
        };
    },
    listItemInnerContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    listItemContentContainer: {
        flex: 1,
        left: 2,
        flexDirection: 'row',
        marginLeft: 0,
        marginStart: 5,
        alignItems: 'center',
    },
    unnamed: {
        ...baseText,
        color: colors.textFaded2,
    },
    privateContainer: {
        borderColor: 'blue',
        alignItems: 'center',
    },
    privateIcon: {
        marginStart: 3,
        marginRight: 3,
        flex: 0,
        top: 0,
    },
    timestampContainer: {
        marginLeft: 8,
        top: 2,
        marginRight: 8,
        color: colors.timestamp,
        padding: 4,
        minWidth: 30,
        borderRadius: 100,
        alignItems: 'center',
    },
    profileModeStyles: ({persona}) => {
        return {
            marginLeft: 2,
            width: persona?.profileImgUrl ? 31 : 32,
            height: persona?.profileImgUrl ? 31 : 32,
            top: 3.2,
            borderRadius: 100,
            borderColor: colors.darkSeperator,
            borderWidth: 1,
        };
    },
});

export default styles;
