import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React from 'react';
import {BASE_API_URL} from '../../config/urls';
import {CommunityStateContext} from 'state/CommunityState';
import {vanillaPersona} from 'state/PersonaState';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {POST_TYPE_ARTIST, vanillaPost} from 'state/PostState';

export default function useCreateChild({persona, closeLeftDrawer, navigation}) {
    const {
        current: {csetState},
    } = React.useContext(PersonaStateRefContext);
    const communityContext = React.useContext(CommunityStateContext);
    let communityID = communityContext.currentCommunity;

    const createChildPersona = React.useCallback(async () => {
        const createdAdate = new Date();
        const createdAdateString = createdAdate.toLocaleDateString('en-US');
        let createdAhours = createdAdate.getHours();
        let createdAminutes = createdAdate.getMinutes();
        const createdAampm = createdAhours >= 12 ? 'pm' : 'am';
        createdAhours = createdAhours % 12;
        createdAhours = createdAhours ? createdAhours : 12; // the hour '0' should be '12'
        createdAminutes =
            createdAminutes < 10 ? '0' + createdAminutes : createdAminutes;
        const createdAtimeStr =
            createdAhours + ':' + createdAminutes + ' ' + createdAampm;

        let timestamp = firestore.Timestamp.now();
        const newPersona = {
            ...vanillaPersona,
            isSubPersona: true,
            private: persona?.private || false, // this does not strictly need to be inherited
            anonymous: persona?.anonymous || false, // THIS MUST be inherited otherwise an artist post can expose the creating author briefly
            parentPersonaID: persona?.pid,
            authors: [auth().currentUser.uid],
            editDate: timestamp,
            publishDate: timestamp,
            cacheDate: timestamp,
            name: 'Unnamed Persona',
        };
        let subPersonaIDRef = await firestore()
            .collection('personas')
            .add(newPersona);
        const newPersonaPost = {
            ...vanillaPost,
            published: false,
            anonymous: persona?.anonymous || false, // THIS MUST be inherited otherwise an artist post can expose the creating author briefly
            subPersonaID: subPersonaIDRef.id,
            editDate: timestamp,
            publishDate: timestamp,
            type: POST_TYPE_ARTIST,
            userID: auth().currentUser.uid,
            title: 'New persona created',
            text: `on ${createdAdateString} at ${createdAtimeStr}`,
        };

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
                    personaid: subPersonaIDRef.id,
                    userid: '0',
                }),
            };
            console.log();

            let URL = `${BASE_API_URL}/ensurewallet/${subPersonaIDRef.id}/0`;
            console.log('about to fetch', URL, options);
            const response = await fetch(URL, options);
            console.log('ProfileScreen->', response);
            let json = await response?.json();
            console.log('ProfileScreen->', json);
        };

        console.log(
            'pre doStuff',
            (URL = `${BASE_API_URL}/ensurewallet/${subPersonaIDRef.id}/0`),
        );

        doStuff();
        firestore()
            .collection('communities')
            .doc(communityID)
            .set(
                {projects: firestore.FieldValue.arrayUnion(subPersonaIDRef.id)},
                {merge: true},
            );
        firestore()
            .collection('personas')
            .doc(persona?.pid)
            .collection('posts')
            .add(newPersonaPost);
        csetState({
            persona: {...newPersona, pid: subPersonaIDRef.id},
            edit: true,
            new: false,
            posted: false,
            pid: subPersonaIDRef.id,
        });
        closeLeftDrawer();
        //navigation.navigate('HomeScreen', {screen: 'Home'});
        /*const myUserID = auth().currentUser?.uid;
      firestore()
          .collection('users')
          .doc(myUserID)
          .collection('live')
          .doc('unnamedCounters')
          .set({personas: firestore.FieldValue.increment(1)}, {merge: true});*/
    }, []);
    return createChildPersona;
}
