import React from 'react';
import baseText from 'resources/text';
import {View, Text, Alert} from 'react-native';
import GracefulInputView from 'components/GracefulInputView';
import {TouchableOpacity} from 'react-native';
import images from 'resources/images';
import {DynamicText, DynamicSecureText, Styles} from 'components/Dynamic';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';
import colors from 'resources/colors';

export default function LoginWithEmailForm({navigation}) {
    const [sEmail, setsEmail] = React.useState('');
    const [sPassword, setsPassword] = React.useState('');

    const _signInAsync = async () => {
        // Firebase auth does not support empty email/pw in android error handling, so catch for this.
        if (!sEmail || !sPassword) {
            alert('Please provide an email and password!');
            return;
        }
        auth()
            .signInWithEmailAndPassword(sEmail.trim(), sPassword.trim())
            .catch(err => {
                alert(err);
            });
    };

    const _forgotPasswordAsync = async () => {
        if (sEmail.trim() === '') {
            Alert.alert('Please enter a valid email address!');
            return;
        }
        try {
            await auth().sendPasswordResetEmail(sEmail.trim());
            Alert.alert(
                `Sent a password reset email to ${sEmail}. If you don't see the email check your spam folder. Please email support@persona.nyc if you have any issues.`,
            );
        } catch (err) {
            Alert.alert(err.toString());
        }
    };

    const _navRegisterAsync = async () => {
        navigation.navigate('Registration');
    };

    const navToLoginWithPhoneNumber = () => {
        navigation.navigate('LoginWithPhoneNumber');
    };

    return (
        <GracefulInputView style={Styles.container}>
            <View style={Styles.logoContainer}>
                <FastImage
                    source={images.logo}
                    style={{height: 70, width: 200}}
                />
            </View>
            <View style={{...Styles.userNameContainer, height: 42}}>
                <DynamicText
                    key="dynamicUserNameInput"
                    blurb="Email"
                    text={sEmail}
                    changeText={text => setsEmail(text)}
                    style={{lineHeight: null, fontSize: 18}}
                />
            </View>
            <View style={{...Styles.passwordContainer, height: 42}}>
                <DynamicSecureText
                    marginStart={10}
                    key="dynamicPasswordInput"
                    blurb="Password"
                    text={sPassword}
                    changeText={text => setsPassword(text)}
                    style={{lineHeight: null, fontSize: 18}}
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

            <View
                style={{
                    //flex: 0.1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 30,
                }}
            />
        </GracefulInputView>
    );
}
