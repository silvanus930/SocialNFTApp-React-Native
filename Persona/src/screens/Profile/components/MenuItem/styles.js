import {StyleSheet} from 'react-native';
import fonts from 'resources/fonts';
import baseText from 'resources/text';

const ICON_MAP = {
    menuIconAccount: [20, 20],
    menuIconHelp: [20, 20],
    menuIconLogout: [19, 20],
    menuIconNfts: [22, 18],
    menuIconNotifications: [20, 20],
    menuIconPrivacy: [20, 22],
    menuIconReport: [21, 20],
    menuIconTerms: [18, 22],
    menuIconWallet: [20, 18],
    bookmark: [18, 18],
};

export const SWITCH_COLORS = {
    TRACK_FALSE: '#333',
    TRACK_TRUE: '#333',
    STATE_ON: '#7FC1A9',
    STATE_OFF: '#B15F5F',
    IOS_BACKGROUND: '#333',
};

const styles = StyleSheet.create({
    container: ({isLastItem}) => {
        return {
            borderBottomWidth: isLastItem ? 0 : StyleSheet.hairlineWidth,
            borderColor: '#424547',
        };
    },
    innerContainer: {
        paddingVertical: 17,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
    },
    navContainer: {
        alignItems: 'flex-end',
    },
    headerText: ({color}) => {
        return {
            color: color ? color : '#868B8F',
            fontSize: 14,
            fontWeight: 500,
        };
    },
    titleText: ({color}) => {
        return {
            color: color ? color : '#BFC3C7',
            fontSize: 16,
            fontWeight: 400,
        };
    },
    subtextText: ({color}) => {
        return {
            color: color ? color : '#E6E8EB',
            fontSize: 16,
            fontWeight: 500,
        };
    },
    navArrow: {
        width: 8,
        height: 14,
    },
    icon: icon => {
        const [width, height] = ICON_MAP[icon];
        return {
            width: width,
            height: height,
        };
    },
    switch: {
        transform: [{scaleX: 0.7}, {scaleY: 0.7}],
        borderWidth: StyleSheet.hairlineWidth,
        marginRight: -8,
    },
});

export default styles;
