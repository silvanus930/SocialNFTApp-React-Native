import React from 'react';
import {Animated as RNAnimated, View} from 'react-native';

import TreasuryScreen from 'components/CommunityTreasury';

import colors from 'resources/colors';

const PortfolioScreen = props => {
    const onScroll = RNAnimated.event(
        [{nativeEvent: {contentOffset: {y: props.route.params.offsetY}}}],
        {useNativeDriver: true},
    );

    return (
        <View
            style={{
                backgroundColor: colors.gridBackground,
                flexDirection: 'column',
            }}>
            <TreasuryScreen
                showHeader={false}
                marginTop={20}
                onScroll={onScroll}
            />
        </View>
    );
};

export default PortfolioScreen;
