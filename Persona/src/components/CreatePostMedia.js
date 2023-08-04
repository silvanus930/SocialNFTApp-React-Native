import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
    TouchableOpacity,
    Alert,
    Platform,
    Image,
    Text,
} from 'react-native';
import _ from 'lodash';
import images from 'resources/images';
import colors from 'resources/colors';
import palette from 'resources/palette';
import {FlatList} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import LineSeperator from 'components/LineSeperator';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import {
    MEDIA_IMAGE_POST_QUALITY,
    MEDIA_VIDEO_POST_QUALITY,
} from 'utils/media/compression';
import getResizedImageUrl from 'utils/media/resize';
import {uploadImages} from 'components/ImageUploader';

export default function CreatePostMedia({
    s3GalleryUris,
    setS3GalleryUris,
    initWithMedia,
}) {
    const [progressIndicator, setProgressIndicator] = React.useState('');

    const chooseMediaArtifact = (mediaType = 'gallery') => {
        const isImage = mediaType === 'gallery';
        const imageLibraryMediaType = isImage ? 'photo' : 'video';
        const alertText = isImage ? 'Add new image' : 'Add new video';

        const preUploadCallback = () => {
            setProgressIndicator('busy');
        };
        const postUploadCallback = (result, error) => {
            setProgressIndicator('');
            if (error) {
                console.log(
                    'ERROR: unable to upload media: ',
                    JSON.stringify(error),
                );
                alert('Unable to upload media - please try again.');
                return;
            }
            const oldGalleryUris = Object.assign([], s3GalleryUris);
            const newGalleryUris = oldGalleryUris.concat(result);
            setS3GalleryUris(newGalleryUris);
        };

        Alert.alert(
            alertText,
            '',
            [
                {
                    text: 'Select from library',
                    onPress: async () =>
                        await uploadImages(
                            'gallery',
                            {
                                mediaType: 'any',
                                compressImageQuality: MEDIA_IMAGE_POST_QUALITY,
                                multiple: true,
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
                                compressImageQuality: MEDIA_IMAGE_POST_QUALITY,
                                multiple: false,
                            },
                            preUploadCallback,
                            postUploadCallback,
                        ),
                },
                {
                    text: 'Record a new video',
                    onPress: async () =>
                        await uploadImages(
                            'video',
                            {
                                mediaType: 'video',
                                compressImageQuality: MEDIA_IMAGE_POST_QUALITY,
                                multiple: false,
                            },
                            preUploadCallback,
                            postUploadCallback,
                        ),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        // TODO ?
                    },
                },
            ],
            {cancelable: true},
        );
    };

    const chooseMediaArtifactImage = () => chooseMediaArtifact('gallery');
    const chooseMediaArtifactVideo = () => chooseMediaArtifact('video');

    React.useEffect(() => {
        if (initWithMedia === 'image') {
            chooseMediaArtifactImage();
        } else if (initWithMedia === 'video') {
            chooseMediaArtifactVideo();
        }
    }, [initWithMedia]);

    return (
        <>
            <ManageGalleryItemsBar
                s3GalleryUris={s3GalleryUris}
                setS3GalleryUris={setS3GalleryUris}
                chooseMediaArtifactImageAndAddToGallery={
                    chooseMediaArtifactImage
                }
            />
            <LineSeperator style={{marginTop: 0}} />
            <ChoosePhotoMediaBar
                progressIndicator={progressIndicator}
                chooseMediaArtifactImage={chooseMediaArtifactImage}
            />
            <LineSeperator style={{marginTop: 5}} />
            <ChooseVideoMediaBar
                progressIndicator={progressIndicator}
                chooseMediaArtifactVideo={chooseMediaArtifactVideo}
            />
        </>
    );
}

function ChoosePhotoMediaBar({progressIndicator, chooseMediaArtifactImage}) {
    return (
        <View style={Styles.actionBarContainer}>
            {progressIndicator === 'busy' && (
                <View
                    style={{
                        position: 'absolute',
                        left: Platform.OS === 'android' ? 5 : 15,
                        top: 12,
                    }}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            )}
            <TouchableOpacity
                hitSlop={{left: 10, right: 10, bottom: 15, top: 0}}
                onPress={() => {
                    chooseMediaArtifactImage();
                }}
                style={{
                    flexDirection: 'row',
                }}>
                <FastImage
                    style={Styles.addPhoto}
                    source={images.photoCamera}
                />

                <View
                    style={{
                        flex: 1,
                    }}>
                    <Text style={Styles.mediaText}>Upload photo</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

function ChooseVideoMediaBar({progressIndicator, chooseMediaArtifactVideo}) {
    return (
        <View style={Styles.actionBarContainer}>
            {progressIndicator === 'busy' && (
                <View
                    style={{
                        position: 'absolute',
                        left: Platform.OS === 'android' ? 5 : 15,
                        top: 12,
                    }}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            )}
            <TouchableOpacity
                hitSlop={{left: 10, right: 10, bottom: 10, top: -3}}
                onPress={chooseMediaArtifactVideo}
                style={{
                    flexDirection: 'row',
                }}>
                <FastImage
                    style={Styles.addVideo}
                    source={images.videoCamera}
                />
                <View
                    style={{
                        flex: 1,
                    }}>
                    <Text style={Styles.mediaText}>Upload video</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

function ManageGalleryItemsBar({
    s3GalleryUris,
    setS3GalleryUris,
    chooseMediaArtifactImageAndAddToGallery,
}) {
    const [updatedGallerySwitch, setUpdatedGallerySwitch] =
        React.useState(false);

    const deleteMediaUrlFromGallery = index => {
        Alert.alert('Delete media', 'Are you sure?', [
            {
                text: 'No',
                onPress: () => {},
                style: 'cancel',
            },
            {
                text: 'Yes',
                onPress: () => {
                    if (index > -1 && s3GalleryUris[index]) {
                        s3GalleryUris.splice(index, 1);
                    }
                    setS3GalleryUris(s3GalleryUris);
                    setUpdatedGallerySwitch(!updatedGallerySwitch);
                },
            },
        ]);
    };

    return s3GalleryUris.length ? (
        <View
            style={{
                padding: 10,
                justifyContent: 'center',
            }}>
            <FlatList
                removeClippedSubviews={true}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                ListFooterComponent={
                    <TouchableOpacity
                        disabled={!s3GalleryUris.length}
                        onPress={chooseMediaArtifactImageAndAddToGallery}>
                        <FastImage
                            style={{
                                ...Styles.addPhoto,
                                width: 20,
                                height: 20,
                                top: 10,
                            }}
                            source={images.addIcon}
                        />
                    </TouchableOpacity>
                }
                horizontal={true}
                data={s3GalleryUris}
                extraData={s3GalleryUris}
                keyExtractor={item => {
                    return item.uri;
                }}
                renderItem={({item, index}) => {
                    return (
                        <TouchableOpacity
                            style={{
                                zIndex: 100,
                                elevation: 100,
                                marginRight: 15,
                            }}
                            onPress={() => {
                                deleteMediaUrlFromGallery(index);
                            }}>
                            <View
                                style={{
                                    position: 'absolute',
                                    opacity: 0.43,
                                    borderRadius: 15,
                                    zIndex: 99999999,
                                    elevation: 99999999,
                                    left: 25,
                                    bottom: 20,
                                    backgroundColor: colors.overlayBackground,
                                }}>
                                <Icon
                                    color={'white'}
                                    name="x"
                                    size={palette.header.icon.size}
                                />
                            </View>
                            {item.uri.slice(-3) === 'mp4' ? (
                                <Video
                                    source={{uri: item.uri}}
                                    style={{
                                        marginLeft: 12,
                                        width: 40,
                                        height: 40,
                                        borderRadius: 5,
                                    }}
                                    resizeMode="cover"
                                    repeat={true}
                                    paused={true}
                                />
                            ) : (
                                <FastImage
                                    style={{
                                        ...Styles.addPhoto,
                                        width: 40,
                                        height: 40,
                                        zIndex: 0,
                                        elevation: 0,
                                        borderRadius: 5,
                                        backgroundColor:
                                            colors.defaultImageBackground,
                                    }}
                                    source={{
                                        uri: getResizedImageUrl({
                                            origUrl: item.uri,
                                            width: Styles.addPhoto.width,
                                            height: Styles.addPhoto.height,
                                        }),
                                    }}
                                />
                            )}
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    ) : null;
}

const Styles = StyleSheet.create({
    actionBarContainer: {
        flexDirection: 'column',
        resizeMode: 'contain',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 10,
    },

    mediaText: {
        color: 'white',
        marginRight: 20,
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 5,
        fontSize: 19,
    },

    addPhoto: {
        height: 30,
        width: 30,
        marginLeft: 20,
    },

    addVideo: {
        height: 35,
        width: 30,
        marginLeft: 20,
    },

    addAudio: {
        height: 38,
        width: 38,
        resizeMode: 'contain',
        justifyContent: 'center',
        alignItems: 'center',
    },

    addFile: {
        resizeMode: 'contain',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 9,
    },
});
