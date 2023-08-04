import React, {useState, memo} from 'react';
import {Animated as RNAnimated, Platform, View} from 'react-native';

import styles from './styles';
import CommunityPreview from '../CommunityPreview';

const CommunityMembership = memo(({animatedHeaderOptions, persona}) => {
    const [hidden, setHidden] = useState(false);
    animatedHeaderOptions.scrollY.addListener(({value}) => {
        if (value > 75) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    const opacity = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    if (hidden && Platform.OS !== 'android') {
        return null;
    }

    return (
        <RNAnimated.View
            style={styles.animContainer(opacity)}
            pointerEvents={hidden ? 'none' : 'auto'}>
            <View style={styles.container}>
                <CommunityPreview persona={persona} />
            </View>
        </RNAnimated.View>
    );
});

export default CommunityMembership;
