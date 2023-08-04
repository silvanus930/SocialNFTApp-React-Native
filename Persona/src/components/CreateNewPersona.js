import React, {useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {Layout} from 'react-native-reanimated';

import {BASE_API_URL} from '../../config/urls';

import {CommunityStateContext} from 'state/CommunityState';
import {vanillaPersona} from 'state/PersonaState';

import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {GlobalStateContext} from 'state/GlobalState';
import {useNavToPersona} from 'hooks/navigationHooks';
import {determineUserRights, selectLayout} from 'utils/helpers';
import {ADMIN_ROLE} from 'utils/constants';

const options = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function CreateNewPersona({closeLeftDrawer, navigation}) {
    const personaStateRefContext = React.useContext(PersonaStateRefContext);
    let csetState = personaStateRefContext.current.csetState;

    const communityContext = React.useContext(CommunityStateContext);
    let communityID = communityContext.currentCommunity;
    const {user} = useContext(GlobalStateContext);

    // creating channels only checks community role/rights
    const hasAuth = determineUserRights(
        communityID,
        null,
        user,
        'createChannel',
    );

    const navToPersona = useNavToPersona(navigation);

    const onPress = React.useCallback(async () => {
        ReactNativeHapticFeedback.trigger('impactLight', options);
        let timestamp = firestore.Timestamp.now();
        const newPersona = {
            ...vanillaPersona,
            authors: [auth().currentUser.uid],
            editDate: timestamp,
            publishDate: timestamp,
            communityID: communityID,
            cacheDate: timestamp,
            name: 'Unnamed Channel',
            userRoles: {
                admin: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
            },
        };
        const newPersonaRef = await firestore()
            .collection('personas')
            .add(newPersona);

        const doStuff = async () => {
            const token = await auth().currentUser.getIdToken(true);

            const options = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    personaid: newPersonaRef.id,
                    userid: '0',
                }),
            };

            let URL = `${BASE_API_URL}/ensurewallet/${newPersonaRef.id}/0`;
            const response = await fetch(URL, options);
            let json = await response?.json();
        };
        doStuff();

        const doStuffB = async () => {
            const token = await auth().currentUser.getIdToken(true);

            let id = newPersonaRef.id;

            let params = JSON.stringify({
                personaid: id,
            });

            const options = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: params,
            };

            let server = 'api.persona.nyc';
            //let server = 'localhost:8080';
            let URL = `https://${server}/ensureAccessContract/${id}`;
            const response = await fetch(URL, options);
            let json = await response?.json();
        };

        doStuffB();

        const setupUserRoleForCreator = async () => {
            const userRef = firestore()
                .collection('users')
                .doc(auth().currentUser.uid);

            // Add roles to user
            userRef
                .update({
                    roles: firestore.FieldValue.arrayUnion({
                        ref: newPersonaRef,
                        ...ADMIN_ROLE,
                    }),
                })
                .then(() => {})
                .catch(error => {
                    console.log('not updated, error: ', error);
                });
        };

        setupUserRoleForCreator();

        firestore()
            .collection('communities')
            .doc(communityID)
            .set(
                {projects: firestore.FieldValue.arrayUnion(newPersonaRef.id)},
                {merge: true},
            );
        closeLeftDrawer();
        navToPersona(newPersonaRef.id);
        const myUserID = auth().currentUser?.uid;
        firestore()
            .collection('users')
            .doc(myUserID)
            .collection('live')
            .doc('unnamedCounters')
            .set({personas: firestore.FieldValue.increment(1)}, {merge: true});
    }, [closeLeftDrawer, communityID, csetState, navToPersona, navigation]);

    return (
        <>
            {hasAuth && (
                <AnimatedTouchable
                    layout={selectLayout(Layout)}
                    onPress={onPress}
                    style={[
                        {
                            borderWidth: 1,
                            borderRadius: 6,
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            margin: 10,
                            alignItems: 'center',
                            padding: 7,
                        },
                    ]}>
                    <Animated.Text
                        layout={selectLayout(Layout)}
                        style={{
                            color: 'white',
                            fontWeight: '500',
                            fontSize: 14,
                        }}>
                        + Add new channel
                    </Animated.Text>
                </AnimatedTouchable>
            )}
        </>
    );
}
