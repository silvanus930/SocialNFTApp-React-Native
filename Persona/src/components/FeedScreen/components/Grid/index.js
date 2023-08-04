import React, {useRef} from 'react';
import {
    ActivityIndicator,
    Animated as RNAnimated,
    RefreshControl,
    Text,
    View,
} from 'react-native';

import {AnimatedFlashList} from '@shopify/flash-list';

import {CREATE_POST_CONTAINER_HEIGHT} from 'components/ForumCreatePost';

import {colors, fonts, baseText} from 'resources';

import styles from './styles';

import {HEADER_HEIGHT} from 'state/AnimatedHeaderState';

const Grid = props => {
    return React.useMemo(() => <GridWrapped {...props} />, [props]);
};

const GridWrapped = ({
    onScroll,
    numColumns = 2,
    name,
    noMoreDocs,
    data,
    refreshing,
    keyExtractor,
    onRefresh,
    handleViewableItemsChanged,
    onEndReached,
    displayHeader = false,
    renderGridItem,
    showCreatePost = true,
    communityID,
}) => {
    const animatedOffset = useRef(new RNAnimated.Value(0)).current;

    return data?.length > 0 ? (
        <>
            <View style={{height: 15}} />
            <AnimatedFlashList
                estimatedItemSize={110}
                removeClippedSubviews={true}
                numColumns={numColumns}
                showsVerticalScrollIndicator={false}
                data={data}
                keyExtractor={keyExtractor}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.text}
                        enabled={true}
                    />
                }
                onScroll={onScroll}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={{
                    viewAreaCoveragePercentThreshold: 0,
                    minimumViewTime: 250, // in ms
                }}
                onEndReached={onEndReached}
                renderItem={renderGridItem}
                ListHeaderComponent={<View style={{height: HEADER_HEIGHT}} />}
                ListFooterComponent={
                    noMoreDocs ? (
                        <View style={{height: CREATE_POST_CONTAINER_HEIGHT}} />
                    ) : (
                        <ActivityIndicator
                            size="large"
                            style={{marginTop: 60}}
                            color={colors.text}
                        />
                    )
                }
            />
        </>
    ) : (
        <>
            <View style={styles.noPostsContainer}>
                <Text
                    style={{
                        ...baseText,
                        color: colors.text,
                        fontFamily: fonts.semibold,
                    }}>
                    no posts
                </Text>
            </View>
        </>
    );
};

export default Grid;
