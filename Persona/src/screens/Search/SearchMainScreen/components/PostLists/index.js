import React, {useCallback, useContext} from 'react';
import {View, Text, FlatList} from 'react-native';
import auth from '@react-native-firebase/auth';
import {connectInfiniteHits} from 'react-instantsearch-native';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateContext} from 'state/GlobalState';

import ChatItem from 'screens/Search/SearchMainScreen/components/ChatItem';
import {isOwnChat} from 'screens/Search/utils/helpers';

import styles from './styles';

const PostLists = connectInfiniteHits(
    ({hits, refineNext, hasMore, keyExtractor, regexPattern}) => {
        const currentUserId = auth().currentUser.uid;

        const {personaMap} = useContext(GlobalStateContext);
        const {communityMap} = useContext(CommunityStateContext);

        const filteredPostHits = useCallback(
            () =>
                hits.filter(
                    item =>
                        item?.messageType === 'post' &&
                        isOwnChat({
                            item,
                            communityMap,
                            personaMap,
                            currentUserId,
                        }),
                ) || [],
            [hits, personaMap, communityMap, currentUserId],
        );

        const renderItem = useCallback(
            ({item}) => <ChatItem {...{data: item, regexPattern}} />,
            [regexPattern],
        );

        const renderEmptyComponent = useCallback(
            () => (
                <View style={styles.noResultContainer}>
                    <Text style={styles.noResultText}>No results</Text>
                </View>
            ),
            [],
        );

        return (
            <FlatList
                style={styles.pageContainer}
                removeClippedSubviews={false}
                bounces={true}
                data={filteredPostHits()}
                onEndReached={() => hasMore && refineNext()}
                ListEmptyComponent={renderEmptyComponent}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
            />
        );
    },
);
export default React.memo(PostLists);
