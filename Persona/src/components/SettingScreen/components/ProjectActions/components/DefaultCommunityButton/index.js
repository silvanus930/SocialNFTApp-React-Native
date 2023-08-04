import React, {useContext} from 'react';
import {Alert, Text, TouchableOpacity} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import {CommunityStateContext} from 'state/CommunityState';

import styles from './styles';

function DefaultCommunityButton({setIsDefault}) {
    const myUserID = auth().currentUser.uid;

    const communityContext = useContext(CommunityStateContext);

    const handleSetAsDefault = () => {
        Alert.alert('Successfully changed as the default community!', '', [
            {
                text: 'OK',
                style: 'Ok',
            },
        ]);
        setIsDefault(false);
        firestore().collection('users').doc(myUserID).set(
            {
                defaultCommunityID: communityContext.currentCommunity,
            },
            {merge: true},
        );
    };

    return (
        <TouchableOpacity onPress={handleSetAsDefault} style={styles.container}>
            <Text style={styles.text}>Set this community as default</Text>
        </TouchableOpacity>
    );
}

export default DefaultCommunityButton;
