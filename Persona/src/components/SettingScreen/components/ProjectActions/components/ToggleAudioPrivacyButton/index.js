import React, {useState, useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Feather';

import {colors} from 'resources';
import {GlobalStateContext} from 'state/GlobalState';

import styles from './styles';

function ToggleAudioPrivacyButton({personaID}) {
    const {personaMap} = useContext(GlobalStateContext);

    const [canChat, setCanChat] = useState(
        personaMap[personaID].publicCanAudioChat,
    );
    const toggleChatOnPress = () => {
        console.log(`toggleChatOnPress ${personaID}`);
        firestore()
            .collection('personas')
            .doc(personaID)
            .set({publicCanAudioChat: !canChat}, {merge: true});
        setCanChat(!canChat);
    };

    return (
        personaID && (
            <TouchableOpacity
                style={styles.container}
                onPress={toggleChatOnPress}>
                <Icon
                    name={canChat ? 'mic' : 'mic-off'}
                    size={23}
                    color={canChat ? colors.textFaded : colors.maxFaded}
                />
                <Text style={styles.text}>audio</Text>
                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>
                        {canChat ? 'everyone' : 'off'}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    );
}

export default ToggleAudioPrivacyButton;
