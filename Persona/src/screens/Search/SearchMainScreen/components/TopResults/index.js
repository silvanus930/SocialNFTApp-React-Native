import React, {useCallback, useMemo, useContext} from 'react';
import {View, Text, SectionList} from 'react-native';
import auth from '@react-native-firebase/auth';
import {connectInfiniteHits} from 'react-instantsearch-native';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateContext} from 'state/GlobalState';

import CommunityItem from 'screens/Search/SearchMainScreen/components/CommunityItem';
import PeopleItem from 'screens/Search/SearchMainScreen/components/PeopleItem';
import ChatItem from 'screens/Search/SearchMainScreen/components/ChatItem';
import {isOwnChat} from 'screens/Search/utils/helpers';

import styles from './styles';

const TopResults = connectInfiniteHits(
    ({
        filterCommunities,
        refineNext,
        hasMore,
        filteredUsers,
        hits,
        regexPattern,
    }) => {
        const currentUserId = auth().currentUser.uid;

        const {personaMap} = useContext(GlobalStateContext);
        const {communityMap} = useContext(CommunityStateContext);

        const renderItem = useCallback(
            ({item, section}) => {
                switch (section.type) {
                    case 'channel':
                        return (
                            <CommunityItem {...{data: item, regexPattern}} />
                        );
                    case 'people':
                        return <PeopleItem {...{data: item, regexPattern}} />;
                    case 'chat':
                        return <ChatItem {...{data: item, regexPattern}} />;
                    default:
                        return null;
                }
            },
            [regexPattern],
        );

        const filteredHits = useCallback(
            () =>
                hits.filter(item =>
                    isOwnChat({
                        item,
                        communityMap,
                        personaMap,
                        currentUserId,
                    }),
                ) || [],
            [hits, personaMap, communityMap, currentUserId],
        );

        const data = useMemo(
            () => [
                {
                    title: 'People',
                    type: 'people',
                    data: filteredUsers.slice(0, 6),
                },
                {
                    title: 'Channels',
                    type: 'channel',
                    data: filterCommunities.slice(0, 6),
                },
                {
                    title: 'Chats/Posts',
                    data: filteredHits(),
                    type: 'chat',
                },
            ],
            [filteredUsers, filteredHits, filterCommunities],
        );

        const keyExtractor = useMemo(
            () => item => {
                return item.personaId || item.key || item.id || item.objectID;
            },
            [],
        );

        return (
            <SectionList
                style={styles.container}
                sections={data}
                stickySectionHeadersEnabled={false}
                renderSectionHeader={({section: {title, data}}) =>
                    data?.length ? (
                        <Text style={styles.title}>{title}</Text>
                    ) : null
                }
                renderSectionFooter={({section: {data, type}}) =>
                    data?.length && type !== 'chat' ? (
                        <View style={styles.separator} />
                    ) : null
                }
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                onEndReached={() => hasMore && refineNext()}
            />
        );
    },
);

export default React.memo(TopResults);
