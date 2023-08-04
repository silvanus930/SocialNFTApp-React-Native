import React, {
    useEffect,
    useState,
    useCallback,
    useContext,
    useRef,
} from 'react';
import {Text, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import produce from 'immer';

import {
    ForumFeedDispatchContext,
    ForumFeedStateContext,
} from 'state/ForumFeedStateContext';
import {Grid} from 'components/FeedScreen';
import FeedPost from 'components/FeedPost';
import ForumCreatePost from 'components/ForumCreatePost';
import Loading from 'components/Loading';
import DateSeperatorListItem from 'components/DateSeperatorListItem';

import {getCommunityForumPosts} from 'actions/posts';

import {makeRegisterMediaPlayer} from 'utils/media/helpers';
import {addDateSeperators} from 'utils/posts';

import styles from './styles';
import {postTypes} from 'resources/constants';

/*
 Note: making any changes in this file requires a reload on Metro
 */
const AnimaGrid =
    (communityID, communityMap, back, displayHeader = false) =>
    ({navigation, onScroll}) => {
        const [_, setViewedItems] = useState([]);
        const [noMoreDocs, setNoMoreDocs] = useState(false);
        const [mediaArtifactRegistry, setMediaArtifactRegistry] = useState({});

        const {state} = useContext(ForumFeedStateContext);
        const {dispatch} = useContext(ForumFeedDispatchContext);

        const flatlistRef = useRef();

        const keyExtractor = useCallback(item => {
            return item?.fid + item?.post?.id || 'charles';
        }, []);

        useEffect(() => fetchNext(state), []);
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

        const renderGridItem = useCallback(
            ({item}) => {
                let persona;
                let personaKey;
                let curated;
                let post;
                let postKey;
                let postType = item?.postType || postTypes.PERSONA;
                let muted;

                if (postType === 'dateSeperator') {
                    return <DateSeperatorListItem date={item?.date} />;
                } else if (postType === postTypes.COMMUNITY) {
                    personaKey = item.community.id;
                    communityID = item.community.id;
                    persona = Object.assign(
                        {
                            published: true,
                            authors: item.community.data.members,
                            private: item.community.data?.private || false,
                        },
                        communityMap[personaKey],
                    );
                    curated = false;
                    post = item.post.data;
                    postKey = item.post.id;
                    muted = false;
                } else if (item.persona) {
                    persona = item.persona.data;
                    personaKey = item.persona.id;
                    curated = item?.curated || false;
                    post = item.post.data;
                    postKey = item.post.id;
                    muted = false;
                }

                return (
                    <FeedPost
                        feedId={item.fid}
                        communityID={communityID}
                        curated={curated}
                        persona={persona}
                        navigation={navigation}
                        personaName={persona.name}
                        personaKey={personaKey}
                        post={post}
                        postType={postType}
                        postKey={postKey}
                        personaProfileImgUrl={persona.profileImgUrl}
                        navToPost={true}
                        startPaused={false}
                        showIdentity={false}
                        registerMediaPlayer={makeRegisterMediaPlayer(
                            mediaArtifactRegistry,
                            setMediaArtifactRegistry,
                            'HomePersonaDisplay',
                        )}
                        // compact={true}
                        forumType={'HomeChannel'}
                    />
                );
            },
            [
                navigation,
                mediaArtifactRegistry,
                setMediaArtifactRegistry,
                communityID,
                communityMap,
            ],
        );

        const fetchNext = useCallback(
            prevState => {
                const paginationSize = 80;
                const feedCollection = getCommunityForumPosts(communityID);

                let next = prevState.nextQuery;
                let oldFeedData = prevState.feedData || [];
                if (prevState.nextQuery === undefined) {
                    next = feedCollection.limit(paginationSize);
                    oldFeedData = [];
                }

                next.onSnapshot(documentSnapshots => {
                    let nextFeedData = documentSnapshots.docs.map(feedDoc => ({
                        ...feedDoc.data(),
                        fid: feedDoc.id,
                    }));

                    const feedData = oldFeedData.concat(nextFeedData);

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
            [dispatch, communityID],
        );

        const onRefresh = () => {
            dispatch({type: 'refreshFeed'});
        };

        const onEndReached = () => fetchNext(state);

        const sortFunc = (a, b) => {
            const bb =
                b?.post?.data?.publishDate.seconds ||
                b?.post?.data?.publishDate._seconds;
            const aa =
                a?.post?.data?.publishDate.seconds ||
                a?.post?.data?.publishDate._seconds;

            return bb - aa;
        };

        const data = [...(state?.feedData || [])].sort(sortFunc);
        const sortedPinnedData = [
            ...data.filter(x => x.post.data.pinnedHome),
            ...data.filter(x => !x.post.data.pinnedHome),
        ];
        const filteredData = [];

        sortedPinnedData.map((i, index) => {
            let item = {...i};
            let persona;
            let personaKey;
            let post = item.post.data;
            let postType = item?.postType || postTypes.PERSONA;

            if (postType === postTypes.COMMUNITY) {
                personaKey = item.community.id;
                persona = Object.assign(
                    {
                        published: true,
                        authors: item.community.data.members,
                        private: item.community.data?.private || false,
                    },
                    communityMap[personaKey],
                );
            } else if (item.persona) {
                persona = item.persona.data;
                personaKey = item.persona.id;
            }

            if (!persona) {
                return;
            }

            if (
                persona?.private &&
                !persona?.authors?.includes(auth().currentUser.uid)
            ) {
                return;
            }

            if (post?.type == 'transfer') {
                return;
            }

            filteredData.push(item);
        });

        const dateSeparatedFilteredData = addDateSeperators(filteredData);

        return state.feedData === undefined ? (
            <Loading backgroundColor="transparent" />
        ) : (
            <View style={styles.container}>
                <View style={styles.innerContainer}>
                    <Grid
                        onScroll={onScroll}
                        communityID={communityID}
                        back={back}
                        displayHeader={displayHeader}
                        name={'anima'}
                        numColumns={1}
                        flatlistRef={flatlistRef}
                        noMoreDocs={noMoreDocs}
                        data={dateSeparatedFilteredData}
                        refreshing={state.refreshing}
                        keyExtractor={keyExtractor}
                        onRefresh={onRefresh}
                        handleViewableItemsChanged={handleViewableItemsChanged}
                        onEndReached={onEndReached}
                        renderGridItem={renderGridItem}
                    />
                </View>
                <ForumCreatePost />
            </View>
        );
    };

export default AnimaGrid;
