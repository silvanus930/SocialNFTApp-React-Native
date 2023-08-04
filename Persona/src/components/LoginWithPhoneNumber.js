import React, {useEffect, useState} from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    Platform,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import baseText, {BaseText} from 'resources/text';
import GracefulInputView from 'components/GracefulInputView';
import {DynamicText, DynamicSecureText, Styles} from 'components/Dynamic';
import FastImage from 'react-native-fast-image';
import images from 'resources/images';
import colors from 'resources/colors';
import auth from '@react-native-firebase/auth';
import fonts from 'resources/fonts';

export default function LoginWithPhoneNumber({navigation}) {
    const [countryCode, setCountryCode] = useState(1);
    const [phoneNumber, setPhoneNumber] = useState(null);
    const [verificationCode, setVerificationCode] = useState(null);
    const [pending, setPending] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const login = async _phoneNumber => {
        try {
            setPending(true);
            const confirmation = await auth().signInWithPhoneNumber(
                _phoneNumber,
            );
            setConfirm(confirmation);
        } catch (err) {
            console.error('ERROR: ', err);
            if (err.code === 'auth/invalid-phone-number') {
                Alert.alert(
                    'The phone number you entered is invalid. Please try again.',
                );
            } else {
                console.error('ERROR:', err);
                Alert.alert(
                    `Something went wrong. Please try again. Code: ${err.code}`,
                );
            }
        }
        setPending(false);
    };

    const startOver = () => {
        setConfirm(null);
    };

    useEffect(() => {
        async function confirmCode() {
            try {
                setPending(true);
                await confirm.confirm(verificationCode);
                setVerificationCode(null);
                setCountryCode(1);
                setPhoneNumber(null);
            } catch (err) {
                console.log('ERROR: ', err);
                if (err.code === 'auth/invalid-verification-code') {
                    Alert.alert(
                        'Your verification code was incorrect. Please try again.',
                    );
                } else {
                    Alert.alert(
                        `Something went wrong. Please try again. Code: ${err.code}`,
                    );
                }
            }
            setPending(false);
        }

        if (verificationCode?.length === 6) {
            confirmCode();
        }
    }, [confirm, verificationCode]);

    const navToLoginWithEmail = () => {
        navigation.navigate('LoginWithEmail');
    };

    const navToSignupForm = async () => {
        navigation.navigate('Registration');
    };

    return (
        <GracefulInputView style={Styles.container}>
            <View style={Styles.logoContainer}>
                <FastImage
                    source={images.logo}
                    style={{height: 70, width: 200}}
                />
            </View>
            {!confirm && (
                <View
                    style={{
                        marginTop: 20,
                        display: 'flex',
                        alignItems: 'center',
                    }}>
                    <View
                        style={{
                            borderWidth: 0,
                            borderColor: 'red',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <BaseText
                            style={{
                                fontSize: 24,
                                marginRight: 5,
                                marginTop: 5,
                            }}>
                            +
                        </BaseText>
                        <TextInput
                            textContentType="telephoneNumber"
                            keyboardType="phone-pad"
                            defaultValue={countryCode.toString()}
                            maxLength={3}
                            value={countryCode}
                            style={{
                                marginRight: 5,
                                width: 50,
                                fontFamily: fonts.regular,
                                fontSize: 18,
                                color: colors.textBright,
                                borderRadius: 8,
                                borderColor: '#262626',
                                borderWidth: 1,
                                backgroundColor: colors.loginInputBackground,
                                padding: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onChangeText={setCountryCode}
                        />
                        <TextInput
                            placeholderTextColor={colors.textFaded2}
                            placeholder="Phone number"
                            textContentType="telephoneNumber"
                            keyboardType="phone-pad"
                            maxLength={15}
                            style={{
                                width: 200,
                                fontFamily: fonts.regular,
                                fontSize: 18,
                                color: colors.textBright,
                                borderRadius: 8,
                                borderColor: '#262626',
                                borderWidth: 1,
                                backgroundColor: colors.loginInputBackground,
                                padding: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />
                    </View>
                </View>
            )}
            {confirm && (
                <View
                    style={{
                        marginTop: 20,
                        display: 'flex',
                        alignItems: 'center',
                    }}>
                    <View
                        style={{
                            paddingLeft: 20,
                            paddingRight: 20,
                            marginBottom: 20,
                        }}>
                        <BaseText style={{textAlign: 'left', color: '#969696'}}>
                            Please enter the six digit verification code we sent
                            to{' '}
                            {auth().currentUser?.phoneNumber ||
                                `+${countryCode}${phoneNumber}`}{' '}
                            to finish logging in.
                        </BaseText>
                    </View>
                    <TextInput
                        placeholderTextColor={colors.textFaded2}
                        placeholder="Enter code"
                        textContentType="oneTimeCode"
                        keyboardType="phone-pad"
                        maxLength={6}
                        style={{
                            width: 150,
                            fontFamily: fonts.regular,
                            fontSize: 18,
                            color: colors.textBright,
                            borderRadius: 8,
                            borderColor: '#262626',
                            borderWidth: 1,
                            backgroundColor: colors.loginInputBackground,
                            padding: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 25,
                        }}
                        onChangeText={setVerificationCode}
                    />
                    <TouchableOpacity
                        style={{marginBottom: 20}}
                        onPress={() => {
                            const fullPhoneNumber = `+${countryCode}${phoneNumber}`;
                            login(fullPhoneNumber);
                        }}>
                        <Text style={Styles.forgotPasswordText}>
                            Resend code
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={startOver}>
                        <Text style={Styles.forgotPasswordText}>
                            Start over
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            {!confirm ? (
                pending ? (
                    <View style={{marginTop: 20}}>
                        <ActivityIndicator size="small" />
                    </View>
                ) : (
                    <TouchableOpacity
                        style={Styles.loginContainer}
                        onPress={() => {
                            const fullPhoneNumber = `+${countryCode}${phoneNumber}`;
                            login(fullPhoneNumber);
                        }}>
                        <Text style={Styles.loginText}>Log In</Text>
                    </TouchableOpacity>
                )
            ) : null}
            {!confirm && (
                <View
                    style={{
                        borderTopWidth: 1,
                        paddingTop: 15,
                        borderColor: colors.darkSeperator,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        marginTop: 20,
                        marginBottom: 15,
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            color: '#969696',
                            marginRight: 5,
                            fontSize: 18,
                        }}>
                        Don't have an account?
                    </Text>
                    <TouchableOpacity onPress={navToSignupForm}>
                        <Text
                            style={{
                                ...baseText,
                                ...Styles.forgotPasswordText,
                                top: Platform.OS === 'android' ? -3.5 : 0,
                                fontWeight: 'bold',
                                fontSize: 18,
                            }}>
                            Sign Up
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            {!confirm && (
                <View style={{display: 'flex', alignItems: 'center'}}>
                    <TouchableOpacity onPress={navToLoginWithEmail}>
                        <Text style={Styles.forgotPasswordText}>
                            Login with email
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </GracefulInputView>
    );
}
