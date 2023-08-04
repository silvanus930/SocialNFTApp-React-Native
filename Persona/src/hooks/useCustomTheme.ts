import {ThemeType} from 'types';
import {useTheme} from '@react-navigation/native';

const useCustomTheme = () => {
    const {colors, fonts} = useTheme() as ThemeType;
    return {colors, fonts};
};

export default useCustomTheme;
