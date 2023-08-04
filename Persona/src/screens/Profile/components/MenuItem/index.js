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
    Switch,
    TouchableOpacity,
    ImageBackground,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';

import styles, {SWITCH_COLORS} from './styles';
import {images} from 'resources';

const MenuItem = ({
    icon,
    header,
    headerColor,
    title,
    titleColor,
    subtext,
    subtextColor,
    subtextComponent,
    onPress,
    toggleSwitch,
    navigateToScreen,
    navigateToParams = {},
    isLastItem = false,
    children,
}) => {
    const navigation = useNavigation();
    const Container = onPress || navigateToScreen ? TouchableOpacity : View;

    const onPressHandler = useCallback(() => {
        if (onPress) {
            onPress();
            return;
        }

        if (navigateToScreen) {
            navigation.navigate(navigateToScreen, navigateToParams);
        }
    }, [navigateToScreen, navigateToParams, onPress]);

    return (
        <View style={styles.container({isLastItem})}>
            <Container onPress={onPressHandler} style={styles.innerContainer}>
                {children && children}
                {!children && (
                    <>
                        {icon && images[icon] && (
                            <View>
                                <FastImage
                                    source={images[icon]}
                                    style={styles.icon(icon)}
                                />
                            </View>
                        )}
                        <View style={styles.titleContainer}>
                            {header && (
                                <Text
                                    style={styles.headerText({
                                        color: headerColor,
                                    })}>
                                    {header}
                                </Text>
                            )}
                            <Text style={styles.titleText({color: titleColor})}>
                                {title}
                            </Text>
                        </View>
                        <View>
                            {subtextComponent && subtextComponent}
                            {!subtextComponent && (
                                <Text
                                    style={styles.subtextText({
                                        color: subtextColor,
                                    })}>
                                    {subtext}
                                </Text>
                            )}
                        </View>
                    </>
                )}
                <View style={styles.navContainer}>
                    {toggleSwitch && (
                        <Switch
                            trackColor={{
                                false: SWITCH_COLORS.TRACK_FALSE,
                                true: SWITCH_COLORS.TRACK_TRUE,
                            }}
                            thumbColor={
                                toggleSwitch.value
                                    ? SWITCH_COLORS.STATE_ON
                                    : SWITCH_COLORS.STATE_OFF
                            }
                            ios_backgroundColor={SWITCH_COLORS.IOS_BACKGROUND}
                            value={
                                toggleSwitch.value ||
                                toggleSwitch.value === undefined
                            }
                            onValueChange={toggleSwitch.toggle}
                            style={styles.switch}
                        />
                    )}

                    {navigateToScreen && (
                        <FastImage
                            source={images.menuItemNavArrow}
                            style={styles.navArrow}
                        />
                    )}
                </View>
            </Container>
        </View>
    );
};

export default MenuItem;
