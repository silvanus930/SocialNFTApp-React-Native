import React, {useCallback, useContext} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import abbreviate from 'number-abbreviate';
import ParsedText from 'react-native-parsed-text';
import {useNavigation} from '@react-navigation/core';
import pluralize from 'pluralize';
import FastImage from 'react-native-fast-image';

import {images} from 'resources';
import {updateProfileContext} from 'actions/profile';
import {vanillaPersona} from 'state/PersonaState';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {ProfileModalStateContext} from 'state/ProfileModalState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

import styles from './styles';

const CommunityItem = ({data, regexPattern}) => {
    const navigation = useNavigation();

    const profileModalContext = useContext(ProfileModalStateContext);
    const personaContext = useContext(PersonaStateRefContext);
    const {
        current: {user: currentUser},
    } = useContext(GlobalStateRefContext);

    const handleOpenCommunity = useCallback(
        item => {
            personaContext.current.csetState({
                openFromTop: false,
                persona: {...vanillaPersona, ...item},
                identityPersona: {...vanillaPersona, ...item},
                edit: true,
                new: false,
                posted: false,
                pid: item?.pid,
                openToThreadID: null,
                scrollToMessageID: null,
                threadID: null,
            });

            navigation.goBack();

            updateProfileContext(item?.pid);
            profileModalContext?.closeLeftDrawer();
        },
        [navigation, personaContext, profileModalContext],
    );

    const handleJoinCommunity = useCallback(() => {
        Alert.alert('Join Community');
    }, []);

    const renderCommunityItem = useCallback(
        ({item}) => {
            const {
                name,
                bio,
                communityMembers,
                profileImgUrl,
                authors,
                invitedUsers,
                uid,
                followers,
                ...rest
            } = item;

            const isMemberOfCommunity =
                authors?.includes(currentUser.id) ||
                communityMembers?.includes(currentUser.id) ||
                followers?.includes(currentUser.id) ||
                invitedUsers?.[currentUser.id];

            return (
                <TouchableOpacity
                    style={styles.container}
                    onPress={() => handleOpenCommunity(item)}>
                    <View style={styles.topContainer}>
                        <FastImage
                            source={{
                                uri:
                                    profileImgUrl ||
                                    images.personaDefaultProfileUrl,
                            }}
                            style={styles.userIcon}
                        />
                        <View style={styles.contentContainer}>
                            <ParsedText
                                numberOfLines={1}
                                style={styles.communityName}
                                parse={[
                                    {
                                        pattern: regexPattern,
                                        style: styles.hightLightedText,
                                    },
                                ]}
                                childrenProps={{allowFontScaling: false}}>
                                {name}
                            </ParsedText>
                            <Text
                                numberOfLines={1}
                                style={styles.communityDetails}>
                                {rest.private ? 'Private' : 'Public'} channel{' '}
                                <View style={styles.largeDotContainer}>
                                    <View style={styles.largeDot} />
                                </View>
                                {abbreviate(communityMembers?.length || 0)}{' '}
                                {pluralize(
                                    'member',
                                    communityMembers?.length || 0,
                                )}
                            </Text>
                            <ParsedText
                                numberOfLines={2}
                                style={styles.detailText}
                                parse={[
                                    {
                                        pattern: regexPattern,
                                        style: styles.hightLightedText,
                                    },
                                ]}
                                childrenProps={{allowFontScaling: false}}>
                                {bio}
                            </ParsedText>
                        </View>
                    </View>
                    {!isMemberOfCommunity && !rest.private ? (
                        <TouchableOpacity
                            style={styles.actionContainer}
                            onPress={() => handleJoinCommunity(uid)}>
                            <Text style={styles.actionText}>Join Channel</Text>
                        </TouchableOpacity>
                    ) : null}
                </TouchableOpacity>
            );
        },
        [handleOpenCommunity, regexPattern, handleJoinCommunity, currentUser],
    );

    return renderCommunityItem({item: data});
};

export default React.memo(CommunityItem);
