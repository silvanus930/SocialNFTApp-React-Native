import React, {useCallback} from 'react';
import {Text} from 'react-native';
import {TabBar} from 'react-native-tab-view';

import BlurContainer from 'components/BlurContainer';

import styles from './styles';

const SearchTabBar = props => {
    const renderTabLabel = useCallback(
        ({route, color}) => <Text style={{color}}>{route.name}</Text>,
        [],
    );

    return (
        <BlurContainer
            blurType={'chromeMaterialDark'}
            blurRadius={11}
            blurAmount={1}
            reducedTransparencyFallbackColor="#424547">
            <TabBar
                {...props}
                indicatorStyle={styles.indicator}
                tabStyle={styles.tab}
                scrollEnabled={true}
                contentContainerStyle={{}}
                renderLabel={renderTabLabel}
                inactiveColor="#D0D3D6"
                style={styles.tabBar}
            />
        </BlurContainer>
    );
};

export default SearchTabBar;
