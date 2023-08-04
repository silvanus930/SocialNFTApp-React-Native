import React, {useState, useRef} from 'react';
import {Dimensions, View, Platform} from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import Pinachable from 'react-native-pinchable';
import Carousel, {Pagination} from 'react-native-snap-carousel';
import isEqual from 'lodash.isequal';

import getResizedImageUrl from 'utils/media/resize';
import {POST_IMAGE_SCALE_MULTIPLIER} from 'utils/media/constants';
import styles from './styles';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(PostGallery, propsAreEqual);
function PostGallery({feed = false, style = {}, post, index, registerMe}) {
    const isCarousel = useRef(null);
    const [position, setPosition] = useState(0);
    const [player, setPlayer] = useState(null);
    const [paused, setPaused] = useState(false);

    const galleryUris = post?.galleryUris ? post.galleryUris : [];
    if (!galleryUris.length) {
        return <View />;
    }

    const stop = () => typeof paused !== undefined && setPaused(false);
    const start = () => typeof paused !== undefined && setPaused(true);

    const scaledWidth = Dimensions.get('window').width * 0.8;
    const scaledUris = galleryUris.map(uri => {
        const scale = uri.height / uri.width;
        const scaledHeight = scale !== Infinity ? scaledWidth * scale : 0;
        return {
            source: uri.uri,
            dimensions: {
                width: Math.floor(scaledWidth),
                height: Math.floor(scaledHeight),
            },
            scaledWidth: Math.floor(scaledWidth),
            scaledHeight: Math.floor(scaledHeight),
        };
    });

    let maxUriHeight = scaledUris.length
        ? Math.max(...scaledUris.map(uri => uri.scaledHeight))
        : 1;
    let maxImageSize = maxUriHeight
        ? maxUriHeight
        : Dimensions.get('window').height / 2; // todo loop through images and select largest size

    if (feed) {
        maxImageSize = Math.min(
            maxImageSize,
            Dimensions.get('window').height * 0.55,
        );
    }
    const renderItem = ({item}) => {
        const mediaUrl = item.source;
        if (!mediaUrl) {
            return <></>;
        }
        const videoWidth = scaledWidth;
        const videoHeight = feed
            ? Math.min(
                  item.scaledHeight,
                  Dimensions.get('window').height * 0.55,
              )
            : item.scaledHeight;
        const imageWidth =
            Platform.OS === 'ios' ? scaledWidth : scaledWidth - 10;
        const imageHeight = feed
            ? Math.min(
                  item.scaledHeight,
                  Dimensions.get('window').height * 0.55,
              )
            : item.scaledHeight;
        return (
            <View style={styles.itemContainer(maxUriHeight)}>
                {mediaUrl.slice(-3) === 'mp4' ? (
                    <Pinachable key={mediaUrl}>
                        <Video
                            source={{uri: mediaUrl}}
                            style={[
                                style,
                                styles.videoItemStyle(videoWidth, videoHeight),
                            ]}
                            controls={true}
                            resizeMode="contain"
                            repeat={true}
                            paused={true}
                            ref={ref => {
                                if (registerMe && ref) {
                                    // console.log('registering a video player at index', index);
                                    registerMe({
                                        type: 'video',
                                        stop: start,
                                        start: stop,
                                        startPaused: true,
                                        index: index,
                                    });
                                } else {
                                    setPlayer(ref);
                                }
                            }}
                        />
                    </Pinachable>
                ) : (
                    <Pinachable key={mediaUrl}>
                        <FastImage
                            source={{
                                uri: getResizedImageUrl({
                                    maxHeight: feed,
                                    origUrl: mediaUrl,
                                    width:
                                        scaledWidth *
                                        POST_IMAGE_SCALE_MULTIPLIER,
                                }),
                            }}
                            style={[
                                style,
                                styles.imageItemStyle(imageWidth, imageHeight),
                            ]}
                        />
                    </Pinachable>
                )}
            </View>
        );
    };

    return galleryUris.length ? (
        <View style={styles.container(maxImageSize)}>
            <Carousel
                layout="stack"
                layoutCardOffset={15}
                ref={isCarousel}
                data={scaledUris}
                renderItem={renderItem}
                sliderWidth={Dimensions.get('window').width * 0.9}
                itemWidth={scaledWidth}
                onSnapToItem={itemIndex => setPosition(itemIndex)}
            />
            <View style={styles.paginationContainer}>
                <Pagination
                    dotsLength={scaledUris.length}
                    activeDotIndex={position}
                    carouselRef={isCarousel}
                    dotStyle={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        marginHorizontal: 0,
                        marginVertical: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    }}
                    inactiveDotOpacity={0.4}
                    inactiveDotScale={0.6}
                    tappableDots={true}
                />
            </View>
        </View>
    ) : (
        <></>
    );
}
