import React, {useCallback, useContext, memo} from 'react';
import {
    Animated as RNAnimated,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';
import {default as Icon} from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import pluralize from 'pluralize';

import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {colors, palette, images} from 'resources';
import getResizedImageUrl from 'utils/media/resize';

import {propsAreEqual} from 'utils/propsAreEqual';

import styles, {SIZE} from './styles';

function CommunityDetails({
    animatedHeaderOptions,
    personaID,
    communityID,
    fullHeaderVisible,
}) {
    const {
        current: {userMap, personaMap},
    } = useContext(GlobalStateRefContext);
    const communityContextRef = useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    let community = personaID
        ? personaMap[personaID]
        : communityMap[communityID];

    let numMembers = personaID
        ? personaMap[personaID]?.authors?.filter(
              key => userMap[key]?.human || key === auth().currentUser.uid,
          ).length
        : communityMap[communityID]?.members?.filter(
              key => userMap[key]?.human || key === auth().currentUser.uid,
          ).length;

    let navigation = useNavigation();

    const navToSettings = useCallback(
        () => navigation.navigate('Settings'),
        [navigation],
    );

    const AnimatedFastImage = RNAnimated.createAnimatedComponent(FastImage);
    const scale = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [50, 100],
        outputRange: [1, 0.6],
        extrapolate: 'clamp',
    });
    const opacity = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    return (
        <TouchableWithoutFeedback
            style={styles.touchContainer}
            delayPressIn={130}
            onPress={navToSettings}>
            <View style={{marginStart: 15, flexDirection: 'row'}}>
                <AnimatedFastImage
                    source={{
                        uri: community?.profileImgUrl
                            ? getResizedImageUrl({
                                  origUrl: community.profileImgUrl,
                                  width: SIZE,
                                  height: SIZE,
                              })
                            : images.personaDefaultProfileUrl,
                    }}
                    style={styles.image(scale)}
                />
                <View style={styles.titleContainer}>
                    <View style={styles.nameContainer}>
                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            style={styles.nameText}>
                            {community?.name}
                        </Text>
                        <Icon
                            color={colors.navSubProminent}
                            name={'chevron-right'}
                            size={palette.header.icon.size - 4}
                        />
                    </View>
                    <RNAnimated.View style={styles.bioContainer(opacity)}>
                        <Text style={styles.bioText}>
                            <FontAwesome
                                name={community?.private ? 'eye-slash' : 'eye'}
                                color={colors.navSubProminent}
                                style={{marginRight: 10, right: 10, top: 0}}
                                size={18}
                            />
                            {true ? '  ' : ''}
                            {community?.private ? 'Private ' : 'Public '}
                            {personaID ? 'Channel' : 'Community'}
                            {' • '}
                            {`${numMembers} ${pluralize('member', numMembers)}`}
                        </Text>
                    </RNAnimated.View>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

export default memo(CommunityDetails, propsAreEqual);
