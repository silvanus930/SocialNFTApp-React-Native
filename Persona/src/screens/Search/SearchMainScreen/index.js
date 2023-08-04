import React, {
    useCallback,
    useMemo,
    useEffect,
    useContext,
    useState,
    useRef,
} from 'react';
import {View, Text} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import algoliasearch from 'algoliasearch';
import {FlashList} from '@shopify/flash-list';
import {InstantSearch} from 'react-instantsearch-native';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateContext} from 'state/GlobalState';

import BlurContainer from 'components/BlurContainer';
import SearchBox from 'screens/Search/SearchMainScreen/components/SearchBox';
import HitCount from 'screens/Search/SearchMainScreen/components/HitCount';
import TopResults from 'screens/Search/SearchMainScreen/components/TopResults';
import RecentSearch from 'screens/Search/SearchMainScreen/components/RecentSearch';
import EmptySearch from 'screens/Search/SearchMainScreen/components/EmptySearch';
import SearchTabBar from 'screens/Search/SearchMainScreen/components/SearchTabBar';
import ChatLists from 'screens/Search/SearchMainScreen/components/ChatLists';
import PostLists from 'screens/Search/SearchMainScreen/components/PostLists';
import CommunityItem from 'screens/Search/SearchMainScreen/components/CommunityItem';
import PeopleItem from 'screens/Search/SearchMainScreen/components/PeopleItem';
import {handlePopulateApiList, filters} from 'screens/Search/utils/helpers';

import styles from './styles';

const Tab = createMaterialTopTabNavigator();

const searchClient = algoliasearch(
    'HK29ZBFEW6',
    '1a7130a5cd6d2b2033489853cb87dc96',
);

const algoliaIndexName = 'dev_persona';

const navigatorScreenOption = {
    lazy: true,
    swipeEnabled: true,
    removeClippedSubviews: true,
    tabBarLabelStyle: styles.tabNavigator,
};

const SearchScreen = () => {
    const inputRef = useRef();
    const currentUserId = auth().currentUser.uid;
    const {userMap} = useContext(GlobalStateContext);
    const {personaMap} = useContext(GlobalStateContext);
    const {communityMap} = useContext(CommunityStateContext);
    const [prevSearch, setPrevSearch] = useState([]);
    const [{communityLists, userLists}, setState] = useState({
        communityLists: [],
        userLists: [],
    });
    const [searchVal, setSearchVal] = useState('');
    const [chatIsEmpty, setChatIsEmpty] = useState(false);

    useEffect(() => {
        const {entireUsers, communities} = handlePopulateApiList({
            communityMap,
            userMap,
            personaMap,
            currentUserId,
        });
        setState({
            userLists: entireUsers,
            communityLists: communities,
        });
    }, [communityMap, personaMap, currentUserId, userMap]);

    useEffect(() => {
        (async () => {
            const prev = await AsyncStorage.getItem('prevSearch');
            if (prev) {
                setPrevSearch(JSON.parse(prev));
            }
        })();
    }, []);

    const filterCommunities = useMemo(() => {
        return filters.filterCommunities({communityLists, searchVal});
    }, [communityLists, searchVal]);

    const filteredUsers = useMemo(() => {
        return filters.filterUsers({userLists, searchVal});
    }, [userLists, searchVal]);

    const regexPattern = useMemo(() => new RegExp(searchVal, 'i'), [searchVal]);

    const counts = useMemo(() => {
        const {length: filteredUserCount} = filteredUsers || [];
        const {length: filteredCommunityCount} = filterCommunities || [];

        const isEmpty = !(
            filteredCommunityCount ||
            filteredUserCount ||
            !chatIsEmpty
        );

        return {
            filteredUserCount,
            filteredCommunityCount,
            isEmpty,
        };
    }, [filterCommunities, chatIsEmpty, filteredUsers]);

    const keyExtractor = useMemo(
        () => item => {
            return item.personaId || item.key || item.id || item.objectID;
        },
        [],
    );

    const renderTabBar = useCallback(props => <SearchTabBar {...props} />, []);

    const renderPeople = useCallback(() => {
        return (
            <FlashList
                contentContainerStyle={styles.pageContainer}
                removeClippedSubviews={false}
                bounces={true}
                data={filteredUsers}
                ListEmptyComponent={
                    <View style={styles.noResultContainer}>
                        <Text style={styles.noResultText}>No results</Text>
                    </View>
                }
                keyExtractor={keyExtractor}
                renderItem={({item}) => (
                    <PeopleItem {...{data: item, regexPattern}} />
                )}
            />
        );
    }, [filteredUsers, keyExtractor, regexPattern]);

    const renderCommunities = useCallback(() => {
        return (
            <FlashList
                contentContainerStyle={styles.pageContainer}
                removeClippedSubviews={false}
                bounces={true}
                data={filterCommunities}
                ListEmptyComponent={
                    <View style={styles.noResultContainer}>
                        <Text style={styles.noResultText}>No results</Text>
                    </View>
                }
                keyExtractor={keyExtractor}
                renderItem={({item}) => (
                    <CommunityItem {...{data: item, regexPattern}} />
                )}
            />
        );
    }, [filterCommunities, keyExtractor, regexPattern]);

    const renderTopResult = useCallback(
        () => (
            <TopResults
                {...{
                    regexPattern,
                    filterCommunities,
                    filteredUsers,
                }}
            />
        ),
        [regexPattern, filterCommunities, filteredUsers],
    );

    const renderChats = useCallback(
        () => (
            <ChatLists
                {...{
                    keyExtractor,
                    regexPattern,
                    setChatIsEmpty,
                }}
            />
        ),
        [keyExtractor, regexPattern, setChatIsEmpty],
    );

    const renderPosts = useCallback(
        () => (
            <PostLists
                {...{
                    keyExtractor,
                    regexPattern,
                    setChatIsEmpty,
                }}
            />
        ),
        [keyExtractor, regexPattern, setChatIsEmpty],
    );

    const renderContent = useCallback(() => {
        const {isEmpty} = counts;

        if (searchVal === '') {
            return prevSearch?.length ? (
                <RecentSearch {...{prevSearch, inputRef, setSearchVal}} />
            ) : null;
        } else if (isEmpty) {
            return <EmptySearch />;
        } else {
            return (
                <Tab.Navigator
                    tabBar={renderTabBar}
                    keyboardDismissMode="none"
                    screenOptions={navigatorScreenOption}
                    lazy={true}>
                    <Tab.Screen
                        name="Top results"
                        component={renderTopResult}
                    />
                    <Tab.Screen name="Channels" component={renderCommunities} />
                    <Tab.Screen name="People" component={renderPeople} />
                    <Tab.Screen name="Chat" component={renderChats} />
                    <Tab.Screen name="Posts" component={renderPosts} />
                </Tab.Navigator>
            );
        }
    }, [
        renderTabBar,
        renderChats,
        renderPosts,
        renderTopResult,
        renderCommunities,
        renderPeople,
        searchVal,
        counts,
        prevSearch,
        inputRef,
    ]);

    return (
        <InstantSearch searchClient={searchClient} indexName={algoliaIndexName}>
            <View style={styles.contentContainer}>{renderContent()}</View>
            <HitCount {...{setChatIsEmpty, chatIsEmpty}} />
            <BlurContainer
                blurType={'chromeMaterialDark'}
                blurRadius={11}
                blurAmount={1}
                reducedTransparencyFallbackColor="#424547"
                style={styles.headerBlurContainer}>
                <View style={styles.headerContainer}>
                    <SearchBox
                        {...{
                            inputRef,
                            searchVal,
                            setSearchVal,
                            prevSearch,
                            setPrevSearch,
                        }}
                    />
                </View>
            </BlurContainer>
        </InstantSearch>
    );
};

export default React.memo(SearchScreen);
