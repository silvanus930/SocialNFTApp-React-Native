import React, {useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';

import {colors} from 'resources';
import {CommunityStateContext} from 'state/CommunityState';
import {ADMIN_ROLE} from 'utils/constants';

import styles from './styles';

function AddAdminButton({persona}) {
    const communityContext = useContext(CommunityStateContext);
    let communityID = communityContext.currentCommunity;

    const baseCollection = persona?.pid ? 'personas' : 'communities';

    const setAdmin = () => {        
        let personaRef;
        const communityRef = firestore().doc(`communities/${communityID}`);;

        if(persona?.pid) {
            personaRef = firestore().doc(`personas/${persona.pid}`);
        }
       
        const userRef = firestore()
            .collection('users')
            .doc(auth().currentUser.uid);
        
        // Add roles to user

        if(persona?.pid) {
            // add admin role to persona
            userRef
                .update({
                    roles: firestore.FieldValue.arrayUnion({
                        ref: personaRef,
                        ...ADMIN_ROLE,
                    }),
                })
                .then(() => {
                    console.log('updated');
                })
                .catch(error => {
                    console.log('not updated, error: ', error);
                });
        }

        // add admin role to community
        userRef
            .update({
                roles: firestore.FieldValue.arrayUnion({
                    ref: communityRef,
                    ...ADMIN_ROLE,
                }),
            })
            .then(() => {
                console.log('updated');
            })
            .catch(error => {
                console.log('not updated, error: ', error);
            });
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={setAdmin}
                style={styles.subContainer}>
                <FontAwesome
                    name={'star'}
                    color={colors.textFaded}
                    style={{left: 10}}
                    size={18}
                />
                <Text style={styles.text}>Give Self Admin Role</Text>
                <FontAwesome
                    name={'star'}
                    color={colors.textFaded}
                    style={{left: 35}}
                    size={18}
                />
            </TouchableOpacity>
        </View>
    );
}

export default AddAdminButton;
