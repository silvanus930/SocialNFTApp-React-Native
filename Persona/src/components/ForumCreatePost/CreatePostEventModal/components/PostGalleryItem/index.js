import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {colors} from 'resources';
import styles from './styles';

import getResizedImageUrl from 'utils/media/resize';

const PostGalleryItem = ({
    item,
    deleteFileUrlFromFileUrls,
    deleteMediaUrlFromGallery,
}) => {
    const isFile = item?.type === 'file';
    const isVideo = item?.uri.slice(-3) === 'mp4';
    const isImage = !(isFile || isVideo);
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.closeButtonContainer}
                onPress={() => {
                    item?.type === 'file'
                        ? deleteFileUrlFromFileUrls(item.uri)
                        : deleteMediaUrlFromGallery(item.uri);
                }}>
                <Ionicons color={'#1B1D1F'} name="close" size={25} />
            </TouchableOpacity>
            {isFile && (
                <View style={styles.fileContainerStyle}>
                    <Icon name={'file'} color={colors.postAction} size={80} />
                    <Text style={styles.fileNameText}>{item?.name}</Text>
                </View>
            )}
            {isVideo && (
                <Video
                    source={{uri: item?.uri}}
                    style={styles.videoItem}
                    resizeMode="cover"
                    repeat={true}
                    paused={true}
                />
            )}
            {isImage && (
                <FastImage
                    style={styles.imageItem}
                    source={{
                        uri: getResizedImageUrl({
                            origUrl: item.uri,
                            width: 200,
                            height: 200,
                        }),
                    }}
                />
            )}
        </View>
    );
};

export default PostGalleryItem;
