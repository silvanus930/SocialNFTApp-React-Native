import React, {useCallback} from 'react';
import {View, Text, Switch, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles, {SWITCH_COLORS} from './styles';
import {images, colors} from 'resources';

const ToggleItem = ({
    icon,
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
    iconType = 'Entypo',
}) => {
    const navigation = useNavigation();

    const onPressHandler = useCallback(() => {
        if (onPress) {
            onPress();
            return;
        }

        if (navigateToScreen) {
            navigation.navigate(navigateToScreen, navigateToParams);
        }
    }, [onPress, navigateToScreen, navigation, navigateToParams]);

    const Container = onPress || navigateToScreen ? TouchableOpacity : View;

    return (
        <View style={styles.container({isLastItem})}>
            <Container onPress={onPressHandler} style={styles.innerContainer}>
                <View>
                    {iconType === 'Entypo' ? (
                        <Icon name={icon} color={colors.postAction} size={25} />
                    ) : (
                        <Ionicons
                            name={icon}
                            color={colors.postAction}
                            size={25}
                        />
                    )}
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText({color: titleColor})}>
                        {title}
                    </Text>
                </View>
                <View>
                    {subtextComponent && subtextComponent}
                    {!subtextComponent && (
                        <Text style={styles.subtextText({color: subtextColor})}>
                            {subtext}
                        </Text>
                    )}
                </View>
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

export default ToggleItem;
