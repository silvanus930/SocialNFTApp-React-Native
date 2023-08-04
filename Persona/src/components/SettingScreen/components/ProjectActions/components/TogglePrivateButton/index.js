import React, {useEffect, useState, useContext, useCallback} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {colors} from 'resources';
import {CommunityStateContext} from 'state/CommunityState';

import styles from './styles';

function TogglePrivateButton({persona}) {
    const communityContext = useContext(CommunityStateContext);
    let communityID = communityContext.currentCommunity;

    const [isPrivate, setIsPrivate] = useState(persona?.private);

    let docPath = persona?.pid
        ? `personas/${persona.pid}`
        : `communities/${communityID}`;

    const baseCollection = persona?.pid ? 'personas' : 'communities';

    useEffect(() => {
        if (docPath) {
            return firestore()
                .doc(docPath)
                .onSnapshot(docSnap => {
                    setIsPrivate(docSnap.get('private') || false);
                });
        }
    }, [docPath]);

    const handleTogglePrivate = useCallback(() => {
        console.log(
            'called handleTogglePrivate on baseCollection',
            baseCollection,
            'with state',
            isPrivate,
        );
        if (isPrivate) {
            firestore()
                .doc(
                    `${baseCollection}/${
                        persona?.cid ? persona.cid : persona.pid
                    }`,
                )
                .set(
                    {
                        private: false,
                    },
                    {merge: true},
                );
            setIsPrivate(false);
        } else {
            firestore()
                .doc(
                    `${baseCollection}/${
                        persona?.cid ? persona.cid : persona.pid
                    }`,
                )
                .set(
                    {
                        private: true,
                    },
                    {merge: true},
                );
            setIsPrivate(true);
        }
    }, [persona, isPrivate, baseCollection]);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={handleTogglePrivate}
                style={styles.subContainer}>
                <FontAwesome
                    name={isPrivate ? 'eye-slash' : 'eye'}
                    color={colors.textFaded}
                    style={{left: 10}}
                    size={18}
                />
                <Text style={styles.text}>visibility</Text>
                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>
                        {isPrivate ? 'private' : 'public'}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default TogglePrivateButton;
