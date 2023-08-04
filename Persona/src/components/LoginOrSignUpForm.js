import auth from '@react-native-firebase/auth';
import {DynamicSecureText, Styles} from 'components/Dynamic';
import GracefulInputView from 'components/GracefulInputView';
import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import images from 'resources/images';
import {BaseText} from 'resources/text';

export default function LoginOrSignUpForm({navigation}) {
    const [phoneNumber, setPhoneNumber] = useState(null);
    const [verificationCode, setVerificationCode] = useState(null);
    const [pending, setPending] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const [emailPhone, setEmailPhone] = React.useState('');
    const [countryCode, setCountryCode] = React.useState('1');
    const [showPhoneInput, setShowPhoneInput] = React.useState(false);

    const countryCodeRef = useRef();
    const passwordRef = useRef();

    const [loggingInWithEmail, setLoggingInWithEmail] = React.useState(false);

    const updateInputs = val => {
        let value = val.trim().replace(/\s/g, '');
        setEmailPhone(value);

        if (/^\d{3}/.test(val)) {
            setEmailPhone(value.replace(/\D/g, ''));
            setShowPhoneInput(true);
            setLoggingInWithEmail(false);
        } else if (value[0] === '+') {
            setEmailPhone('');
            countryCodeRef.current.focus();
            setShowPhoneInput(true);
            setLoggingInWithEmail(false);
        } else if (value[0] === '(') {
            setShowPhoneInput(true);
            setLoggingInWithEmail(false);
        } else if (
            /\(\d{3}\)\d{3}-\d{4}/.test(value) ||
            /\d{3}-\d{3}-\d{4}/.test(value)
        ) {
            setEmailPhone(value.replace(/\D/g, ''));
            setShowPhoneInput(true);
            setLoggingInWithEmail(false);
        } else if (showPhoneInput && value.length > 0 && !/\d/.test(value[0])) {
            setShowPhoneInput(false);
        }

        if (value.includes('@')) {
            setShowPhoneInput(false);
        }
    };

    const login = async () => {
        if (!emailPhone) {
            Alert.alert('An email address or phone number is required.');
            return;
        }

        // phone flow
        if (showPhoneInput) {
            let phone = '+' + countryCode + emailPhone.replace(/\D/g, '');

            if (/[^$,\.\d]/.test(phone.replace('+', ''))) {
                Alert.alert('Invalid phone number');
                return;
            }

            try {
                setPending(true);
                const confirmation = await auth().signInWithPhoneNumber(
                    phone,
                );
                setEmailPhone(phone);
                setConfirm(confirmation);
            } catch (err) {
                console.error('ERROR: ', err);
                if (err.code === 'auth/invalid-phone-number') {
                    Alert.alert(
                        'The phone number you entered is invalid. Please try again.',
                    );
                } else {
                    Alert.alert(
                        `Something went wrong. Please try again. Code: ${err.code}`,
                    );
                }
            }
        }

        // email flow
        else {
            let email = emailPhone.toLowerCase();
            // Check valid email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // Test the email address against the pattern
            if (!emailRegex.test(email)) {
                Alert.alert(
                    'Please enter a valid email address or phone number.',
                );
                return;
            }

            // Check if account exists
            const userEmailList = await auth().fetchSignInMethodsForEmail(
                email,
            );

            if (userEmailList?.length === 0) {
                // account does not exist, should signup
                // Ask for phone instead and put user through OTP flow
                setEmailPhone('');
                setShowPhoneInput(true);
                setLoggingInWithEmail(false);
                Alert.alert(
                    'Please register with your phone number. You will be able to enter your email address on the next step.',
                );

                return;
            } else {
                // Account exists, ask for password
                setLoggingInWithEmail(true);
                passwordRef.current.focus();
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
                // setVerificationCode(null);
                // setEmailPhone(null);
            } catch (err) {
                console.error('ERROR: ', err);
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

    const [emailPassword, setEmailPassword] = React.useState('');

    const _signInAsync = async () => {
        // Firebase auth does not support empty email/pw in android error handling,
        // so catch for this.
        if (!emailPhone || !emailPassword) {
            alert('Please provide an email and password!');
            return;
        }
        auth()
            .signInWithEmailAndPassword(emailPhone.trim(), emailPassword.trim())
            .catch(err => {
                alert(err);
            });
    };

    const _forgotPasswordAsync = async () => {
        if (emailPhone.trim() === '') {
            Alert.alert('Please enter a valid email address!');
            return;
        }
        try {
            await auth().sendPasswordResetEmail(emailPhone.trim());
            Alert.alert(
                `Sent a password reset email to ${emailPhone}. If you don't see the email check your spam folder. Please email support@persona.nyc if you have any issues.`,
            );
        } catch (err) {
            Alert.alert(err.toString());
        }
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
                <>
                    <View
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                        <View
                            style={{
                                width: '90%',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                                marginTop: 20,
                            }}>
                            <Text
                                style={{
                                    textAlign: 'left',
                                    fontSize: 16,
                                    color: '#D0D3D6',
                                }}>
                                Email/phone
                            </Text>
                        </View>
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                width: '90%',
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 75,
                                    display: showPhoneInput ? 'flex' : 'none',
                                }}>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        marginRight: -27,
                                        width: 27,
                                        paddingLeft: 5,
                                        zIndex: 10,
                                        elevation: 10,
                                        color: '#D0D3D6',
                                        marginTop: 6,
                                        borderWidth: 0,
                                        borderColor: 'white',
                                    }}>
                                    +
                                </Text>
                                <TextInput
                                    textContentType="telephoneNumber"
                                    keyboardType="phone-pad"
                                    defaultValue={countryCode.toString()}
                                    maxLength={3}
                                    value={countryCode.toString()}
                                    ref={countryCodeRef}
                                    style={{
                                        borderRadius: 8,
                                        backgroundColor: '#292C2E',
                                        color: '#D0D3D6',
                                        padding: 10,
                                        paddingLeft: 22,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 18,
                                        marginTop: 10,
                                        borderWidth: 0.5,
                                        borderColor: '#5F6266',
                                        marginRight: 5,
                                        flex: 1,
                                    }}
                                    onChangeText={setCountryCode}
                                />
                            </View>
                            <TextInput
                                multiline={false}
                                autoCapitalize="none"
                                style={{
                                    flex: 1,
                                    borderRadius: 8,
                                    backgroundColor: '#292C2E',
                                    color: '#D0D3D6',
                                    padding: 10,
                                    paddingLeft: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 17,
                                    marginTop: 10,
                                    borderWidth: 0.5,
                                    borderColor: '#5F6266',
                                }}
                                placeholder={'Enter an email or phone number'}
                                color={colors.textBright}
                                placeholderTextColor="#AAAEB2"
                                value={emailPhone}
                                onChangeText={updateInputs}
                            />
                        </View>
                    </View>
                </>
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
                                `${emailPhone} to continue.`}{' '}
                        </BaseText>
                    </View>
                    <TextInput
                        autoFocus
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
                        onPress={login}>
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
            {loggingInWithEmail && (
                <>
                    <View
                        style={{
                            ...Styles.passwordContainer,
                            height: 42,
                            marginTop: 3,
                        }}>
                        <DynamicSecureText
                            marginStart={10}
                            key="dynamicPasswordInput"
                            blurb="Password"
                            text={emailPassword}
                            changeText={text => setEmailPassword(text)}
                            style={{lineHeight: null, fontSize: 18}}
                            ref={passwordRef}
                        />
                    </View>
                    <View style={Styles.forgotPasswordContainer}>
                        <TouchableOpacity onPress={_forgotPasswordAsync}>
                            <Text style={Styles.forgotPasswordText}>
                                Forgot password?
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={Styles.loginContainer}
                        onPress={_signInAsync}>
                        <Text style={Styles.loginText}>Log In</Text>
                    </TouchableOpacity>
                </>
            )}
            {!confirm && !loggingInWithEmail ? (
                pending ? (
                    <View style={{marginTop: 20}}>
                        <ActivityIndicator size="small" />
                    </View>
                ) : (
                    <TouchableOpacity
                        style={{
                            ...Styles.loginContainer,
                            marginTop: 10,
                        }}
                        onPress={login}>
                        <Text style={Styles.loginText}>Login or sign up</Text>
                    </TouchableOpacity>
                )
            ) : null}
        </GracefulInputView>
    );
}
