import React, {useState, useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {colors} from 'resources';
import {GlobalStateContext} from 'state/GlobalState';

import styles from './styles';

function ToggleChatPrivacyButton({personaID}) {
    const {personaMap} = useContext(GlobalStateContext);

    const [canChat, setCanChat] = useState(personaMap[personaID].publicCanChat);
    const toggleChatOnPress = () => {
        console.log(`toggleChatOnPress ${personaID}`);
        firestore()
            .collection('personas')
            .doc(personaID)
            .set({publicCanChat: !canChat}, {merge: true});
        setCanChat(!canChat);
    };

    return (
        personaID && (
            <TouchableOpacity
                style={styles.container}
                onPress={toggleChatOnPress}>
                <FontAwesome
                    name={'comment'}
                    size={23}
                    color={canChat ? colors.textFaded : colors.maxFaded}
                />
                <Text style={styles.text}>chat</Text>
                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>
                        {canChat ? 'everyone' : 'members'}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    );
}

export default ToggleChatPrivacyButton;
