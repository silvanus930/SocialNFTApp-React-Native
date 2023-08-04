import React, {useState, useEffect, useContext, useRef} from 'react';
import {Platform, Alert} from 'react-native';

import {TermsAndConditionModal} from 'components/TermsAndConditionModal';
import SignUpForm from 'components/SignUpForm';
import LoginWithEmailForm from 'components/LoginWithEmailForm';
import LoginOrSignUpForm from 'components/LoginOrSignUpForm';
import Loading from 'components/Loading';
import InitUserState from './InitUserState';
import {GlobalStateContext} from 'state/GlobalState';

//Firesbase
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
    firebase,
    FirebaseDynamicLinksTypes,
} from '@react-native-firebase/dynamic-links';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import functions from '@react-native-firebase/functions';

import {getServerTimestamp} from 'actions/constants';
import requestPermissions, {checkAllPermissions} from 'utils/permissions';
import {PERSONA_VERSION_TEXT} from 'config/version';

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useCustomTheme} from 'hooks';
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const {colors, fonts} = useCustomTheme();
    const context = useContext(GlobalStateContext) as any;
    const userSnapRef = useRef<(() => void) | null>(null);
    const [showUserSignUpForm, setShowUserSignUpForm] = useState(false);
    const [showTermsandConditionModal, setShowTermsandConditionModal] =
        useState(false);
    const [inviteCode, setInviteCode] = useState('');

    const onUserSnap = (userSnapshot: any) => {
        if (auth().currentUser?.uid && userSnapshot.exists) {
            const userSnapshotData = userSnapshot.data();
            context.csetState({
                userInit: false,
                busyAuthStateChange: false,
                user: {...context.user, ...userSnapshotData},
            });
        }
    };

    const resetUserState = async () => {
        try {
            await auth().signOut();
        } catch (err: any) {
            if (err.code !== 'auth/no-current-user') {
                Alert.alert(err);
            }
        }
    };

    const objectMap = (obj: any, fn: Function) => {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]),
        );
    };

    const initUserState = async ({userDocument}: {userDocument: any}) => {
        const userData = userDocument.data();

        firestore()
            .collection('communities')
            .doc('persona')
            .set(
                {members: firestore.FieldValue.arrayUnion(userDocument.id)},
                {merge: true},
            );
        const authStamp = {
            authTimestamp: getServerTimestamp(),
            version: PERSONA_VERSION_TEXT,
            platform: Platform.OS.toString(),
        };
        const userProperties = {
            platform: Platform.OS.toString(),
            name: userData?.userName,
            email: userData?.email,
        };

        context.setUser({...userData, uid: userDocument.id});

        checkAllPermissions();
        requestPermissions();

        // work around for now until we completely refactor this file
        const unsubscribe = firestore()
            .collection('users')
            .doc(userDocument.id)
            .onSnapshot(onUserSnap, err => {
                console.log(err);
            });
        userSnapRef.current = unsubscribe;

        if (!userData.readTerms) {
            setShowTermsandConditionModal(true);
        }
        setShowUserSignUpForm(false);
    };

    const updateState = () => {
        return auth().onAuthStateChanged(async user => {
            try {
                if (user && user?.uid && auth()?.currentUser?.uid) {
                    context.setBusyAuthStateChange(true);
                    firestore()
                        .collection('users')
                        .doc(user.uid)
                        .get()
                        .then(userDocument => {
                            if (userDocument?.exists) {
                                initUserState({userDocument});
                            } else {
                                context.setBusyAuthStateChange(false);
                                setShowUserSignUpForm(true);
                            }
                        })
                        .catch(err => {
                            throw new Error(JSON.stringify(err));
                        });
                } else {
                    context.setBusyAuthStateChange(false);
                }
            } catch (e) {
                Alert.alert(
                    'Something went wrong signing in. Please try again.',
                );
                context.setBusyAuthStateChange(false);
                await auth().signOut();
            }
        });
    };

    const onAgree = async () => {
        await firestore()
            .collection('users')
            .doc(auth()?.currentUser?.uid)
            .set({readTerms: true}, {merge: true});
        setShowTermsandConditionModal(false);
    };

    const handleDynamicLinkBackground = async () => {
        try {
            const link = await firebase.dynamicLinks().getInitialLink();
            if (link && link.url) {
                console.log('Initial link:', link.url);
                const codeInvite = link.url.match(/inviteCode=([^&]*)/);
                if (codeInvite && codeInvite.length > 1) {
                    setInviteCode(codeInvite[1]);
                    addDestinationsToUser(codeInvite[1]);
                }
            } else {
                console.log('url is undefined');
            }
        } catch (error) {
            console.log('handleDynamicLinkBackground error: ', error);
        }
    };

    const handleDynamicLinkForeground = (link: any) => {
        console.log('Handling dynamic link:', link);

        if (link && link.url) {
            const codeInvite = link.url.match(/inviteCode=([^&]*)/);
            if (codeInvite && codeInvite.length > 1) {
                setInviteCode(codeInvite[1]);
                addDestinationsToUser(codeInvite[1]);
            }
        }
    };

    const addDestinationsToUser = async (inviteCode: string) => {
        try {
            let currentUserId = auth()?.currentUser?.uid;
            if (currentUserId) {
                let userSnapshot = await firestore()
                    .collection('users')
                    .doc(currentUserId)
                    .get();
                if (userSnapshot.exists) {
                    if (inviteCode) {
                        const addAccessToExistingUser =
                            functions().httpsCallable(
                                'addAccessToExistingUser',
                            );
                        const result = await addAccessToExistingUser({
                            userID: auth().currentUser?.uid,
                            inviteCode,
                        });
                        const resultCode = result?.data?.result;

                        switch (resultCode) {
                            case 'success':
                                console.log('user got access to new channel');
                                break;

                            default:
                                console.log(
                                    'Error: Something went wrong with adding permissions - code:',
                                );
                                console.log(resultCode);
                                break;
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        const unsubscribeAuthListener = updateState();

        handleDynamicLinkBackground();

        const unsubscribeDynamicLinks = dynamicLinks().onLink(
            (link: FirebaseDynamicLinksTypes.DynamicLink) => {
                handleDynamicLinkForeground(link);
            },
        );

        return () => {
            if (unsubscribeDynamicLinks) {
                unsubscribeDynamicLinks();
            }
            if (unsubscribeAuthListener) {
                unsubscribeAuthListener();
            }
            if (userSnapRef.current) {
                userSnapRef.current();
                userSnapRef.current = null;
            }
        };
    }, []);

    const isLoading = context.busyAuthStateChange;
    const isTermsModal =
        !isLoading && !context.userInit && showTermsandConditionModal;
    const isInitUserState =
        !isLoading && !context.userInit && !showTermsandConditionModal;
    const isNavigator = !isLoading && context.userInit;

    return (
        <>
            {isLoading && <Loading />}
            {isTermsModal && <TermsAndConditionModal onAgree={onAgree} />}
            {isInitUserState && <InitUserState />}
            {isNavigator && (
                <Stack.Navigator
                    screenOptions={{
                        cardStyle: {backgroundColor: colors.mediaPostBackground},
                    }}>
                    <Stack.Screen
                        name="LoginOrSignUpForm"
                        options={{
                            headerStyle: {
                                backgroundColor: colors.mediaPostBackground,
                            },
                            headerTintColor: '#fff',
                            headerTransparent: true,
                            title: '',
                            headerShown: false,
                        }}>
                        {props =>
                            showUserSignUpForm ? (
                                <SignUpForm
                                    initUserState={initUserState}
                                    resetUserState={resetUserState}
                                    inviteCodeFromLink={inviteCode}
                                    {...props}
                                />
                            ) : (
                                <LoginOrSignUpForm {...props} />
                            )
                        }
                    </Stack.Screen>
                    <Stack.Screen
                        name="LoginWithEmail"
                        options={{
                            headerStyle: {
                                headerShown: false,
                                backgroundColor: colors.mediaPostBackground,
                            },
                            headerTintColor: '#fff',
                            headerTransparent: true,
                            title: '',
                        }}>
                        {props => <LoginWithEmailForm {...props} />}
                    </Stack.Screen>
                </Stack.Navigator>
            )}
        </>
    );
};

export default AppNavigator;
