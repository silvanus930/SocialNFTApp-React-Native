import React, {useState} from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import isEqual from 'lodash.isequal';
import {StyleSheet, Dimensions, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import colors from 'resources/colors';
import PinchToZoom from './PinchToZoom';
import getResizedImageUrl from 'utils/media/resize';
import {POST_IMAGE_SCALE_MULTIPLIER} from 'utils/media/constants';

export const imageSizes = {
    mini: 50,
    thumbnail: 75,
    small: Dimensions.get('window').width / 2,
    grid: Dimensions.get('window').width / 3,
    full: Dimensions.get('window').width,
};

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(PostImage, propsAreEqual);
function PostImage({
    enableZoom = false,
    style = {},
    post,
    offset = 0,
    size,
    fixedWidth,
    feed = false,
    small = false,
    mediaDisabled = false,
    personaKey = '',
    postKey = '',
}) {
    let imageSize;
    if (small) {
        // Maintain backwards compatibility for now
        imageSize = imageSizes.small;
    } else {
        imageSize = imageSizes[size];
    }
    let premeasuredHeight = 0;
    const premeasuredWidth = fixedWidth
        ? fixedWidth
        : Dimensions.get('window').width - offset;
    const [imageWidth, setImageWidth] = useState(premeasuredWidth);

    if (post?.mediaWidth > 0 && post?.mediaHeight > 0) {
        premeasuredHeight =
            (premeasuredWidth * post.mediaHeight) / post.mediaWidth;
    }

    if (feed) {
        premeasuredHeight = Math.min(
            premeasuredHeight,
            Dimensions.get('window').height * 0.55,
        );
    }

    /*console.log(
    'PostImage reporting premeasuredHeight premeasuredWidth',
    premeasuredHeight,
    premeasuredWidth,
  );*/
    const [imageHeight, setImageHeight] = useState(premeasuredHeight);

    //console.log('PostImage imageHeight', imageHeight);
    /**
     * This function uses native events to set the image height
     *
     * @param data
     * @param data.nativeEvent
     * @param data.nativeEvent.width
     * @param data.nativeEvent.height
     */
    async function onImageLoaded(data) {
        const {height, width} = data.nativeEvent;
        const scale = height / width;
        let newHeight = scale !== Infinity ? scale * imageWidth : 0;
        let wheight = Dimensions.get('window').height;
        if (feed) {
            newHeight = Math.min(newHeight, wheight * 0.55);
        }

        if (!post?.mediaWidth || !post?.mediaHeight) {
            const docRef = firestore()
                .collection('personas')
                .doc(personaKey)
                .collection('posts')
                .doc(postKey);
            const docResult = await docRef.get();

            if (docResult.exists) {
                docRef.set(
                    {
                        mediaWidth: width,
                        mediaHeight: height,
                        userIDMediaUpdate: auth().currentUser.uid,
                    },
                    {merge: true},
                );
            } else {
                console.log(
                    'no document exists! not setting',
                    `personas/${personaKey}/posts/${postKey}`,
                );
            }
        }
        if (imageSize) {
            setImageWidth(imageSize);
            setImageHeight(scale * imageSize);
        }
    }

    const dummySize = imageSize
        ? imageSize
        : imageHeight > 0
        ? imageHeight
        : 510;

    let dummyWidth;
    if (size && size === 'small') {
        dummyWidth = 90;
    } else if (size && size === 'thumbnail') {
        dummyWidth = 50;
    } else {
        dummyWidth = imageWidth;
    }

    const Styles = StyleSheet.create({
        postImg: {
            width:
                size === 'grid'
                    ? Dimensions.get('window').width / 3
                    : imageWidth,
            height:
                size === 'grid'
                    ? Dimensions.get('window').width / 3
                    : imageHeight,
            justifyContent: size === 'grid' ? 'center' : null,
            alignItems: size === 'grid' ? 'center' : null,
            alignSelf: size === 'grid' ? 'center' : null,
            borderColor: 'red',
            borderWidth: 0,
            backgroundColor: colors.defaultImageBackground,
        },

        postImgLoading: {
            alignSelf: 'center',
            width: dummyWidth,
            height: dummySize,
            backgroundColor: colors.loadingBackground,
        },
    });

    return post.mediaUrl || post.imgUrl ? ( // TODO deprecate imgUrl
        <View
            style={{
                alignSelf: 'center',
                marginTop: size === 'grid' || size === 'small' ? 0 : 6,
                marginBottom: size === 'grid' || size === 'small' ? 0 : 6,
                zIndex: size === 'grid' ? -999999999 : -999999999,
            }}>
            {imageHeight === 0 && (
                <View style={{...Styles.postImgLoading, ...style}} />
            )}
            <PinchToZoom disabled={!enableZoom}>
                <FastImage
                    source={{
                        uri: getResizedImageUrl({
                            origUrl: post.mediaUrl
                                ? post.mediaUrl
                                : post.imgUrl,
                            width:
                                size === 'grid' || size === 'small'
                                    ? Styles.postImg.width
                                    : Styles.postImg.width *
                                      POST_IMAGE_SCALE_MULTIPLIER,
                        }),
                    }}
                    style={{...Styles.postImg, ...style}}
                    onLoad={onImageLoaded}
                />
            </PinchToZoom>
        </View>
    ) : (
        <></>
    );
}
