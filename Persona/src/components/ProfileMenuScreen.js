import React, {useContext, useState} from 'react';
import fonts from 'resources/fonts';
import {BASE_API_URL} from '../../config/urls';
const SERVER_URL = BASE_API_URL;
import {
    StripeProvider,
    collectBankAccountToken,
} from '@stripe/stripe-react-native';
import {useNavigation} from '@react-navigation/native';
import baseText from 'resources/text';
import {
    Keyboard,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    View,
    Text,
    Dimensions,
    Switch,
} from 'react-native';
import {quotes} from 'components/Loading';
import {PERSONA_VERSION_TEXT} from 'config/version';
import colors from 'resources/colors';
import images from 'resources/images';
import palette from 'resources/palette';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {clog, cerror} from 'utils/log';
import {GlobalStateContext} from 'state/GlobalState';
import messaging from '@react-native-firebase/messaging';
import Icon from 'react-native-vector-icons/Feather';
import FastImage from 'react-native-fast-image';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import getResizedImageUrl from 'utils/media/resize';
import {ConnectionContext} from 'state/ConnectionState';
import LinkPhoneNumberModal from './LinkPhoneNumberModal';
import {Alert} from 'react-native';

const CUSTOM_LOG_WARN_HEADER = '!! components/ProfileMenuScreen';
const log = (...args) =>
    global.LOG_DEBUG && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);

export default function ProfileMenuScreen() {
    const {
        user: {
            id: userID,
            hideDMSeenIndicators,
            disableInAppNotifications,
            enableExtraLiveNotifications,
            chatMessageNotificationsOn,
        },
        useNativeModuleChat,
    } = useContext(GlobalStateContext);
    const hasLinkedPhoneNumber = auth().currentUser.phoneNumber;
    return React.useMemo(
        () => (
            <ProfileMenuScreenWrapped
                userID={userID}
                isPhoneNumberLinked={hasLinkedPhoneNumber}
                hideDMSeenIndicators={hideDMSeenIndicators}
                disableInAppNotifications={disableInAppNotifications}
                enableExtraLiveNotifications={enableExtraLiveNotifications}
                useNativeModuleChat={useNativeModuleChat}
                chatMessageNotificationsOn={chatMessageNotificationsOn}
            />
        ),
        [
            hideDMSeenIndicators,
            disableInAppNotifications,
            enableExtraLiveNotifications,
            userID,
            hasLinkedPhoneNumber,
            useNativeModuleChat,
            chatMessageNotificationsOn,
        ],
    );
}

function ProfileMenuScreenWrapped({
    userID,
    hideDMSeenIndicators,
    isPhoneNumberLinked,
    useNativeModuleChat,
    chatMessageNotificationsOn,
}) {
    const {
        current: {csetState, userMap},
    } = useContext(GlobalStateRefContext);

    const {cleanupPresence} = useContext(ConnectionContext);

    const [showLinkPhoneNumber, setShowLinkPhoneNumber] = useState(false);
    const [phoneNumberLinked, setPhoneNumberLinked] = useState(true);
    const [showReportContent, setShowReportContent] = React.useState(false);
    const toggleShowReportContent = () => {
        setShowReportContent(!showReportContent);
    };

    console.log('chatMessageNotificationsOn', chatMessageNotificationsOn);

    React.useEffect(() => {
        const fetchData = async () => {
            const externalAccountsRef = await firestore()
                .collection('users')
                .doc(userID)
                .get();
            const isPhoneNumberLinked = await externalAccountsRef.data()
                .isPhoneNumberLinked;
            setPhoneNumberLinked(isPhoneNumberLinked);
        };
        fetchData();
    }, []);
    const logout = async () => {
        let deviceToken = '';
        // ORDER OF EVENTS MATTERS FOR THE LOVE OF GOD, THE GOATS MOTHER AND THE
        // NUMBER 22 DONT U DARE CHANGE THE ORDER WITHOUT KNOWING WUT U R DOIN

        csetState({
            busyAuthStateChange: false,
            personasInit: true,
            userInit: true,
        });

        try {
            deviceToken = await messaging().getToken();
        } catch (err) {
            error('Can not get device token: ', err.toString());
        }

        if (deviceToken.length) {
            try {
                // Important: These two actions have to occur before sign out
                // or else we end up with zombie data

                console.log('Device token: ', deviceToken);

                await firestore()
                    .collection('users')
                    .doc(userID)
                    .collection('tokens')
                    .doc(userID)
                    .update({
                        deviceTokens:
                            firestore.FieldValue.arrayRemove(deviceToken),
                    });
                await cleanupPresence();
            } catch (err) {
                error('Data cleanup failed: ', err.toString());
                alert('Data cleanup failed: ' + err.toString());
                throw new Error(err);
            }
        }

        try {
            await auth().signOut();
        } catch (err) {
            error('Sign out failed: ', err.toString());
            alert('Sign out failed: ' + err.toString());
            throw new Error(err);
        }
    };

    const toggleHideDMSeenIndicators = () => {
        firestore()
            .collection('users')
            .doc(userID)
            .set({hideDMSeenIndicators: !hideDMSeenIndicators}, {merge: true});
    };

    const toggleChatMessageNotificationsOn = () => {
        if (chatMessageNotificationsOn === undefined) {
            chatMessageNotificationsOn = true;
        }
        firestore()
            .collection('users')
            .doc(userID)
            .set(
                {chatMessageNotificationsOn: !chatMessageNotificationsOn},
                {merge: true},
            );
    };

    const toggleNativeChatState = value => {
        //useNativeModuleChat 🎛️

        if (useNativeModuleChat) {
            csetState({
                useNativeModuleChat: false,
            });
        } else {
            Alert.alert(
                `Enable ${
                    Platform.OS === 'ios' ? 'iOS' : 'Android'
                } Native Chat?`,
                `The ${
                    Platform.OS === 'ios' ? 'iOS' : 'Android'
                } native chat module is being worked on, and many features are still WIP.\n\nFor example (as if Feb 22, 2023), you are able to display most messages (except for posts), but only able to send messages and replies to messages. Some items like user images and usernames are also missing. \n\nPlease only turn on if you are sure.`,
                [
                    {
                        text: 'Cancel 😮‍💨',
                        style: 'cancel',
                    },
                    {
                        text: 'Proceed 🫡',
                        onPress: () => {
                            csetState({
                                useNativeModuleChat: true,
                            });
                        },
                    },
                ],
                {cancelable: false},
            );
        }
    };

    const navigation = useNavigation();
    const navToTerms = () => {
        navigation?.navigate('Terms');
    };

    const toggleShowLinkPhoneNumber = () => {
        setShowLinkPhoneNumber(!showLinkPhoneNumber);
    };

    /*const {
        state: {personaIdsMuted, userIdsMuted},
    } = React.useContext(FeedPersistStateContext);*/

    /*const personasMuted = Object.entries(personaIdsMuted)
        .filter(([k, muted]) => muted)
        .map(([k]) => k);*/

    /*const usersMuted = Object.entries(userIdsMuted)
        .filter(([k, muted]) => muted)
        .map(([k]) => k);*/

    const [externalAccounts, setExternalAccounts] = React.useState([]);

    const user = userMap[auth().currentUser.uid];

    const sendTransfer = async stripeAccount => {
        const transferResponse = await fetch(`${SERVER_URL}/stripe/transfers`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${await auth().currentUser.getIdToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount_cents: 1000,
            }),
        });
    };
    React.useEffect(() => {
        const fetchData = async () => {
            const externalAccountsRef = await firestore()
                .collection('users')
                .doc(user.id)
                .collection('stripeExternalAccounts')
                .get();
            const externalAccounts = [];
            externalAccountsRef.forEach(accountRef => {
                const stripeAccount = accountRef.data();
                externalAccounts.push(
                    <TouchableOpacity
                        onPress={sendTransfer.bind(this, stripeAccount)}
                        style={{
                            flex: 0.6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderRadius: 16,
                            borderColor: colors.timeline,
                            borderWidth: 0.4,
                            zIndex: 999000000009999999,
                            elevation: 999000000009999999,
                            borderRadius: 19,
                            padding: 6.5,
                            borderWidth: 0.5,
                            borderColor: colors.maxFaded,
                            backgroundColor: null,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Text
                            style={{
                                marginTop: 0,
                                fontSize: 11,
                                marginBottom: 0,
                                fontFamily: fonts.regular,
                                color: 'magenta',
                            }}>
                            Transfer $10 to {stripeAccount.bank_name} ending in{' '}
                            {stripeAccount.last4}
                        </Text>
                    </TouchableOpacity>,
                );
            });
            setExternalAccounts(externalAccounts);
        };
        fetchData();
    }, [user.id]);

    const verifyCustomer = async () => {
        const accountLinksResponse = await fetch(
            `${SERVER_URL}/stripe/account_links`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${await auth().currentUser.getIdToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            },
        );

        const accountLink = await accountLinksResponse.json();

        console.log('showing webview', accountLink.data.url);
        Linking.openURL(accountLink.data.url);
    };

    const linkBankAccount = async () => {
        console.log('called linkBankAccount');

        const financialConnectionSessionResponse = await fetch(
            `${SERVER_URL}/stripe/financial_connections/sessions`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${await auth().currentUser.getIdToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            },
        );

        const financialConnectionSession =
            await financialConnectionSessionResponse.json();
        console.log('finished financialConnectionSession');

        const {token, err} = await collectBankAccountToken(
            financialConnectionSession.data.stripe_session_client_secret,
        );
        console.log(`finished financialConnectionSession->(${token},${err})`);

        if (err) {
            console.log(`err code: ${err.code}`, err.message);
            // Add alerting here
            return;
        }

        if (!token) {
            return;
        }

        const externalAccountResponse = await fetch(
            `${SERVER_URL}/stripe/external_accounts`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${await auth().currentUser.getIdToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stripe_bank_account_token: token.id,
                }),
            },
        );
    };

    return (
        <>
            <ScrollView>
                <View style={palette.container.center}>
                    <View style={{marginBottom: 30, marginTop: 20}}>
                        <Text style={{...palette.text, fontWeight: 'bold'}}>
                            {PERSONA_VERSION_TEXT}
                        </Text>
                    </View>

                    {
                        <StripeProvider publishableKey="pk_test_51LrqgNFexCEmpnpDwCdLGVv4Bdid7rBFhVYBBStId7tZtmprySCBZaliB9kocKyJmU9ok0HQyJnwcZy1bKJ8zF7K00mbGm4Mjg">
                            <TouchableOpacity
                                onPress={linkBankAccount}
                                style={{
                                    width: '50%',
                                    marginBottom: 15,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    padding: 10,
                                    borderColor: colors.faded,
                                }}>
                                <Text
                                    style={{
                                        ...palette.text,
                                        textAlign: 'center',
                                    }}>
                                    Add Bank Account
                                </Text>
                            </TouchableOpacity>
                        </StripeProvider>
                    }
                    {
                        <View
                            style={{
                                height: 70,
                                borderRadius: 10,
                                padding: 10,
                            }}>
                            {externalAccounts}
                        </View>
                    }
                    <View>
                        <TouchableOpacity
                            style={{
                                marginBottom: 15,
                                borderRadius: 10,
                                borderWidth: 1,
                                padding: 10,
                                borderColor: colors.faded,
                            }}
                            onPress={toggleShowLinkPhoneNumber}>
                            <Text style={palette.text}>
                                {phoneNumberLinked
                                    ? 'Unlink Phone Number'
                                    : 'Link Phone Number'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                marginBottom: 15,
                                borderRadius: 10,
                                borderWidth: 1,
                                padding: 10,
                                borderColor: colors.faded,
                            }}
                            onPress={logout}>
                            <Text
                                style={{...palette.text, textAlign: 'center'}}>
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <LinkPhoneNumberModal
                        showLinkPhoneNumber={showLinkPhoneNumber}
                        toggleShowLinkPhoneNumber={toggleShowLinkPhoneNumber}
                        hasLinkedPhoneNumber={
                            phoneNumberLinked
                                ? auth().currentUser.phoneNumber
                                : null
                        }
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            paddingBottom: 20,
                            paddingTop: 20,
                            paddingLeft: 20,
                            paddingRight: 20,
                        }}>
                        <View style={{flex: 1, flexDirection: 'column'}}>
                            <Text
                                style={{
                                    ...baseText,
                                    color: 'white',
                                    marginTop: 6,
                                    marginBottom: 4,
                                    fontWeight: 'bold',
                                    marginRight: 10,
                                }}>
                                Notifications
                            </Text>
                            <Text
                                style={{
                                    ...baseText,
                                    color: 'white',
                                    fontSize: 12,
                                }}>
                                If you disable notifications, you will not
                                receive notifications for chat messages. You
                                will still receive notifications for posts,
                                transfers, deposits, mentions & DMs
                            </Text>
                        </View>
                        <View style={{alignSelf: 'center'}}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    chatMessageNotificationsOn
                                        ? '#f5dd4b'
                                        : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={
                                    chatMessageNotificationsOn ||
                                    chatMessageNotificationsOn === undefined
                                }
                                onValueChange={toggleChatMessageNotificationsOn}
                                style={{
                                    transform: [{scaleX: 0.7}, {scaleY: 0.7}],
                                }}
                            />
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            paddingBottom: 20,
                            paddingTop: 20,
                            paddingLeft: 20,
                            paddingRight: 20,
                        }}>
                        <View style={{flex: 1, flexDirection: 'column'}}>
                            <Text
                                style={{
                                    ...baseText,
                                    color: 'white',
                                    marginTop: 6,
                                    marginBottom: 4,
                                    fontWeight: 'bold',
                                    marginRight: 10,
                                }}>
                                DM read receipts
                            </Text>
                            <Text
                                style={{
                                    ...baseText,
                                    color: 'white',
                                    fontSize: 12,
                                }}>
                                If read receipts are disabled for DMs, you won't
                                be able to see read receipts from others in DMs.
                            </Text>
                        </View>
                        <View style={{alignSelf: 'center'}}>
                            z trackColor={{false: '#767577', true: '#81b0ff'}}
                            thumbColor=
                            {!hideDMSeenIndicators ? '#f5dd4b' : '#f4f3f4'}
                            ios_backgroundColor="#3e3e3e" value=
                            {!hideDMSeenIndicators}
                            onValueChange={toggleHideDMSeenIndicators}
                            style={{transform: [{scaleX: 0.7}, {scaleY: 0.7}]}}
                            />
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            paddingBottom: 20,
                            paddingTop: 20,
                            paddingLeft: 20,
                            paddingRight: 20,
                            borderWidth: 0,
                            borderColor: 'red',
                        }}>
                        <View style={{flex: 1, flexDirection: 'column'}}>
                            <Text
                                style={{
                                    ...baseText,
                                    color: 'white',
                                    marginTop: 6,
                                    marginBottom: 4,
                                    fontWeight: 'bold',
                                    marginRight: 10,
                                }}>
                                {Platform.OS === 'ios'
                                    ? `iOS native chat module 😩 `
                                    : `Android native chat module 😩 `}
                            </Text>
                            <Text
                                style={{
                                    ...baseText,
                                    color: 'white',
                                    fontSize: 12,
                                }}>
                                Work in progress. Not feature complete. Be
                                careful when selecting this option
                            </Text>
                        </View>
                        <View style={{alignSelf: 'center'}}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    !useNativeModuleChat ? '#f5dd4b' : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={useNativeModuleChat}
                                onValueChange={toggleNativeChatState}
                                style={{
                                    transform: [{scaleX: 0.7}, {scaleY: 0.7}],
                                }}
                            />
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            paddingBottom: 10,
                            paddingTop: 10,
                            paddingLeft: 20,
                            paddingRight: 20,
                        }}
                    />

                    <View style={{marginTop: 15}}>
                        <TouchableOpacity
                            style={{
                                ...Styles.navTouchSurfaceCenter,
                                width: 200,
                                height: 50,
                                borderColor: colors.timestamp,
                                borderWidth: 2,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onPress={navToTerms}>
                            <Text style={palette.text}>
                                View Terms of Service
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{marginTop: 15}}>
                        <TouchableOpacity
                            style={{
                                ...Styles.navTouchSurfaceCenter,
                                width: 200,
                                height: 50,
                                borderColor: colors.timestamp,
                                borderWidth: 2,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onPress={toggleShowReportContent}>
                            <Text style={palette.text}>
                                {showReportContent
                                    ? 'Hide Report Content'
                                    : 'Report Content'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            height: showReportContent ? 40 : 0,
                            marginTop: 20,
                        }}>
                        {showReportContent && <ReportContentBox />}
                    </View>
                </View>
            </ScrollView>
        </>
    );
}

const license = `PersonaAlpha App End User License Agreement (EULA)

This End User License Agreement (“Agreement”, "EULA") is between you and PersonaAlpha and governs use of this app made available through TestFlight app distribution. By installing PersonaAlpha App, you agree to be bound by this Agreement and understand that there is no tolerance for Objectional Content (see section 5. below) uploaded to the Persona platform via the PersonaAlpha app, or by any other means. If you do not agree with the terms and conditions of this Agreement, you are not entitled to use the PersonaAlpha App.

In order to ensure PersonaAlpha provides the best experience possible for everyone, we strongly enforce a no tolerance policy for objectionable content. If you see inappropriate content, please use the "Report Content feature" in the profile section of the app.

1. Parties

This Agreement is between you and PersonaAlpha only, and not ${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
}, Inc. (“${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
}”). Notwithstanding the foregoing, you acknowledge that ${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
} and its subsidiaries are third party beneficiaries of this Agreement and ${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
} has the right to enforce this Agreement against you. PersonaAlpha, not ${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
}, is solely responsible for the PersonaAlpha App and its content.

2. Privacy

PersonaAlpha may collect and use information about your usage of the PersonaAlpha App, including certain types of information from and about your device. PersonaAlpha may use this information, as long as it is in a form that does not personally identify you, to measure the use and performance of the PersonaAlpha App as per the needs of the design and development of the Persona app and platform.

3. Limited License

PersonaAlpha grants you a limited, non-exclusive, non-transferable, revocable license to use thePersonaAlpha App for your personal, non-commercial purposes. You may only use the PersonaAlpha App on ${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
} devices that you own or control and as permitted by the App Store Terms of Service.

4. Age Restrictions

By using the PersonaAlpha App, you represent and warrant that (a) you are 19 years of age or older and you agree to be bound by this Agreement; (b) if you are under 19 years of age, you have obtained verifiable consent from a parent or legal guardian; and (c) your use of the PersonaAlpha App does not violate any applicable law or regulation. Your access to the PersonaAlpha App may be terminated without warning if PersonaAlpha believes, in its sole discretion, that you are under the age of 19 years and have not obtained verifiable consent from a parent or legal guardian. If you are a parent or legal guardian and you provide your consent to your child's use of the PersonaAlpha App, you agree to be bound by this Agreement in respect to your child's use of the PersonaAlpha App.

5. Objectionable Content Policy

Content may not be submitted to PersonaAlpha, who will moderate all content and ultimately decide whether or not to post a submission to the extent such content includes, is in conjunction with, aids or abets, or is alongside any Objectionable Content. Objectionable Content includes, but is not limited to: (i) sexually explicit materials; (ii) obscene, defamatory, libelous, slanderous, violent and/or unlawful content or profanity; (iii) content that infringes upon the rights of any third party, including copyright, trademark, privacy, publicity or other personal or proprietary right, or that is deceptive or fraudulent; (iv) content that promotes the use or sale of illegal or regulated substances, tobacco products, ammunition and/or firearms; and (v) gambling, including without limitation, any online casino, sports books, bingo or poker.

6. Warranty

PersonaAlpha disclaims all warranties about the PersonaAlpha App to the fullest extent permitted by law. To the extent any warranty exists under law that cannot be disclaimed, PersonaAlpha, not ${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
}, shall be solely responsible for such warranty.

7. Maintenance and Support

PersonaAlpha does provide minimal maintenance or support for it at the sole discretion determined by PersonaAlpha; to the extent that any maintenance or support is required by applicable law, PersonaAlpha, not ${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
}, shall be obligated to furnish any such maintenance or support.

8. Product Claims

PersonaAlpha, not ${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
}, is responsible for addressing any claims by you relating to the PersonaAlpha App or use of it, including, but not limited to: (i) any product liability claim; (ii) any claim that the PersonaAlpha App fails to conform to any applicable legal or regulatory requirement; and (iii) any claim arising under consumer protection or similar legislation. Nothing in this Agreement shall be deemed an admission that you may have such claims.

9. Third Party Intellectual Property Claims

PersonaAlpha shall not be obligated to indemnify or defend you with respect to any third party claim arising out or relating to the PersonaAlpha App. To the extent PersonaAlpha is required to provide indemnification by applicable law, PersonaAlpha, not ${
    Platform.OS === 'ios' ? 'Apple' : 'Google'
}, shall be solely responsible for the investigation, defense, settlement and discharge of any claim that the PersonaAlpha App or your use of it infringes any third party intellectual property right.

By signing up for an account on Persona you agree to the above terms of service.`;
export function TermsOfServiceScreen() {
    return (
        <ScrollView
            contentContainerStyle={{
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <Text
                style={{
                    ...baseText,
                    color: colors.text,
                    marginStart: 40,
                    marginEnd: 40,
                    marginTop: 50,
                    marginBottom: 100,
                }}>
                {license}
            </Text>
        </ScrollView>
    );
}

export function ReportContentBox({onComplete}) {
    const userContext = React.useContext(GlobalStateContext);
    const [newReport, setNewReport] = React.useState('');
    const submitReport = () => {
        log('submitting report', newReport);

        const reportsRef = firestore().collection('reports');

        reportsRef
            .add({
                userID: auth().currentUser.uid,
                timestamp: firestore.Timestamp.now(),
                report: newReport,
                title: 'ProfileMenuScreen Report',
            })
            .then(() => {
                setNewReport('');
                Keyboard.dismiss();
                alert(
                    "Report sent! We'll follow up with you by contacting you directly!",
                );

                if (onComplete) {
                    onComplete();
                }
            });
    };

    return (
        <>
            <Text
                style={{
                    ...baseText,
                    color: colors.text,
                    paddingHorizontal: 20,
                    marginTop: 20,
                    marginBottom: 20,
                }}>
                Please describe to us the content you find concerning.
            </Text>
            <View style={Styles.reportContentContainer}>
                <Text
                    style={{
                        ...baseText,
                        color: colors.text,
                        fontWeight: 'bold',
                    }}>
                    {' '}
                </Text>
                <FastImage
                    source={{
                        uri: getResizedImageUrl({
                            origUrl:
                                userContext.user.profileImgUrl ||
                                images.personaDefaultProfileUrl,
                            height: Styles.personImage.height,
                            width: Styles.personImage.width,
                        }),
                    }}
                    style={Styles.personImage}
                />
                <TextInput
                    multiline={true}
                    style={Styles.textInput}
                    placeholder={'Post a report on content...'}
                    placeholderTextColor={colors.textFaded2}
                    editable={true}
                    clearTextOnFocus={false}
                    onChangeText={setNewReport}
                    spellCheck={true}
                    value={newReport}
                    keyboardAppearance="dark"
                    maxLength={300}
                />
                <TouchableOpacity
                    style={Styles.postAction}
                    onPress={submitReport}
                    disabled={!newReport}>
                    <View style={Styles.sendIcon}>
                        <Icon name="send" size={24} color={colors.actionText} />
                    </View>
                </TouchableOpacity>
            </View>
        </>
    );
}

const Styles = StyleSheet.create({
    loadingText: {
        color: colors.text,
        marginTop: 60,
    },
    reportContentContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 0,
        paddingTop: 10,
        paddingLeft: 15,
        paddingBottom: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: colors.seperatorLineColor,
        borderBottomColor: colors.seperatorLineColor,
    },
    textInput: {
        ...baseText,
        color: 'white',
        fontSize: 14,
        marginLeft: 10,
        flex: 12,
        backgroundColor: colors.seperatorLineColor,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 8,
        borderRadius: 5,
    },
    personImage: {
        width: 30,
        height: 30,
        borderRadius: 30,
    },
    sendIcon: {
        marginLeft: 10,
        marginRight: 15,
    },
});
