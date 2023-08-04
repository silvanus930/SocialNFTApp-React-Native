import React from 'react';
import {Text, View} from 'react-native';
import FastImage from 'react-native-fast-image';

import images from 'resources/images';
import getResizedImageUrl from 'utils/media/resize';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PersonaStateContext} from 'state/PersonaState';

import styles from './styles';

function IntentHeader({}) {
    const communityContext = React.useContext(CommunityStateContext);
    const personaContext = React.useContext(PersonaStateContext);
    const globalStateContextRef = React.useContext(GlobalStateRefContext);
    const communityMap = communityContext.communityMap;
    const personaMap = globalStateContextRef.current.personaMap;
    const isPersona = Boolean(personaContext?.persona?.pid);
    const currentCommunity = communityContext.currentCommunity;
    const channelName = isPersona
        ? personaContext?.persona?.name
        : communityMap[currentCommunity]?.name;

    const imageUrl =
        isPersona &&
        Boolean(personaMap[personaContext?.persona.personaID]?.profileImgUrl)
            ? getResizedImageUrl({
                  origUrl:
                      personaMap[personaContext?.persona.personaID]
                          ?.profileImgUrl,
                  width: 30,
                  height: 30,
              })
            : images.personaDefaultProfileUrl;

    return (
        <View style={styles.container}>
            <View style={styles.subContainer}>
                {isPersona && (
                    <View>
                        <FastImage
                            source={{uri: imageUrl}}
                            style={styles.profileImage}
                        />
                    </View>
                )}

                <View style={styles.channelNameContainer}>
                    <Text style={styles.channelNameText}>
                        {isPersona ? channelName : '🏠 Home channel'}
                    </Text>
                    {!isPersona && (
                        <Text style={styles.subChannelNameText}>
                            {channelName}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

export default IntentHeader;
