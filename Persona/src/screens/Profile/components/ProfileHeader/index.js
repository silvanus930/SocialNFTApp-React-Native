import React, {
    useContext,
    useState,
    useRef,
    useEffect,
    useCallback,
} from 'react';
import {
    Animated as RNAnimated,
    View,
    Alert,
    Dimensions,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ImageBackground,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';

import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {InviteStateContext} from 'state/InviteState';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {MessageModalStateRefContext} from 'state/MessageModalStateRef';
import getResizedImageUrl from 'utils/media/resize';
import {images, colors, baseText} from 'resources';
import {PROFILE_IMAGE_QUALITY} from 'utils/media/compression';

import styles, {DEFAULT_HIT_SLOP} from './styles';
import {uploadImages} from 'components/ImageUploader';
import firestore from '@react-native-firebase/firestore';

const ProfileHeader = ({user, headerButtons, navLeftContent}) => {
    const {
        current: {user: currentUser},
    } = useContext(GlobalStateRefContext);
    const profileModalContextRef = useContext(ProfileModalStateRefContext);
    const messageModalContextRef = useContext(MessageModalStateRefContext);
    const inviteContext = useContext(InviteStateContext);

    const isCurrentUser = user.id === auth().currentUser.uid;

    const chooseAndUploadPhoto = useCallback(
        ({title, subtitle = null, field, quality = PROFILE_IMAGE_QUALITY}) => {
            const postUploadCallback = async (result, error) => {
                if (error) {
                    console.log(error);
                    return;
                }
                await firestore()
                    .collection('users')
                    .doc(user.id)
                    .set({[field]: result[0].uri}, {merge: true})
                    .catch(err =>
                        error(`${field} img update failed: ${err.toString()}`),
                    );
            };
            Alert.alert(title, subtitle, [
                {
                    text: 'Select a photo',
                    onPress: async () =>
                        await uploadImages(
                            'gallery',
                            {
                                mediaType: 'photo',
                                compressImageQuality: quality,
                                multiple: false,
                            },
                            null,
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
                                compressImageQuality: quality,
                                multiple: false,
                            },
                            null,
                            postUploadCallback,
                        ),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]);
        },
        [],
    );

    return (
        <View style={styles.container}>
            {navLeftContent && (
                <View style={styles.headerImageUpperContainer}>
                    {navLeftContent}
                </View>
            )}

            <View style={styles.headerImageContainer}>
                <FastImage
                    source={{
                        uri: user?.profileHeaderImgUrl || user?.profileImgUrl,
                    }}
                    resizeMode={'cover'}
                    style={styles.headerImage}
                />
            </View>

            <View style={styles.innerContainer}>
                <View style={styles.headerImageActionContainer}>
                    {isCurrentUser && (
                        <TouchableOpacity
                            onPress={() => {
                                chooseAndUploadPhoto({
                                    title: 'Header Photo',
                                    field: 'profileHeaderImgUrl',
                                });
                            }}
                            hitSlop={DEFAULT_HIT_SLOP}
                            style={styles.editHeaderPicContainer}>
                            <Icon
                                name="camera"
                                size={16}
                                style={styles.editHeaderPicCameraIcon}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    {headerButtons && headerButtons}
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.profilePicContainer}>
                        <FastImage
                            source={{
                                uri: user.profileImgUrl
                                    ? getResizedImageUrl({
                                          origUrl:
                                              user.profileImgUrl ||
                                              images.userDefaultProfileUrl,
                                          height: styles.profilePic.height,
                                          width: styles.profilePic.width,
                                      })
                                    : isCurrentUser
                                    ? images.userDefaultProfileUrl
                                    : images.personaDefaultProfileUrl,
                            }}
                            style={styles.profilePic}
                        />
                        {isCurrentUser && (
                            <TouchableOpacity
                                onPress={() => {
                                    chooseAndUploadPhoto({
                                        title: 'Profile Photo',
                                        field: 'profileImgUrl',
                                    });
                                }}
                                style={styles.editProfilePicContainer}
                                hitSlop={DEFAULT_HIT_SLOP}>
                                <Icon
                                    name="camera"
                                    size={16}
                                    style={styles.editProfilePicCameraIcon}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.usernameText}>{user.userName}</Text>
                </View>
            </View>
        </View>
    );
};

export default ProfileHeader;
