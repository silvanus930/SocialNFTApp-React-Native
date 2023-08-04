import React, {useEffect, useState, useCallback} from 'react';
import baseText from 'resources/text';
import {
    Alert,
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import GracefulInputView from 'components/GracefulInputView';
import images from 'resources/images';
import {
    DynamicText,
    DynamicSecureText,
    Styles as DynamicStyles,
} from 'components/Dynamic';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';
import functions from '@react-native-firebase/functions';
import colors from 'resources/colors';
import firestore from '@react-native-firebase/firestore';
import {BaseText} from 'resources/text';

export default function SignUpForm({
    initUserState,
    resetUserState,
    inviteCodeFromLink,
}) {
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inviteCode, setInviteCode] = useState(inviteCodeFromLink);
    const [isInvalidUserName, setIsInvalidUserName] = useState(false);
    const [isInvalidEmail, setIsInvalidEmail] = useState(false);
    const [isInvalidPassword, setIsInvalidPassword] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const specialCharRegex = /['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^`{|}~\s']/g;
    const emailRegex = /^[^\s@]+@[^\s@]+$/;

    useEffect(() => {
        setInviteCode(inviteCodeFromLink);
    }, [inviteCodeFromLink]);

    const phoneNumber = auth().currentUser?.phoneNumber;

    const handleUserNameChange = newText => {
        if (specialCharRegex.test(newText)) {
            setIsInvalidUserName(true);
        } else if (isInvalidUserName) {
            setIsInvalidUserName(false);
        }
        setUserName(newText);
    };

    const handleEmailChange = newText => {
        if (newText && !emailRegex.test(newText)) {
            setIsInvalidEmail(true);
        } else if (isInvalidEmail) {
            setIsInvalidEmail(false);
        }
        setEmail(newText);
    };

    const handlePasswordChange = newText => {
        if (newText && !newText.length >= 8) {
            setIsInvalidPassword(true);
        } else if (isInvalidPassword) {
            setIsInvalidPassword(false);
        }

        setPassword(newText);
    };

    const isValidForm =
        !isInvalidUserName &&
        email.length > 0 &&
        userName.length > 0;
        // inviteCode.length > 0;

    const createUser = async () => {
        if (isInvalidEmail) {
            Alert.alert('Please enter a valid email.');
        } else {
            setIsLoading(true);

            try {
                const finishUserSignUp = functions().httpsCallable(
                    'finishUserSignupInviteViaLinkSupport',
                );

                const result = await finishUserSignUp({
                    userID: auth().currentUser?.uid,
                    email,
                    password,
                    inviteCode,
                    username: userName,
                    phoneNumber,
                });
                console.log(result?.data);
                const resultCode = result?.data?.result;
                switch (resultCode) {
                    case 'success':
                        const userDocument = await firestore()
                            .collection('users')
                            .doc(auth().currentUser?.uid)
                            .get();
                        if (userDocument.exists) {
                            firestore()
                                .collection('users')
                                .doc(auth().currentUser?.uid)
                                .set(
                                    {
                                        walletBalance: {
                                            cc: 0,
                                            eth: 0,
                                            nft: 0,
                                            usdc: 0,
                                        },
                                    },
                                    {merge: true},
                                );

                            // sign in again with email + password
                            // we need to reauthenticate when adding email+password to auth account
                            auth().signOut().then(() => {
                                auth().signInWithEmailAndPassword(email, password)
                                  .then((userCredential) => {
                                    // Signed in
                                    var user = userCredential.user;
                                    initUserState({user});
                                  })
                                  .catch((error) => {
                                    Alert.alert('Something went wrong during sign up.');
                                    console.log('sign up form error', error.code, error.message);
                                  });    
                            }).catch((error) => {
                              Alert.alert('Something went wrong during sign up.');
                              console.log('error on signout before signing back in');
                            });
                        } else {
                            Alert.alert('Something went wrong during sign up.');
                        }
                        break;
                    case 'email-missing':
                        Alert.alert('You must provide an email');
                        break;
                    case 'username-missing':
                        Alert.alert('You must provide a username');
                        break;
                    case 'invite-code-missing':
                        Alert.alert('You must provide an invite code');
                        break;
                    case 'password-missing':
                        Alert.alert('You must provide a password');
                        break;
                    case 'invite-code-not-found':
                        Alert.alert('Invite not found. You must register using the phone number or email you were invited with.');
                        break;
                    case 'invite-code-used':
                        Alert.alert('Invite code already used');
                        break;
                    case 'invite-code-is-not-valid':
                        Alert.alert('Invite code is not valid anymore');
                        break;
                    case 'invite-code-is-expired':
                        Alert.alert('Invite code is expired');
                        break;
                    case 'username-taken':
                        Alert.alert('Username not available');
                        break;
                    case 'phone-number-missing':
                        Alert.alert('You must provide a phone number');
                        break;
                    case 'invalid-credential':
                        Alert.alert('Invalid confirmation code');
                        break;
                    case 'invalid-phone-number':
                        Alert.alert(
                            'The phone number you entered was invalid. Please try again.',
                        );
                        break;
                    case 'error':
                        Alert.alert('Error: ' + result?.data?.data?.toString());
                        break;
                    default:
                        Alert.alert(
                            `Error: Something went wrong with signing up - code: ${resultCode}`,
                        );
                        break;
                }
            } catch (err) {
                Alert.alert(err);
            }
            setIsLoading(false);
        }
    };

    return (
        <GracefulInputView style={DynamicStyles.container}>
            <View style={{...DynamicStyles.logoContainer, marginBottom: 20}}>
                <FastImage
                    source={images.logo}
                    style={{height: 70, width: 200}}
                />
            </View>
            <View style={Style.errorTextContainer}>
                <BaseText style={{color: colors.textFaded}}>
                    Complete your user profile to finish signing up.
                </BaseText>
            </View>
            <View>
                <View style={DynamicStyles.userNameContainer}>
                    <DynamicText
                        key="dynamicUserNameInput"
                        blurb="Username"
                        text={userName}
                        changeText={handleUserNameChange}
                        style={{
                            fontSize: 18,
                        }}
                    />
                </View>
                {isInvalidUserName && (
                    <View style={Style.errorTextContainer}>
                        <Text style={Style.errorText}>
                            Usernames can only include letters, numbers or _.{' '}
                        </Text>
                    </View>
                )}
                <View style={DynamicStyles.userNameContainer}>
                    <DynamicText
                        key="dynamicEmailInput"
                        blurb="Email Address"
                        text={email}
                        changeText={handleEmailChange}
                        style={{
                            fontSize: 18,
                        }}
                    />
                </View>
                <View style={DynamicStyles.userNameContainer}>
                    <DynamicSecureText
                        key="dynamicPasswordInput"
                        blurb="Password"
                        text={password}
                        changeText={handlePasswordChange}
                        style={{
                            fontSize: 18,
                            padding: 10,
                        }}
                    />
                </View>                
                {isLoading ? (
                    <View style={{marginTop: 34}}>
                        <ActivityIndicator size="large" color={colors.text} />
                    </View>
                ) : (
                    <View>
                        <TouchableOpacity
                            disabled={!isValidForm}
                            style={{
                                ...DynamicStyles.loginContainer,
                            }}
                            onPress={createUser}>
                            <Text
                                style={{
                                    ...baseText,
                                    ...DynamicStyles.loginText,
                                }}>
                                Finish signing up
                            </Text>
                        </TouchableOpacity>
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
                            <TouchableOpacity onPress={resetUserState}>
                                <Text
                                    style={{
                                        ...baseText,
                                        ...DynamicStyles.forgotPasswordText,
                                        top:
                                            Platform.OS === 'android'
                                                ? -3.5
                                                : 0,
                                        fontSize: 18,
                                    }}>
                                    Start over
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </GracefulInputView>
    );
}

const Style = StyleSheet.create({
    errorTextContainer: {
        marginLeft: 20,
        marginBottom: 20,
    },
    errorText: {
        ...baseText,
        color: '#FF1414',
    },
});
