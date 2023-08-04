import React, {memo, useMemo} from 'react';
import {Animated as RNAnimated, Platform, View} from 'react-native';

import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import MaskedView from '@react-native-masked-view/masked-view';
import getResizedImageUrl from 'utils/media/resize';
import {images, colors} from 'resources';
import {propsAreEqual} from 'utils/propsAreEqual';

import styles from './styles';

const BANNER_HEIGHT = Platform.OS === 'ios' ? 180 : 185;
const AnimatedFastImage = RNAnimated.createAnimatedComponent(FastImage);
const AnimatedBlurView = RNAnimated.createAnimatedComponent(BlurView);
const SIZE = '100%';

function CommunityBack({image, blurAmount}) {
    return useMemo(
        () =>
            Platform.OS === 'ios' ? (
                <MaskedView
                    style={styles.iosMaskViewStyle}
                    maskElement={
                        <LinearGradient
                            colors={colors.gradientColorList}
                            style={{flex: 1}}
                        />
                    }>
                    <AnimatedFastImage
                        source={{
                            uri: image
                                ? getResizedImageUrl({
                                      origUrl: image,
                                      height: BANNER_HEIGHT,
                                      width: SIZE,
                                  })
                                : images.personaDefaultProfileUrl,
                        }}
                        style={styles.image(BANNER_HEIGHT)}
                    />
                    <AnimatedBlurView
                        blurType={'light'}
                        blurRadius={10}
                        blurAmount={10}
                        reducedTransparencyFallbackColor="black"
                        style={styles.iosBlueViewStyle(
                            BANNER_HEIGHT,
                            blurAmount,
                        )}
                    />
                </MaskedView>
            ) : (
                <View style={styles.androidContainer}>
                    <FastImage
                        source={{
                            uri: image
                                ? getResizedImageUrl({
                                      origUrl: image,
                                      height: BANNER_HEIGHT,
                                      width: SIZE,
                                  })
                                : images.personaDefaultProfileUrl,
                        }}
                        style={styles.androidImage(BANNER_HEIGHT)}
                    />
                </View>
            ),
        [blurAmount, image],
    );
}

export default memo(CommunityBack, propsAreEqual);
