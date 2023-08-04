import React, {useEffect, useState, useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {colors} from 'resources';
import {CommunityStateContext} from 'state/CommunityState';

import styles from './styles';

function ToggleOpenButton({persona}) {
    const myUserID = auth().currentUser.uid;

    const communityContext = useContext(CommunityStateContext);
    let communityID = communityContext.currentCommunity;

    let docPath = persona?.pid
        ? `personas/${persona.pid}`
        : `communities/${communityID}`;

    const [isOpened, setIsOpened] = useState(false);

    const handleToggleOpen = () => {
        firestore().doc(docPath).set(
            {
                open: !isOpened,
            },
            {merge: true},
        );
    };

    useEffect(() => {
        if (docPath) {
            return firestore()
                .doc(docPath)
                .onSnapshot(docSnap => {
                    setIsOpened(docSnap.get('open') || false);
                });
        }
    }, [isOpened, docPath, myUserID]);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={handleToggleOpen}
                style={styles.subContainer}>
                <FontAwesome
                    name={isOpened ? 'eye' : 'eye-slash'}
                    color={colors.textFaded}
                    style={{left: 10}}
                    size={18}
                />
                <Text style={styles.text}>
                    {`open ${persona?.pid ? 'channel' : 'community'}`}
                </Text>
                <View style={styles.toggleContainer(persona?.pid)}>
                    <Text style={styles.toggleText}>
                        {isOpened ? 'open' : 'close'}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default ToggleOpenButton;
