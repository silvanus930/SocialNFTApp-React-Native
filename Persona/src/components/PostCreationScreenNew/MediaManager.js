import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
    TouchableOpacity,
    Alert,
    Platform,
    Image,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import _ from 'lodash';
import images from 'resources/images';
import colors from 'resources/colors';
import palette from 'resources/palette';
import {FlatList} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import {
    PostStateContext,
    POST_TYPE_PROPOSAL,
    DEFAULT_POST_TYPE,
} from 'state/PostState';
import {
    POST_EMPTY,
    POST_SUBMITTING,
    POST_SUBMITTED,
    POST_MEDIA_TYPE_GALLERY,
    POST_MEDIA_TYPE_VIDEO,
    POST_MEDIA_TYPE_AUDIO,
    POST_MEDIA_TYPE_FILE,
    DEFAULT_POST_MEDIA_TYPE,
} from 'state/PostState';
import LineSeperator from 'components/LineSeperator';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {uploadMediaToS3, getMimeByExt} from 'utils/s3/helpers';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import {
    MEDIA_IMAGE_POST_QUALITY,
    MEDIA_VIDEO_POST_QUALITY,
} from 'utils/media/compression';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import getResizedImageUrl from 'utils/media/resize';
import fs from 'react-native-fs';
import MediaPreview from './MediaPreview';

export default function MediaManager({navigation}) {
    const postContext = React.useContext(PostStateContext);
    const [response, setResponse] = React.useState(null);
    const [progressIndicator, setProgressIndicator] = React.useState('');

    // BREADCRUMB: Chooses a new file from file system
    const chooseMediaArtifactFile = async () => {
        postContext.setPostMediaType(POST_MEDIA_TYPE_FILE);
        // for now pick a single file
        try {
            postContext.setAddMedia(POST_SUBMITTING);
            const res = await DocumentPicker.pick({
                type: [
                    DocumentPicker.types.plainText,
                    DocumentPicker.types.pdf,
                    DocumentPicker.types.zip,
                    DocumentPicker.types.csv,
                    DocumentPicker.types.doc,
                    DocumentPicker.types.docx,
                    DocumentPicker.types.ppt,
                    DocumentPicker.types.pptx,
                    DocumentPicker.types.xls,
                    DocumentPicker.types.xlsx,
                ],
            });

            console.log(
                'Picked file: ',
                res.uri,
                res.type, // mime-type
                res.name,
                res.size,
            );

            // FIXME: Why do we have this timeout?
            await new Promise(r => setTimeout(r, 40));
            const mimeExt = res.type.split('/')[1];
            const ext = mimeExt === 'x-m4a' ? 'm4a' : mimeExt;

            const fileUrl = await uploadMediaToS3(
                {
                    ...res,
                    ext: ext,
                },
                setProgressIndicator,
                () =>
                    postContext.post.fileUris.length
                        ? postContext.setAddMedia(POST_SUBMITTED)
                        : postContext.setAddMedia(POST_EMPTY),
            );
            postContext.addFile({
                uri: fileUrl,
                name: res.name,
                type: res.type,
                size: res.size,
            });
            postContext.setAddMedia(POST_SUBMITTED);
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled the picker, exit any dialogs or menus and move on
                postContext.post.fileUris.length &&
                    postContext.setAddMedia(POST_SUBMITTED);
                !postContext.post.fileUris.length &&
                    postContext.setAddMedia(POST_EMPTY);
            } else {
                error(err.toString());
            }
        }
    };

    const chooseMediaArtifactAudio = () => {
        postContext.setPostMediaType(POST_MEDIA_TYPE_AUDIO);
    };

    const chooseMediaArtifactImageAndAddToGallery = () => {
        chooseMediaArtifactGallery();
    };

    // BREADCRUMB: Main method for adding images/video from device
    const chooseMediaArtifact = (mediaType = 'gallery') => {
        // for now only images
        const isImage = mediaType === 'gallery';
        const imageLibraryMediaType = isImage ? 'photo' : 'video';
        const alertText = isImage ? 'Add new image' : 'Add new video';
        Alert.alert(alertText, '', [
            {
                text: isImage
                    ? 'Select image from library'
                    : 'Select video from library',
                onPress: async () =>
                    launchImageLibrary(
                        {
                            mediaType: imageLibraryMediaType,
                            quality: isImage
                                ? MEDIA_IMAGE_POST_QUALITY
                                : MEDIA_VIDEO_POST_QUALITY,
                        },
                        r =>
                            setResponse({
                                ...r,
                                mediaType: mediaType,
                                source: 'select',
                            }),
                    ),
            },
            {
                text: isImage ? 'Take a photo' : 'Record a new video',
                onPress: () =>
                    launchCamera(
                        {
                            mediaType: imageLibraryMediaType,
                            quality: isImage
                                ? MEDIA_IMAGE_POST_QUALITY
                                : MEDIA_VIDEO_POST_QUALITY,
                            saveToPhotos: true,
                        },
                        r =>
                            setResponse({
                                ...r,
                                mediaType: mediaType,
                                source: 'camera',
                            }),
                    ),
            },
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    if (
                        !(
                            postContext.post.mediaUrl ||
                            postContext.post.galleryUris.length
                        )
                    ) {
                        postContext.setAddMedia(POST_EMPTY);
                    } else {
                        postContext.setAddMedia(POST_SUBMITTED);
                    }
                },
            },
        ]);
    };

    const addProposal = React.useCallback(() => {
        if (postContext.post.type === POST_TYPE_PROPOSAL) {
            postContext.setPostType(DEFAULT_POST_TYPE);
            postContext.setPostProposal({});
        } else {
            postContext.setPostType(POST_TYPE_PROPOSAL);
        }
    }, []);

    const chooseMediaArtifactGallery = () => chooseMediaArtifact('gallery');
    //TODO: Remove photo post type as well as PostImage
    const chooseMediaArtifactImage = () => chooseMediaArtifact('gallery');
    const chooseMediaArtifactVideo = () => chooseMediaArtifact('video');

    const clearMediaState = React.useCallback(
        () =>
            postContext.post.mediaUrl || postContext?.post.galleryUris?.length
                ? postContext.setAddMedia(POST_SUBMITTED)
                : postContext.setAddMedia(POST_EMPTY),
        [postContext.galleryUris, postContext.mediaUrl],
    );

    // Upload to S3
    // BREADCRUMB: EFFECT: Upload assets we've fetched and stored in response to S3
    React.useEffect(() => {
        (async function upload() {
            if (response !== null && response?.assets?.length) {
                try {
                    console.log('response to submitting ', response.mediaType);
                    console.log('response-> ', response);

                    postContext.setAddMedia(POST_SUBMITTING);
                    postContext.setPostMediaType(response.mediaType);

                    let ext;
                    try {
                        ext =
                            response.source === 'select'
                                ? response.assets[0].uri.split('.').pop() || ''
                                : '';
                    } catch (e) {
                        ext = '';
                    }

                    console.log('ext->', ext);
                    let mime = getMimeByExt(ext);

                    if (
                        !mime &&
                        response.mediaType === 'video' &&
                        response.source === 'select'
                    ) {
                        mime = 'video/mp4';
                        ext = 'mp4';
                    }

                    if (ext === 'mov') {
                        ext = 'mp4';
                        mime = 'video/mp4';
                    }

                    let uri = decodeURI(response.assets[0].uri);

                    if (response.mediaType === POST_MEDIA_TYPE_VIDEO) {
                        // Start the progress indicator because compression might be slow
                        // TODO: Show more granular, user-friendly messaging

                        setProgressIndicator('busy');
                        const fileInfo = await fs.stat(uri);
                        const fileSizeMb = fileInfo.size / (1024 * 1024);
                        // FIXME: Temporarily preventing files greater than 1000mb from being
                        // uploaded because large videos crash clients. (~50mb post compression)
                        if (fileSizeMb > 1000) {
                            alert(
                                'Max video upload size is currently 1000mb. Please choose a smaller video.',
                            );
                            return;
                        }
                    }

                    const params = {
                        uri: uri,
                        ext: ext,
                        type: mime,
                        name:
                            Platform.OS === 'android' &&
                            response.source === 'select'
                                ? response.assets[0].fileName.split('.')[0]
                                : '',
                    };

                    if (!uri) {
                        console.log('ERROR: No uri found for asset');
                        setProgressIndicator('');
                        clearMediaState();
                        return;
                    }

                    const mediaUrl = await uploadMediaToS3(
                        params,
                        setProgressIndicator,
                        clearMediaState,
                        progressIndicator,
                    );

                    if (response.mediaType !== POST_MEDIA_TYPE_GALLERY) {
                        postContext.setPostMediaUrl(mediaUrl);
                        postContext.setAddMedia(POST_SUBMITTED);
                    } else {
                        const oldGalleryUris = Object.assign(
                            [],
                            postContext.post.galleryUris,
                        );
                        Image.getSize(mediaUrl, (width, height) => {
                            postContext.setPost({
                                galleryUris: oldGalleryUris.concat([
                                    {
                                        uri: mediaUrl,
                                        width: width,
                                        height: height,
                                    },
                                ]),
                            });
                            postContext.setPostMediaUrl('');
                            postContext.setAddMedia(POST_SUBMITTED);
                        });
                    }
                } catch (err) {
                    console.log(
                        'ERROR: unable to upload media: ',
                        JSON.stringify(err),
                    );
                    alert('Unable to upload media - please try again.');
                    postContext.setAddMedia(POST_EMPTY);
                    postContext.setPostMediaType(DEFAULT_POST_MEDIA_TYPE);
                    setProgressIndicator('');
                    return;
                }
            }
        })();
    }, [response]);

    return (
        <>
            <MediaPreview navigation={navigation} />
            <ManageGalleryItemsBar
                chooseMediaArtifactImageAndAddToGallery={
                    chooseMediaArtifactImageAndAddToGallery
                }
            />
            <LineSeperator style={{marginTop: 0}} />
            <ChooseMediaBar
                progressIndicator={progressIndicator}
                chooseMediaArtifactImage={chooseMediaArtifactImage}
                chooseMediaArtifactVideo={chooseMediaArtifactVideo}
                chooseMediaArtifactAudio={chooseMediaArtifactAudio}
                chooseMediaArtifactFile={chooseMediaArtifactFile}
                addProposal={addProposal}
            />
        </>
    );
}

function ChooseMediaBar({
    progressIndicator,
    chooseMediaArtifactImage,
    chooseMediaArtifactVideo,
    chooseMediaArtifactFile,
    addProposal,
}) {
    const postContext = React.useContext(PostStateContext);
    const isProposalPost = postContext.post.type === POST_TYPE_PROPOSAL;
    const shouldShowProposalButton = false;
    // postContext.post.type === POST_TYPE_PROPOSAL ||
    // postContext.post.type === DEFAULT_POST_TYPE;
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
                    if (
                        !postContext.post.mediaUrl ||
                        !(
                            postContext.post.galleryUris &&
                            postContext.post.galleryUris.length
                        )
                    ) {
                        chooseMediaArtifactImage();
                    }
                }}>
                <FastImage
                    style={Styles.addPhoto}
                    source={postContext.photoIcon}
                />
            </TouchableOpacity>

            <TouchableOpacity
                hitSlop={{left: 10, right: 10, bottom: 10, top: -3}}
                onPress={chooseMediaArtifactVideo}>
                <FastImage
                    style={Styles.addVideo}
                    source={postContext.videoIcon}
                />
            </TouchableOpacity>

            {/*<TouchableOpacity
                hitSlop={{left: 10, right: 10, bottom: 10, top: 0}}
                onPress={chooseMediaArtifactAudio}>
                <FastImage
                    style={Styles.addAudio}
                    source={postContext.audioIcon}
                />
            </TouchableOpacity>*/}
            {/* Files currently super broken, will add back later */}
            {false && (
                <TouchableOpacity
                    hitSlop={{left: 20, right: 25, bottom: 15, top: 15}}
                    style={{...Styles.addFile, marginTop: 12}}
                    onPress={chooseMediaArtifactFile}>
                    <Icon
                        color={
                            !postContext.post?.fileUris?.length
                                ? 'white'
                                : postContext.mediaType ===
                                      POST_MEDIA_TYPE_FILE &&
                                  postContext.addMedia === POST_SUBMITTING
                                ? '#f66d87'
                                : postContext.addMedia === POST_SUBMITTED &&
                                  postContext.post.fileUris?.length
                                ? '#689bea'
                                : 'white'
                        }
                        name={'file'}
                        size={30}
                    />
                </TouchableOpacity>
            )}
            {shouldShowProposalButton && (
                <TouchableOpacity
                    hitSlop={{left: 10, right: 10, bottom: 10, top: 0}}
                    onPress={addProposal}>
                    <FontAwesome5
                        name="lightbulb"
                        color={isProposalPost ? '#689bea' : 'white'}
                        size={30}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

function ManageGalleryItemsBar({chooseMediaArtifactImageAndAddToGallery}) {
    const postContext = React.useContext(PostStateContext);
    const deleteMediaUrlFromGallery = index => {
        Alert.alert('Delete photo', 'Are you sure?', [
            {text: 'no', onPress: () => log('Pressed no'), style: 'cancel'},
            {
                text: 'yes',
                onPress: () => {
                    if (index > -1 && postContext.post.galleryUris[index]) {
                        const newGalleryUris = [
                            ...postContext.post.galleryUris,
                        ];
                        newGalleryUris.splice(index, 1);
                        postContext.setPost({
                            galleryUris: newGalleryUris,
                        });
                    }

                    (!postContext.post.galleryUris.length ||
                        !postContext.post.mediaUrl) &&
                        postContext.setAddMedia(POST_EMPTY);
                },
            },
        ]);
    };

    return postContext.post.galleryUris.length ? (
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
                        disabled={postContext.addMedia !== POST_SUBMITTED}
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
                data={postContext.post.galleryUris}
                extraData={postContext.post.galleryUris}
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
        flexDirection: 'row',
        resizeMode: 'contain',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 10,
    },

    addPhoto: {
        height: 30,
        width: 30,
        resizeMode: 'contain',
        justifyContent: 'center',
        alignItems: 'center',
    },

    addVideo: {
        height: 40,
        width: 40,
        resizeMode: 'contain',
        justifyContent: 'center',
        alignItems: 'center',
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
