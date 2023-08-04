import React, {useContext, useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

import FloatingHeader from 'components/FloatingHeader';

import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';

import styles from './styles';
import ProjectHeader from './components/ProjectHeader';
import ProjectActions from './components/ProjectActions';

const SettingScreen = () => {
    const personaContext = useContext(PersonaStateContext);
    const communityContext = useContext(CommunityStateContext);

    const personaKey = personaContext?.persona?.pid;
    const communityID = communityContext.currentCommunity;
    let communityMap = communityContext?.communityMap;
    let currentCommunity = communityID;
    const navigation = useNavigation();
    const personaID = persona?.pid;
    const personaTmp = personaKey
        ? personaContext?.persona
        : communityMap[currentCommunity];

    const [persona, setPersona] = useState(personaTmp);

    useEffect(() => {
        const unsubscribe = personaContext?.persona?.pid
            ? firestore()
                  .collection('personas')
                  .doc(personaContext.persona?.pid)
                  .onSnapshot(async snap => {
                      if (snap.exists) {
                          setPersona({
                              ...snap.data(),
                              pid: personaContext?.persona?.pid,
                          });
                      }
                  })
            : () => {};

        return () => unsubscribe();
    }, [personaContext?.persona?.pid]);

    return (
        <View>
            <FloatingHeader back={true} />
            <View height={120} />
            <ScrollView style={styles.scrollViewStyle}>
                <ProjectHeader
                    persona={persona}
                    showCreatePost={false}
                    personaID={personaID}
                    communityID={communityID}
                />
                <ProjectActions persona={persona} navigation={navigation} />
                <View height={200} />
            </ScrollView>
        </View>
    );
};

export default SettingScreen;
