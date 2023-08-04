import {StyleSheet} from 'react-native';
import {baseText} from 'resources';

const styles = StyleSheet.create({
    container: (style, noBorder) => ({
        flex: 1,
        height: 40,
        backgroundColor: '#2E3133DD',
        borderColor: '#D0D3D6',
        borderWidth: noBorder ? 0 : 0.5,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
        ...style,
    }),
    text: textStyle => ({...baseText, fontSize: 14, ...textStyle}),
});

export default styles;
