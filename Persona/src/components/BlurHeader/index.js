import React, {useEffect, useState, useContext} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    LayoutAnimation,
    Keyboard,
    Animated,
    Pressable,
    ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import BlurContainer from 'components/BlurContainer';
import FastImage from 'react-native-fast-image';

import {images} from 'resources';

import styles, {HEADER_BUTTONS_HIT_SLOP} from './styles';

const BlurHeader = ({
    title,
    onPressGoBack,
    onPressShowOptions,
    leftComponent,
    centerComponent,
    rightCompoent,
    centerContainerStyle = null,
}) => {
    const navigation = useNavigation();

    const onPressGoBackDefault = () => {
        navigation.goBack();
    };

    return (
        <BlurContainer
            blurType={'chromeMaterialDark'}
            blurRadius={11}
            blurAmount={1}
            reducedTransparencyFallbackColor="black"
            style={styles.blurContainer}>
            <View style={styles.container}>
                <View style={styles.innerContainer}>
                    <View style={styles.innerLeftContainer}>
                        <Pressable
                            onPress={onPressGoBack || onPressGoBackDefault}
                            hitSlop={HEADER_BUTTONS_HIT_SLOP}>
                            <FastImage
                                source={images.headerBackArrow}
                                style={styles.iconBackArrow}
                            />
                        </Pressable>
                    </View>
                    <View
                        style={[
                            styles.innerCenterContainer,
                            centerContainerStyle,
                        ]}>
                        {centerComponent && centerComponent}
                        {!centerComponent && (
                            <Text style={styles.titleText}>{title}</Text>
                        )}
                    </View>
                    <View style={styles.innerRightContainer}>
                        {onPressShowOptions && (
                            <Pressable
                                onPress={onPressShowOptions}
                                hitSlop={HEADER_BUTTONS_HIT_SLOP}>
                                <FastImage
                                    source={images.headerOptions}
                                    style={styles.iconOptions}
                                />
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
        </BlurContainer>
    );
};

export default BlurHeader;
