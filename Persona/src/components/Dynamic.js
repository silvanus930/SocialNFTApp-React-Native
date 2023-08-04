import React from 'react';
import baseText from 'resources/text';
import {
    View,
    Text,
    Button,
    TextInput,
    StyleSheet,
    Image,
    StatusBar,
} from 'react-native';

import colors from 'resources/colors';

const DynamicText = ({
    text,
    style,
    blurb,
    changeText,
    fontSize,
    fontWeight,
    fontColor,
    fontVariant,
    marginBottom,
    marginLeft,
    maxLength = 800,
    marginTop,
    marginStart,
    multiline = false,
}) => {
    return (
        <TextInput
            style={{
                ...baseText,
                ...Styles.userNameInput,
                fontSize: fontSize,
                fontVariant: fontVariant,
                fontWeight: fontWeight,
                color: fontColor ? fontColor : colors.text,
                marginLeft: marginLeft,
                marginTop: marginTop,
                marginBottom: marginBottom,
                marginStart: marginStart,
                padding: 10,
                ...style,
            }}
            fontColor={fontColor ? fontColor : colors.text}
            placeholder={blurb}
            multiline={multiline}
            placeholderTextColor={colors.textFaded2}
            editable={true}
            clearTextOnFocus={false}
            maxLength={maxLength}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={changeText}
            value={text}
            keyboardAppearance={'dark'}
        />
    );
};

const DynamicSecureText = ({
    text,
    blurb,
    changeText,
    fontSize,
    fontWeight,
    marginBottom,
    marginLeft,
    marginTop,
    marginStart,
    style,
    ref,
}) => {
    return (
        <TextInput
            secureTextEntry={true}
            style={{
                ...baseText,
                ...Styles.passwordInput,
                fontSize: fontSize,
                fontWeight: fontWeight,
                marginBottom: marginBottom,
                marginStart: marginStart,
                padding: 0,
                ...style,
            }}
            placeholder={blurb}
            placeholderTextColor={colors.textFaded2}
            editable={true}
            clearTextOnFocus={false}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={changeText}
            value={text}
            keyboardAppearance={'dark'}
            ref={ref}
        />
    );
};

const Styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        alignContent: 'center',
    },
    userNameContainer: {
        borderColor: '#262626',
        backgroundColor: colors.loginInputBackground,
        borderWidth: 1,
        borderRadius: 5,
        justifyContent: 'center',
        marginLeft: 20,
        marginRight: 20,
        height: 45,
        marginBottom: 20,
    },
    userNameInput: {
        marginStart: 10,
        color: 'white',
    },
    passwordContainer: {
        borderColor: '#262626',
        borderWidth: 1,
        borderRadius: 5,
        height: 45,
        justifyContent: 'center',
        //alignItems: 'center',
        marginStart: 20,
        marginEnd: 20,
        backgroundColor: colors.loginInputBackground,
        marginBottom: 20,
    },
    passwordInput: {marginStart: 10, color: 'white'},
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginEnd: 20,
    },
    forgotPasswordText: {
        ...baseText,
        lineHeight: null,
        color: colors.actionText,
    },
    centerDisplayContainer: {
        alignItems: 'center',
        height: 40,
        marginTop: 30,
        justifyContent: 'center',
        marginStart: 20,
        marginEnd: 20,
        borderRadius: 5,
    },
    loginContainer: {
        alignItems: 'center',
        height: 40,
        marginTop: 30,
        backgroundColor: colors.actionText,
        justifyContent: 'center',
        marginStart: 20,
        marginEnd: 20,
        borderRadius: 5,
    },
    loginText: {
        ...baseText,
        color: '#fff',
        fontSize: 18,
    },
});

export {DynamicText, DynamicSecureText, Styles};
