import React, {useContext} from 'react';
import {Alert, Text, TouchableOpacity} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {colors} from 'resources';
import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';
import {useNavToCommunityChat} from 'hooks/navigationHooks';

import styles from './styles';

function DeleteButton({personaID}) {
    let navigation = useNavigation();
    const navToCommunityChat = useNavToCommunityChat(navigation);
    const personaContext = useContext(PersonaStateContext);
    const communityContext = useContext(CommunityStateContext);
    let currentCommunity = communityContext.currentCommunity;

    const deleteOrLeaveOnPress = () => {
        if (personaContext?.persona?.authors?.length === 1) {
            Alert.alert(`Delete ${personaContext?.persona?.name}?`, '', [
                {
                    text: 'no',
                    onPress: () => {},
                    style: 'cancel',
                },
                {
                    text: 'yes',
                    onPress: deleteChannel,
                    style: 'destructive',
                },
            ]);
        } else {
            Alert.alert(
                `Are you sure you want to leave ${personaContext?.persona?.name}?`,
                '',
                [
                    {
                        text: 'no',
                        onPress: () => {},
                        style: 'cancel',
                    },
                    {
                        text: 'yes',
                        onPress: leaveStream,
                        style: 'destructive',
                    },
                ],
            );
        }
    };
    const leaveStream = async () => {
        navigation.goBack();        

        personaContext.csetState({});
        const batch = firestore().batch();
        const voiceRef = firestore()
            .collection('users')
            .doc(auth().currentUser?.uid)
            .collection('live')
            .doc('voice');
        const personaRef = firestore().collection('personas').doc(personaID);
        batch.update(voiceRef, {personaContext: ''});
        batch.update(personaRef, {
            authors: firestore.FieldValue.arrayRemove(auth().currentUser?.uid),
        });
        const userRef = firestore()
            .collection('users')
            .doc(auth().currentUser?.uid);

        const roles = (await userRef.get())?.data().roles ?? [];

        const rolesToRemove = roles.filter((role) => {
            return role.ref.path.split('/')[1] === personaID
        }); 
        const updatedRoles = roles.filter((role) => {
            return role.ref.path.split('/')[1] !== personaID
        });

        const uniqueTitles = [...new Set(rolesToRemove.map(obj => obj.title))];
        uniqueTitles.forEach(title=> {
            batch.update(personaRef, {
                ['userRoles.' + title]: firestore.FieldValue.arrayRemove(auth().currentUser?.uid),
            });
        });

        batch.update(userRef, {roles: updatedRoles});
        await batch.commit();
    };

    const deleteChannel = async () => {
        const userRef = firestore()
            .collection('users')
            .doc(auth().currentUser?.uid);

        let updatedRoles = (await userRef.get())?.data().roles ?? [];
        updatedRoles = updatedRoles.filter((role) => {
            return role.ref.path.split('/')[1] != personaID
        });
        await userRef.update({roles: updatedRoles});

        navToCommunityChat(currentCommunity);
        await firestore()
            .collection('communities')
            .doc(currentCommunity)
            .set(
                {projects: firestore.FieldValue.arrayRemove(personaID)},
                {merge: true},
            );
        await firestore()
            .collection('personas')
            .doc(personaID)
            .set({deleted: true}, {merge: true});
    };

    const canDeletePersona = personaContext?.persona?.authors?.length === 1;

    return (
        personaID && (
            <TouchableOpacity
                style={styles.container}
                onPress={deleteOrLeaveOnPress}>
                {canDeletePersona ? (
                    <Icon name={'trash'} size={22} color={colors.red} />
                ) : (
                    <Ionicons
                        name={'exit-outline'}
                        size={22}
                        color={colors.red}
                    />
                )}
                <Text style={styles.text}>
                    {canDeletePersona ? 'delete' : 'leave channel'}
                </Text>
            </TouchableOpacity>
        )
    );
}

export default DeleteButton;
