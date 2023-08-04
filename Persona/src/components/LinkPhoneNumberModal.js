import React, {useState, useRef} from 'react';
import {BaseText} from 'resources/text';
import PhoneNumberInput from 'components/PhoneNumberInput';
import fonts from 'resources/fonts';
import {
    Alert,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import colors from 'resources/colors';
import auth from '@react-native-firebase/auth';
import BottomSheet from './BottomSheet';
import firestore from '@react-native-firebase/firestore';

export default function LinkPhoneNumberModal({
    showLinkPhoneNumber,
    toggleShowLinkPhoneNumber,
    hasLinkedPhoneNumber,
}) {
    const [verifyingNumber, setVerifyingNumber] = useState(
        !hasLinkedPhoneNumber,
    );
    const [phoneNumber, setPhoneNumber] = useState(null);
    const [pending, setPending] = useState(false);

    const verificationIdRef = useRef(null);
    const verificationCodeRef = useRef(null);

    const setPhoneNum = React.useCallback(
        num => {
            if (num?.length >= 12) {
                console.log('setting phone num', num);

                const fullPhoneNumber = `${num}`;
                setPhoneNumber(num);
                getVerificationCode(num);
            }
        },
        [setPhoneNumber],
    );

    const setVerCode = React.useCallback(
        code => {
            if (code?.length === 6) {
                verificationCodeRef.current = code;

                if (hasLinkedPhoneNumber) {
                    unlinkAccount();
                } else {
                    linkAccount();
                }
            }
        },
        [hasLinkedPhoneNumber, linkAccount, unlinkAccount],
    );

    const getVerificationCode = async _phoneNumber => {
        console.log('running getVerificationCode', _phoneNumber);
        try {
            setVerifyingNumber(true);
            setPending(true);
            console.log('pending true');
            const confirmation = await auth()
                .verifyPhoneNumber(_phoneNumber)
                .on(
                    'state_changed',
                    phoneAuthSnapshot => {
                        console.log('State: ', phoneAuthSnapshot.state);
                    },
                    error => {
                        console.error(error);
                        setPending(false);
                        resetState();
                        Alert.alert(
                            `Something went wrong. Please try again. Code: ${error.code}`,
                        );
                    },
                    phoneAuthSnapshot => {
                        console.log('Success');
                    },
                );
            console.log('finished verifyPhoneNumber', _phoneNumber);
            verificationIdRef.current = confirmation.verificationId;
            console.log('have verificationId', confirmation.verificationId);
            setPending(false);
        } catch (err) {
            console.error('ERROR: ', err);
            console.log('ERROR: ', err);
            Alert.alert(
                `Something went wrong. Please try again. Code: ${err.code}`,
            );
        }
    };

    async function getPhoneCredential() {
        if (verificationIdRef.current && verificationCodeRef.current) {
            try {
                return await auth.PhoneAuthProvider.credential(
                    verificationIdRef.current,
                    verificationCodeRef.current,
                );
            } catch (err) {
                console.log('ERROR: ', err);
                Alert.alert(
                    `Something went wrong. Please try again. Code: ${err.code}`,
                );
            }
        }
    }

    const resetState = () => {
        verificationIdRef.current = null;
        setVerifyingNumber(!hasLinkedPhoneNumber);
        verificationCodeRef.current = null;
        setPhoneNumber(null);
    };

    const linkAccount = React.useCallback(async () => {
        console.log('running link account');
        try {
            setPending(true);
            const credential = await getPhoneCredential();
            await auth().currentUser.linkWithCredential(credential);
            await firestore()
                .collection('users')
                .doc(auth().currentUser.uid)
                .update({isPhoneNumberLinked: true});
            setPending(false);
            verificationIdRef.current = null;
            setVerifyingNumber(false);
            verificationCodeRef.current = null;
            setPhoneNumber(null);
            Alert.alert('Phone number successfully linked');
        } catch (err) {
            console.log('ERROR: ', err);
            setPending(false);
            Alert.alert(
                `Something went wrong. Please try again. Code: ${err.code}`,
            );
        }
    }, [setPending, setVerifyingNumber]);

    const unlinkAccount = React.useCallback(async () => {
        try {
            setPending(true);
            const credential = await getPhoneCredential();
            await auth().currentUser.unlink(credential.providerId);
            await firestore()
                .collection('users')
                .doc(auth().currentUser.uid)
                .update({isPhoneNumberLinked: false});
            verificationIdRef.current = null;
            verificationCodeRef.current = null;
            setPending(false);
            Alert.alert('Phone number successfully removed');
        } catch (err) {
            console.log('ERROR: ', err);
            setPending(false);
            Alert.alert('Something went wrong. Please try again.');
        }
    }, [setPending]);

    return (
        <BottomSheet
            // windowScale={0.8}
            showToggle={showLinkPhoneNumber}
            toggleModalVisibility={toggleShowLinkPhoneNumber}>
            <View
                style={{
                    borderWidth: 0,
                    borderColor: 'orange',
                    padding: 10,
                    display: 'flex',
                }}>
                {hasLinkedPhoneNumber ? (
                    <View
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: 20,
                        }}>
                        <BaseText
                            style={{
                                fontSize: 18,
                            }}>
                            Linked number: {auth().currentUser.phoneNumber}{' '}
                        </BaseText>
                    </View>
                ) : (
                    <View
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: 20,
                        }}>
                        <BaseText
                            style={{
                                fontSize: 18,
                            }}>
                            Link new phone number
                        </BaseText>
                    </View>
                )}
                {pending ? (
                    <View style={{marginTop: 20}}>
                        <ActivityIndicator size="small" />
                    </View>
                ) : verifyingNumber ? (
                    <View>
                        {!verificationIdRef.current &&
                            !hasLinkedPhoneNumber && (
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
                                            marginBottom: 20,
                                        }}>
                                        <BaseText
                                            style={{
                                                fontSize: 24,
                                                marginRight: 5,
                                                marginTop: 5,
                                            }}>
                                            +
                                        </BaseText>
                                        <PhoneNumberInput
                                            onChangePhoneNumberCallback={
                                                setPhoneNum
                                            }
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={{marginBottom: 20}}
                                        onPress={() => {
                                            const fullPhoneNumber = `${phoneNumber}`;
                                            getVerificationCode(
                                                fullPhoneNumber,
                                            );
                                        }}>
                                        <BaseText
                                            style={{
                                                color: colors.actionText,
                                                fontSize: 18,
                                                fontFamily: fonts.bold,
                                                textAlign: 'center',
                                            }}>
                                            Submit
                                        </BaseText>
                                    </TouchableOpacity>
                                </View>
                            )}
                        {verificationIdRef.current && (
                            <View
                                style={{
                                    marginTop: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}>
                                <View
                                    style={{
                                        marginBottom: 20,
                                    }}>
                                    <BaseText style={{textAlign: 'center'}}>
                                        Please enter the six digit verification
                                        code we sent to{' '}
                                        {auth().currentUser?.phoneNumber ||
                                            `${phoneNumber}`}{' '}
                                        to continue
                                    </BaseText>
                                </View>
                                <TextInput
                                    placeholder="verification code"
                                    textContentType="oneTimeCode"
                                    keyboardAppearance="dark"
                                    keyboardType="phone-pad"
                                    maxLength={6}
                                    style={{
                                        width: 150,
                                        fontFamily: fonts.regular,
                                        fontSize: 18,
                                        color: colors.textBright,
                                        borderRadius: 8,
                                        backgroundColor:
                                            colors.lighterHighlight,
                                        padding: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 20,
                                    }}
                                    onChangeText={setVerCode}
                                />
                                <TouchableOpacity
                                    style={{marginBottom: 20}}
                                    onPress={
                                        hasLinkedPhoneNumber
                                            ? unlinkAccount
                                            : linkAccount
                                    }>
                                    <BaseText
                                        style={{
                                            color: colors.actionText,
                                            fontSize: 18,
                                            fontFamily: fonts.bold,
                                            textAlign: 'center',
                                        }}>
                                        Submit
                                    </BaseText>
                                </TouchableOpacity>
                            </View>
                        )}
                        {verificationIdRef.current && (
                            <TouchableOpacity onPress={resetState}>
                                <BaseText
                                    style={{
                                        color: colors.textFaded,
                                        fontSize: 18,
                                        textAlign: 'center',
                                    }}>
                                    Cancel
                                </BaseText>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View
                        style={{
                            marginTop: 20,
                            marginBottom: 5,
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                        <TouchableOpacity
                            style={{
                                borderRadius: 8,
                                backgroundColor: colors.paleBackground,
                                padding: 10,
                                marginStart: 40,
                                marginEnd: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onPress={() =>
                                getVerificationCode(
                                    auth().currentUser.phoneNumber,
                                )
                            }>
                            <BaseText
                                style={{
                                    color: colors.actionText,
                                    fontSize: 18,
                                    fontFamily: fonts.bold,
                                }}>
                                Remove number
                            </BaseText>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </BottomSheet>
    );
}
