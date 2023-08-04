import React, {useContext, useCallback, useEffect, useState, memo} from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';
import firestore from '@react-native-firebase/firestore';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

import {PROFILE_IMAGE_QUALITY} from 'utils/media/compression';
import CameraIcon from 'components/CameraIcon';
import getResizedImageUrl from 'utils/media/resize';
import {uploadMediaToS3} from 'utils/s3/helpers';
import {colors, images} from 'resources';
import {GlobalStateContext} from 'state/GlobalState';
import {PersonaStateContext} from 'state/PersonaState';
import {CommunityStateContext} from 'state/CommunityState';
import BarButtonTextField from './BarButtonTextField';
import {propsAreEqual} from 'utils/propsAreEqual';
import {determineUserRights} from 'utils/helpers';
import styles from './styles';
import {uploadImages} from 'components/ImageUploader';

const ProjectHeader = ({persona}) => {
    const {personaMap, user} = useContext(GlobalStateContext);
    let large = false;
    const [progressIndicator, setProgressIndicator] = useState('');
    const [headerProgressIndicator, setHeaderProgressIndicator] = useState('');

    let personaID = persona?.pid;

    const personaContext = useContext(PersonaStateContext);
    const communityContext = useContext(CommunityStateContext);
    let currentCommunity = communityContext.currentCommunity;
    const communityID = communityContext.currentCommunity;
    const communityMap = communityContext?.communityMap;
    const personaProfileSize = 100;

    let myUserID = auth().currentUser.uid;
    const imageUrl = persona?.profileImgUrl;
    const headerImgUrl = persona?.headerImgUrl || imageUrl;

    // const hasAuth = personaID
    //     ? personaMap[personaID]?.authors?.includes(myUserID) ||
    //       myUserID === 'PHobeplJLROyFlWhXPINseFVkK32'
    //     : communityMap[communityID]?.members?.includes(myUserID) ||
    //       myUserID === 'PHobeplJLROyFlWhXPINseFVkK32';

    const hasAuth = personaID
        ? determineUserRights(null, personaID, user, 'editChannel')
        : determineUserRights(communityID, null, user, 'editChannel');

    const chooseProfilePicture = () => {
        const preUploadCallback = () => {
            setProgressIndicator('busy');
        };
        const postUploadCallback = (result, error) => {
            setProgressIndicator('');
            if (error) {
                console.log(error);
                return;
            }
            const imgUrl = result[0].uri;
            personaContext.setPersonaProfileImgUrl(imgUrl);
            persona.profileImgUrl = imgUrl;

            if (personaContext.persona?.pid) {
                firestore()
                    .collection('personas')
                    .doc(personaContext.persona?.pid)
                    .set({profileImgUrl: imgUrl}, {merge: true});
            } else {
                firestore()
                    .collection('communities')
                    .doc(currentCommunity)
                    .set({profileImgUrl: imgUrl}, {merge: true});
            }
        };
        Alert.alert('Select a profile picture', '', [
            {
                text: 'Select an image',
                onPress: async () =>
                    await uploadImages(
                        'gallery',
                        {
                            mediaType: 'photo',
                            compressImageQuality: PROFILE_IMAGE_QUALITY,
                            multiple: false,
                        },
                        preUploadCallback,
                        postUploadCallback,
                    ),
            },
            {
                text: 'Take a photo',
                onPress: async () =>
                    await uploadImages(
                        'photo',
                        {
                            mediaType: 'photo',
                            compressImageQuality: PROFILE_IMAGE_QUALITY,
                            multiple: false,
                        },
                        preUploadCallback,
                        postUploadCallback,
                    ),
            },
            {
                text: 'Cancel',
                style: 'cancel',
            },
        ]);
    };

    const chooseHeaderPicture = () => {
        const preUploadCallback = () => {
            setHeaderProgressIndicator('busy');
        };
        const postUploadCallback = (result, error) => {
            setHeaderProgressIndicator('');
            if (error) {
                console.log(error);
                return;
            }
            const imgUrl = result[0].uri;
            personaContext.setPersonaHeaderImgUrl(imgUrl);
            persona.headerImgUrl = imgUrl;

            if (personaContext.persona?.pid) {
                firestore()
                    .collection('personas')
                    .doc(personaContext.persona?.pid)
                    .set({headerImgUrl: imgUrl}, {merge: true});
            } else {
                firestore()
                    .collection('communities')
                    .doc(currentCommunity)
                    .set({headerImgUrl: imgUrl}, {merge: true});
            }
        };
        Alert.alert('Select a header picture', '', [
            {
                text: 'Select an image',
                onPress: async () =>
                    await uploadImages(
                        'gallery',
                        {
                            mediaType: 'photo',
                            compressImageQuality: PROFILE_IMAGE_QUALITY,
                            multiple: false,
                        },
                        preUploadCallback,
                        postUploadCallback,
                    ),
            },
            {
                text: 'Take a photo',
                onPress: async () =>
                    await uploadImages(
                        'photo',
                        {
                            mediaType: 'photo',
                            compressImageQuality: PROFILE_IMAGE_QUALITY,
                            multiple: false,
                        },
                        preUploadCallback,
                        postUploadCallback,
                    ),
            },
            {
                text: 'Cancel',
                style: 'cancel',
            },
        ]);
    };

    let navigation = useNavigation();

    const navToEditName = useCallback(() => {
        navigation && navigation.navigate('Edit Name');
    }, [navigation]);

    const navToEditBio = useCallback(() => {
        navigation && navigation.navigate('Edit Bio');
    }, [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.subContainer}>
                <FastImage
                    source={{
                        uri: headerImgUrl
                            ? getResizedImageUrl({
                                  origUrl: headerImgUrl,
                                  height: personaProfileSize,
                                  width: personaProfileSize,
                              })
                            : images.personaDefaultProfileUrl,
                    }}
                    style={styles.profile}
                />

                <TouchableOpacity
                    disabled={hasAuth}
                    style={styles.headerPictureContainer(hasAuth)}
                    onPress={hasAuth ? chooseHeaderPicture : null}>
                    <CameraIcon
                        onPress={hasAuth ? chooseHeaderPicture : null}
                        containerStyle={styles.cameraContainer}
                    />
                    {headerProgressIndicator === 'busy' && (
                        <View style={styles.indicator}>
                            <ActivityIndicator
                                size="large"
                                color={colors.text}
                            />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                disabled={hasAuth}
                style={{opacity: hasAuth ? 1 : 0}}
                onPress={chooseProfilePicture}>
                <CameraIcon
                    containerStyle={
                        large
                            ? {left: 40, top: 30}
                            : {left: -40, elevation: 999999, zIndex: 99999}
                    }
                    onPress={chooseProfilePicture}
                />
            </TouchableOpacity>
            {progressIndicator === 'busy' && (
                <View
                    style={{
                        ...styles.loadingIndicator,
                        top: large ? 20 : 6,
                        left: large ? 75 : 57,
                    }}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            )}
            <FastImage
                source={{
                    uri: imageUrl
                        ? getResizedImageUrl({
                              origUrl: imageUrl
                                  ? imageUrl
                                  : images.personaDefaultProfileUrl,
                              height: personaProfileSize,
                              width: personaProfileSize,
                          })
                        : images.personaDefaultProfileUrl,
                }}
                style={styles.headerImage(personaProfileSize)}
            />
            <Text style={styles.channelNameText}>
                {persona?.name || personaContext?.persona?.name}
            </Text>
            <Text style={styles.bioText}>
                {persona?.bio || personaContext?.persona?.bio}
            </Text>
            {hasAuth && (
                <>
                    <BarButtonTextField
                        label={'name'}
                        text={persona?.name || personaContext?.persona?.name}
                        onPress={navToEditName}
                    />
                    <BarButtonTextField
                        label={'bio'}
                        text={persona?.bio || personaContext?.persona?.bio}
                        onPress={navToEditBio}
                    />
                </>
            )}
        </View>
    );
};
export default memo(ProjectHeader, propsAreEqual);
