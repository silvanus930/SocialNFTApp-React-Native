import React, {
    useEffect,
    useContext,
    useState,
    useCallback,
    useRef,
} from 'react';
import {
    ActivityIndicator,
    Animated as RNAnimated,
    Dimensions,
    RefreshControl,
    View,
} from 'react-native';

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import produce from 'immer';
import {AnimatedFlashList} from '@shopify/flash-list';

import FloatingHeader from 'components/FloatingHeader';
import Loading from 'components/Loading';
import {
    FollowFeedDispatchContext,
    FollowFeedStateContext,
} from 'state/FollowFeedStateContext';
import FeedPost from 'components/FeedPost';

import colors from 'resources/colors';

import {makeRegisterMediaPlayer} from 'utils/media/helpers';

import styles from './styles';

const FollowingGrid =
    (communityID, back) =>
    ({navigation, onScroll}) => {
        const myUserID = auth().currentUser.uid;

        const [_, setViewedItems] = useState([]);
        const [noMoreDocs, setNoMoreDocs] = useState(false);
        const [mediaArtifactRegistry, setMediaArtifactRegistry] = useState({});

        const {state} = useContext(FollowFeedStateContext);
        const {dispatch} = useContext(FollowFeedDispatchContext);

        const keyExtractor = useCallback(item => {
            return item.fid + item.post.id || 'charles';
        }, []);

        const animatedOffset = useRef(new RNAnimated.Value(0)).current;

        const handleViewableItemsChanged = global.HANDLE_VIEWABLE_ITEMS_CHANGED
            ? useCallback(
                  viewableItems => {
                      setViewedItems(oldViewedItems => {
                          // We can have access to the current state without adding it
                          //  to the useCallback dependencies

                          let newViewedItems = null;
                          let changed = viewableItems.changed;

                          changed.forEach(({key, isViewable}) => {
                              if (
                                  key != null &&
                                  isViewable &&
                                  !oldViewedItems.includes(key)
                              ) {
                                  if (newViewedItems == null) {
                                      newViewedItems = [...oldViewedItems];
                                  }
                                  newViewedItems.push(key);
                              }

                              if (mediaArtifactRegistry[key]) {
                                  if (!isViewable) {
                                      mediaArtifactRegistry[key].stop();
                                  } else if (
                                      mediaArtifactRegistry[key].startPaused ===
                                      false
                                  ) {
                                      mediaArtifactRegistry[key].start();
                                  }
                              }
                          });

                          // If the items didn't change, we return the old items so
                          //  an unnecessary re-render is avoided.
                          return newViewedItems == null
                              ? oldViewedItems
                              : newViewedItems;
                      });
                  },
                  // eslint-disable-next-line react-hooks/exhaustive-deps
                  [],
              )
            : null;

        const fetchNext = useCallback(
            prevState => {
                //console.log('FETCH follow grid');
                const paginationSize = 5;

                let feedCollection = firestore()
                    .collection('feed')
                    .where('post.data.deleted', '==', false);

                feedCollection = feedCollection.where(
                    'following',
                    'array-contains',
                    myUserID,
                );
                feedCollection = feedCollection.orderBy(
                    'post.data.publishDate',
                    'desc',
                );
                let next = prevState.nextQuery;
                let oldFeedData = prevState.feedData || [];
                if (prevState.nextQuery === undefined) {
                    next = feedCollection.limit(paginationSize);
                    oldFeedData = [];
                }
                next.get().then(documentSnapshots => {
                    let nextFeedData = documentSnapshots.docs.map(feedDoc => ({
                        ...feedDoc.data(),
                        fid: feedDoc.id,
                    }));
                    const feedData = oldFeedData.concat(nextFeedData);
                    //console.log('feed length', feedData.length);
                    const lastVisibleDoc =
                        documentSnapshots.docs[
                            documentSnapshots.docs.length - 1
                        ];
                    if (lastVisibleDoc?.exists) {
                        const nextState = produce(prevState, draft => {
                            draft.refreshing = false;
                            draft.feedData = feedData;
                            draft.nextQuery = feedCollection
                                .startAfter(lastVisibleDoc)
                                .limit(paginationSize);
                        });
                        dispatch({type: 'updateFeed', payload: nextState});
                    } else {
                        const nextState = produce(prevState, draft => {
                            draft.refreshing = false;
                            draft.feedData = feedData;
                        });
                        dispatch({type: 'updateFeed', payload: nextState});
                        setNoMoreDocs(true);
                    }
                });
            },
            [dispatch],
        );
        const onRefresh = () => {
            dispatch({type: 'refreshFeed'});
        };

        useEffect(() => fetchNext(state), []);
        const flatlistRef = useRef();
        useEffect(() => {
            if (state.refreshing) {
                setNoMoreDocs(false);
                fetchNext(state);
                flatlistRef?.current?.scrollToOffset({
                    animated: true,
                    offset: 0,
                });
            }
        }, [state.refreshing]);

        const onEndReached = () => fetchNext(state);

        const renderGridItem = useCallback(
            ({item}) => {
                const persona = item.persona.data;
                const personaKey = item.persona.id;
                const curated = item?.curated || false;
                const post = item.post.data;
                const postKey = item.post.id;

                return (
                    <FeedPost
                        feedId={item.fid}
                        curated={curated}
                        persona={persona}
                        navigation={navigation}
                        personaName={persona.name}
                        personaKey={personaKey}
                        post={post}
                        postKey={postKey}
                        personaProfileImgUrl={persona.profileImgUrl}
                        navToPost={true}
                        startPaused={false}
                        registerMediaPlayer={makeRegisterMediaPlayer(
                            mediaArtifactRegistry,
                            setMediaArtifactRegistry,
                            'HomePersonaDisplay',
                        )}
                    />
                );
            },
            [navigation, mediaArtifactRegistry, setMediaArtifactRegistry],
        );

        return state.feedData === undefined ? (
            <Loading />
        ) : (
            <View style={styles.container}>
                <FloatingHeader
                    back={back}
                    animatedOffset={animatedOffset}
                    postID={null}
                    personaID={null}
                    onPressGoUpArrow={null}
                    invertedFlatlist={null}
                    parentObjPath={null}
                />
                <View style={styles.innerContainer}>
                    <AnimatedFlashList
                        estimatedItemSize={
                            Dimensions.get('window').height * 0.8
                        }
                        removeClippedSubviews={true}
                        numColumns={1}
                        data={state.feedData}
                        keyExtractor={keyExtractor}
                        refreshControl={
                            <RefreshControl
                                refreshing={state.refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.text}
                                enabled={true}
                            />
                        }
                        onViewableItemsChanged={handleViewableItemsChanged}
                        viewabilityConfig={{
                            viewAreaCoveragePercentThreshold: 0,
                            minimumViewTime: 250, // in ms
                        }}
                        onEndReached={onEndReached}
                        showsVerticalScrollIndicator={false}
                        renderItem={renderGridItem}
                        ListHeaderComponent={<View style={{height: 120}} />}
                        ListFooterComponent={
                            noMoreDocs ? (
                                <View style={{height: 50}} />
                            ) : (
                                <ActivityIndicator
                                    size="large"
                                    style={{marginTop: 60}}
                                    color={colors.text}
                                />
                            )
                        }
                    />
                </View>
            </View>
        );
    };

export default FollowingGrid;
