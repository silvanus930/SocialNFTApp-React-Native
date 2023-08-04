import {StyleSheet} from 'react-native';
import {baseText, colors} from 'resources';

const styles = StyleSheet.create({
    actionBarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderColor: 'blue',
        borderWidth: 0,
        marginStart: 23,
        marginEnd: 23,
        marginTop: 20,
    },
    actionButtonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: ({fontColor}) => {
        return {
            ...baseText,
            marginTop: 10,
            color: colors.textFaded,
            fontWeight: '400',
            color: fontColor,
        };
    },
    actionButtonIcon: {width: 57, height: 56},
});

export default styles;
