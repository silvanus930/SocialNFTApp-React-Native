import {DefaultTheme, DarkTheme} from '@react-navigation/native';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import {ThemeType} from 'types';

export const AppDarkTheme: ThemeType = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        ...colors,
        primary: '#121212',
        card: '#121212',
        border: '#121212',
        notification: '#121212',
    },
    fonts: {
        ...fonts,
    },
};
