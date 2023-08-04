import {StyleSheet} from 'react-native';
import {fonts, baseText, constants, colors} from 'resources';

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1B1D1F',
    },
    innerContainer: ({isLastItem = false}) => {
        return {
            marginHorizontal: 16,
            paddingVertical: 16,
            borderBottomColor: '#424547',
            borderBottomWidth: isLastItem ? 0 : StyleSheet.hairlineWidth,
            paddingBottom: isLastItem ? 0 : 16,
        };
    },
});

export default styles;
