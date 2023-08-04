import React, {useContext} from 'react';
import {View, Text} from 'react-native';

import firestore from '@react-native-firebase/firestore';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';

import {GlobalStateRefContext} from 'state/GlobalStateRef';
import getResizedImageUrl from 'utils/media/resize';
import {images} from 'resources';

import styles, {width} from './styles';

export default function ProfilePersona({
    user,
    navigation,
    persona,
    personaID,
    userID,
    index,
    showName = false,
}) {
    const {
        current: {userMap},
    } = useContext(GlobalStateRefContext);

    const wallet = userMap[userID]?.wallet;

    return (
        <View style={styles.centerContainer(index)}>
            <FastImage
                source={{
                    uri: persona?.profileImgUrl
                        ? getResizedImageUrl({
                              origUrl: persona.profileImgUrl
                                  ? persona.profileImgUrl
                                  : images.personaDefaultProfileUrl,
                              height: styles.profileModeStyles.height,
                              width: styles.profileModeStyles.width,
                          })
                        : images.personaDefaultProfileUrl,
                }}
                style={styles.profileModeStyles}
            />

            <View style={styles.contentContainer}>
                <View style={styles.contentInnerContainer}>
                    <Text style={styles.personaName}>{persona.name}</Text>
                    <Text style={styles.personaBalance}>0 ETH</Text>
                </View>
            </View>
        </View>
    );
}
