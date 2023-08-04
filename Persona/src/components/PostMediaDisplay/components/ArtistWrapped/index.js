import React from 'react';
import {TouchableOpacity, View, Text, Platform} from 'react-native';

import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';

import baseText from 'resources/text';
import colors from 'resources/colors';
import images from 'resources/images';

import {useNavToPersona} from 'hooks/navigationHooks';
import getResizedImageUrl from 'utils/media/resize';

import styles from './styles';

const ArtistWrapped = ({subPersona, navigation}) => {
    const navToPersona = useNavToPersona(navigation);
    const navToArtist = () => navToPersona(subPersona.pid);

    const width = 50;
    const subPersonaExists =
        subPersona?.name !== undefined && subPersona?.name !== '';
    return (
        <View
            style={{
                left: 50,
                marginTop: 35,
                marginBottom: 10,
                backgroundColor: 'red',
            }}>
            {Platform.OS === 'ios' ? (
                <LinearGradient
                    colors={[
                        colors.background,
                        colors.timeline,
                        colors.timeline,
                        colors.background,
                    ]}
                    style={styles.artistTimeline}
                />
            ) : (
                <View style={styles.artistTimeline} />
            )}
            <View style={styles.artistPostBreakout} />
            <View
                style={{
                    position: 'absolute',
                    top: -1,
                    width: width,
                    height: width,
                    borderRadius: width,
                    borderWidth: 1.5,
                    borderColor: colors.seperatorLineColor,
                    backgroundColor: colors.homeBackground,
                    zIndex: 4,
                }}
            />
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    top: 0,
                    alignItems: 'center',
                    zIndex: 4,
                }}
                disabled={!subPersonaExists}
                onPress={navToArtist}>
                <FastImage
                    source={{
                        uri: getResizedImageUrl({
                            origUrl:
                                subPersona.profileImgUrl ||
                                images.personaDefaultProfileUrl,
                            width: width,
                            height: width,
                        }),
                    }}
                    style={{
                        width: width,
                        height: width,
                        borderRadius: width,
                        borderWidth: 1.5,
                        borderColor: colors.timeline,
                        opacity: subPersonaExists ? 1 : 0.5,
                    }}
                />
                <Text
                    style={{
                        ...baseText,
                        color: subPersonaExists
                            ? colors.text
                            : colors.textFaded2,
                        fontWeight: subPersonaExists ? 'bold' : null,
                        fontSize: 14,
                        opacity: subPersonaExists ? 1 : 0.7,
                    }}>
                    {'  '}
                    {subPersonaExists
                        ? subPersona.name
                        : ' This persona has since been deleted'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default ArtistWrapped;
