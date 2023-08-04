import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, Dimensions, Animated as RNAnimated} from 'react-native';

import firestore from '@react-native-firebase/firestore';
import {getServerTimestamp} from 'actions/constants';

import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import {AnimatedFlashList, FlashList} from '@shopify/flash-list';

import {makeRegisterMediaPlayer} from 'utils/media/helpers';
import {vanillaPost} from 'state/PostState';
import {GestureHandlerRefsContext} from 'state/GestureHandlerRefsContext';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import colors from 'resources/colors';
import FeedPost from 'components/FeedPost';
import Loading from 'components/Loading';
import FeedEndorsementUsersMenu from 'components/FeedEndorsementUserMenu';
import {HomeScrollContextState} from 'components/HomeScrollContext';
import {dateFor, isSameDay} from 'utils/DateTime';
import DateSeperatorListItem from 'components/DateSeperatorListItem';
import TransfersSummary from 'components/TransfersSummary';
import {postTypes} from 'resources/constants';
import {HEADER_HEIGHT} from 'state/AnimatedHeaderState';

const nullFunc = () => {};

export function HomeListTransactionMain({
    personaEntry,
    displayHeader = true,
    communityID,
    displayOnly = false,
    onScroll = null,
    updateHeader,
}) {
    // console.log('RENDER HomeListPostMain', personaEntry);
    const globalPan = React.useContext(GestureHandlerRefsContext);

    const personaKey = personaEntry?.personaKey;
    const persona = personaEntry?.persona;

    const myUserID = auth().currentUser.uid;

    const [livePostEditTimestamps, setLivePostEditTimestamps] = React.useState({
        postEditTimestamps: {},
    });

    const firstRender = React.useRef();
    const postListRef = React.useRef();
    const [postList, setPostList] = React.useState(null);
    React.useEffect(() => {
        if (!personaEntry.personaKey) {
            return;
        }
        console.log('--- Starting postlist update cycle');
        firstRender.current = true;
        postListRef.current = personaEntry.postList || [];
        //setPostList(postListRef.current);
        return firestore()
            .collection('personas')
            .doc(personaEntry.personaKey)
            .collection('posts')
            .where('type', '==', 'transfer')
            .where('deleted', '==', false)
            .onSnapshot(postsSnap => {
                if (firstRender.current) {
                    postListRef.current = postsSnap.docs
                        .map(postDoc => ({
                            persona: personaEntry.persona,
                            personaKey: personaEntry.personaKey,
                            post: postDoc.exists ? postDoc.data() : vanillaPost,
                            postKey: postDoc.id,
                            lastUpdated: Date.now(),
                        }))
                        .sort(
                            (a, b) =>
                                -(
                                    a.post.publishDate?.seconds ||
                                    Date.now() / 1000
                                ) +
                                (b.post.publishDate?.seconds ||
                                    Date.now() / 1000),
                        );
                    firstRender.current = false;

                    setPostList([...postListRef.current]);
                } else {
                    postsSnap
                        .docChanges()
                        .reverse()
                        .forEach(change => {
                            if (change.type === 'added') {
                                const existingPost = postListRef.current.find(
                                    p => p.postKey === change.doc.id,
                                );
                                if (existingPost !== undefined) {
                                    return;
                                }
                                const newPost = {
                                    persona: personaEntry.persona,
                                    personaKey: personaEntry.personaKey,
                                    post: change.doc?.data
                                        ? change.doc.data()
                                        : vanillaPost,
                                    postKey: change.doc.id,
                                    lastUpdated: Date.now(),
                                };
                                postListRef.current = [newPost].concat(
                                    postListRef.current,
                                );
                                postListRef.current = postListRef.current.sort(
                                    (a, b) =>
                                        -(
                                            a.post.publishDate?.seconds ||
                                            Date.now() / 1000
                                        ) +
                                        (b.post.publishDate?.seconds ||
                                            Date.now() / 1000),
                                );
                            } else if (change.type === 'modified') {
                                const modifiedPost = {
                                    persona: personaEntry.persona,
                                    personaKey: personaEntry.personaKey,
                                    post: change.doc.data(),
                                    postKey: change.doc.id,
                                    lastUpdated: Date.now(),
                                };
                                const indexToChange =
                                    postListRef.current.indexOf(
                                        postListRef.current.find(
                                            p => p.postKey === change.doc.id,
                                        ),
                                    );
                                if (indexToChange !== -1) {
                                    postListRef.current[indexToChange] =
                                        modifiedPost;
                                }
                            } else if (change.type === 'removed') {
                                postListRef.current =
                                    postListRef.current.filter(
                                        ({postKey}) =>
                                            postKey !== change.doc.id,
                                    );
                                postListRef.current = postListRef.current.sort(
                                    (a, b) =>
                                        -(
                                            a.post.publishDate?.seconds ||
                                            Date.now() / 1000
                                        ) +
                                        (b.post.publishDate?.seconds ||
                                            Date.now() / 1000),
                                );
                            }
                        });
                    setPostList([...postListRef.current]);
                }
            });
    }, [displayOnly, personaEntry]);

    const navigation = useNavigation();

    const [mediaArtifactRegistry, setMediaArtifactRegistry] = useState({});
    const viewedItems = React.useRef([]);

    const postGroupRef = useRef();

    // Whenever an item is viewed, update its view status as viewed in the user's feed queue
    const lastPostKeyRef = React.useRef();
    useEffect(() => {
        lastPostKeyRef.current = (postList || []).slice(-1)[0]?.postKey;
    }, [postList]);
    const handleViewableItemsChanged = global.HANDLE_VIEWABLE_ITEMS_CHANGED
        ? useCallback(
              viewableItems => {
                  if (global.UPDATE_DB_ITEMS_SEEN) {
                      const currentOffset =
                          postGroupRef?.current?._listRef?._scrollMetrics
                              ?.offset;
                      (viewableItems.changed || []).map(
                          async ({key, item, isViewable}) => {
                              if (item.type === 'post') {
                                  const alreadySeen = Object.keys(
                                      item.entry.post?.seen || [],
                                  ).includes(myUserID); // TODO - access myUserID via ref?

                                  const itemStartOffset = (postGroupRef?.current
                                      ?._listRef?._frames || {})[key]?.offset;
                                  if (
                                      !isViewable &&
                                      !alreadySeen &&
                                      itemStartOffset < currentOffset
                                  ) {
                                      console.log(
                                          'HANDLE VIEWABLE ITEMS, LEFT VIEW',
                                          key,
                                          item.entry.post?.title,
                                          item.entry.postKey,
                                          item.entry.personaKey,
                                      );
                                      await firestore()
                                          .collection('personas')
                                          .doc(item.entry.personaKey)
                                          .collection('posts')
                                          .doc(item.entry.postKey)
                                          .update({
                                              [`seen.${myUserID}`]:
                                                  getServerTimestamp(),
                                          });
                                  }
                              }
                          },
                      );
                  }

                  const oldViewedItems = viewedItems.current;
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
                              mediaArtifactRegistry[key].startPaused === false
                          ) {
                              mediaArtifactRegistry[key].start();
                          }
                      }
                  });

                  viewedItems.current =
                      newViewedItems == null ? oldViewedItems : newViewedItems;
              },
              // eslint-disable-next-line react-hooks/exhaustive-deps
              [],
          )
        : null;

    const swipableRef = useRef();

    if (postList === null) {
        return <Loading />;
    }
    return (
        <View style={{flex: 1, width: '100%', height: '100%', left: 0}}>
            {persona === undefined || !personaEntry?.personaKey ? (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: colors.homeBackground,
                    }}
                />
            ) : (
                <PersonaPostList
                    communityID={communityID}
                    onScroll={onScroll}
                    gridView={false}
                    displayHeader={displayHeader}
                    setGridView={nullFunc}
                    mediaArtifactRegistry={mediaArtifactRegistry}
                    setMediaArtifactRegistry={setMediaArtifactRegistry}
                    postGroupRef={postGroupRef}
                    handleViewableItemsChanged={handleViewableItemsChanged}
                    persona={persona}
                    personaKey={personaKey}
                    postList={postList}
                    myUserID={myUserID}
                    Footer={Footer}
                    swipableRef={swipableRef}
                    navigation={navigation}
                    dispatch={null}
                    globalPan={globalPan}
                    displayOnly={displayOnly}
                    updateHeader={updateHeader}
                    livePostEditTimestamps={livePostEditTimestamps}
                />
            )}
            <FeedEndorsementUsersMenu />
        </View>
    );
}

function Footer({timestamp, deleted, isPersonaAccessible}) {
    return (
        <View style={{backgroundColor: colors.homeBackground, left: 7.5}}>
            {(deleted || !isPersonaAccessible) && (
                <>
                    <Text
                        style={{
                            ...baseText,
                            top: 27,
                            left: 36,
                            position: 'absolute',
                            color: colors.emphasisRed,
                            fontStyle: 'italic',
                            fontWeight: 'bold',
                            fontSize: 12,
                            zIndex: 100,
                        }}>
                        {deleted ? 'Deleted' : 'Private'}
                    </Text>
                    <View style={{marginBottom: 370}} />
                </>
            )}
            <View style={{marginBottom: 370}} />
        </View>
    );
}

function PersonaPostList({
    gridView = false,
    mediaArtifactRegistry,
    setMediaArtifactRegistry,
    postGroupRef,
    handleViewableItemsChanged,
    persona,
    personaKey,
    postList,
    navigation,
    displayOnly,
    livePostEditTimestamps,
    onScroll,
}) {
    console.log('rendering PersonaPostList', persona?.name);

    const scrollToTop = () => {
        if (postGroupRef?.current?.scrollToOffset) {
            postGroupRef.current.scrollToOffset({
                animated: true,
                offset: 0,
            });
        }
    };
    const scrollToTopToggle = React.useContext(HomeScrollContextState);
    React.useEffect(scrollToTop, [scrollToTopToggle]);

    const myUserID = auth().currentUser.uid;
    const myPersona = persona?.authors?.includes(myUserID);
    const amInCommunity = persona?.communityMembers?.includes(myUserID);
    const isPersonaAccessible = myPersona || amInCommunity || !persona?.private;
    const showUnpublished = (myPersona || amInCommunity) && !gridView;

    const postMap = Object.fromEntries(
        (postList || []).map(({post, postKey}) => [postKey, post]),
    );
    let expandedPostList = [];
    let hiddenGroupCounter = 0;
    let lastHiddenPostEntry;

    const lastPostKey = (postList || []).slice(-1)[0]?.postKey;

    if (true) {
        postList?.forEach(postEntry => {
            if (!showUnpublished && !postEntry.post.published) {
                return false;
            }
            if (displayOnly) {
                expandedPostList.push({type: 'post', entry: postEntry});
                return;
            }
            const setAsContracted = false;
            const expanded =
                !setAsContracted || !postMap[postEntry.postKey]?.published;

            if (expanded) {
                if (lastHiddenPostEntry !== undefined) {
                    if (hiddenGroupCounter > 0) {
                        expandedPostList.push({
                            type: 'hiddenGroup',
                            entry: hiddenGroupCounter,
                        });
                    }
                    expandedPostList.push({
                        type: 'post',
                        entry: lastHiddenPostEntry,
                    });
                }
                expandedPostList.push({
                    type: 'post',
                    entry: postEntry,
                });
                lastHiddenPostEntry = undefined;
                hiddenGroupCounter = 0;
                return;
            }
            const lastEntry = expandedPostList.slice(-1);
            if (
                lastEntry.length === 0 ||
                lastEntry[0]?.type === 'post' ||
                postEntry.postKey === lastPostKey
            ) {
                if (
                    postEntry.postKey === lastPostKey &&
                    hiddenGroupCounter > 0
                ) {
                    expandedPostList.push({
                        type: 'hiddenGroup',
                        entry: hiddenGroupCounter,
                    });
                }
                expandedPostList.push({type: 'postPreview', entry: postEntry});
                return;
            }
            // hidden and nothing to show but keep track of entry
            hiddenGroupCounter += 1;
            lastHiddenPostEntry = postEntry;
        });
    }
    const postListRef = React.useRef();
    postListRef.current = postList || [];

    //
    // Inject date seperators
    //
    const dateSeparatedFilteredData = [];
    expandedPostList.map((i, index) => {
        let item = {...i};
        const prevDate = dateFor(expandedPostList[index - 1]);
        const date = dateFor(item);
        item.date = date;

        const same = isSameDay(date, prevDate);

        if (!same && date) {
            dateSeparatedFilteredData.push({
                postType: postTypes.DATE_SEPARATOR,
                date: date,
                fid: date.toString(),
                entry: {
                    postKey: date.toString(),
                },
            });
        }
        dateSeparatedFilteredData.push(item);
    });

    //
    // ...and for each date seperator, collect child transfers
    //
    dateSeparatedFilteredData.map((item, index) => {
        if (item?.postType === postTypes.DATE_SEPARATOR) {
            const transfers = [];
            for (let k = index + 1; k < dateSeparatedFilteredData.length; k++) {
                const next = dateSeparatedFilteredData[k];
                if (next?.postType !== postTypes.DATE_SEPARATOR) {
                    transfers.push(next);
                } else {
                    break;
                }
            }
            if (transfers.length > 0) {
                item.transfers = transfers;
            }
        }
    });

    const renderItem = React.useCallback(
        ({item: {type, entry, postType, date, transfers}}) => {
            if (type === 'dud' && gridView) {
                return (
                    <View
                        style={{
                            width: Dimensions.get('window').width / 3 - 2,
                            height: Dimensions.get('window').width / 3 - 2,
                            borderColor: colors.homeBackground,
                            backgroundColor: colors.paleBackground,
                            borderWidth: 0.4,
                        }}
                    />
                );
            }

            if (postType === postTypes.DATE_SEPARATOR) {
                return (
                    <>
                        <DateSeperatorListItem date={date} />
                        {transfers && (
                            <TransfersSummary transfers={transfers} />
                        )}
                    </>
                );
            }

            return persona?.deleted || !isPersonaAccessible ? (
                <></>
            ) : (
                <View style={{backgroundColor: colors.gridBackground}}>
                    {type === 'post' || type === 'postPreview' ? (
                        <View
                            style={{
                                flex: 1,
                                width: Dimensions.get('window').width,
                            }}>
                            <FeedPost
                                postListRef={postListRef}
                                navToPost={true}
                                navigation={navigation}
                                showIdentity={true}
                                persona={persona}
                                personaName={persona?.name}
                                personaKey={personaKey}
                                startPaused={true}
                                registerMediaPlayer={makeRegisterMediaPlayer(
                                    mediaArtifactRegistry,
                                    setMediaArtifactRegistry,
                                    'HomeListTransactionGroup',
                                )}
                                index={entry.postKey}
                                post={entry.post}
                                postKey={entry.postKey}
                                personaProfileImgUrl={persona.profileImgUrl}
                                swipable={true}
                                lastUpdated={entry?.lastUpdated}
                                gridView={gridView}
                                liveEditTimestamp={
                                    livePostEditTimestamps.postEditTimestamps[
                                        entry.postKey
                                    ]
                                }
                            />
                        </View>
                    ) : type === 'hiddenGroup' ? (
                        <ContractedPostGroup postGroupCount={entry} />
                    ) : null}
                </View>
            );
        },
        [persona, gridView, personaKey, navigation, postListRef],
    );

    const keyExtractor = React.useCallback(
        (item, index) =>
            (item?.entry?.postKey !== undefined
                ? item?.entry?.postKey
                : index) + 'home',
        [],
    );

    let modifiedExpandedPostList = expandedPostList;

    console.log(
        'modifiedExpandedPostList length: ',
        modifiedExpandedPostList.length,
    );

    if (
        true ||
        modifiedExpandedPostList.length >= 100 ||
        modifiedExpandedPostList.length === 0
    ) {
        return (
            <>
                <RNAnimated.FlatList
                    estimatedItemSize={200}
                    onScroll={onScroll}
                    numColumns={gridView ? 3 : null}
                    ref={postGroupRef}
                    data={dateSeparatedFilteredData}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    onViewableItemsChanged={handleViewableItemsChanged}
                    viewabilityConfig={{
                        viewAreaCoveragePercentThreshold: 0,
                        minimumViewTime: 250, // in ms
                    }}
                    ListHeaderComponent={
                        <View style={{color: colors.gridBackground}}>
                            <View
                                style={{
                                    height: HEADER_HEIGHT,
                                }}
                            />
                        </View>
                    }
                    ListFooterComponent={
                        modifiedExpandedPostList.length ? (
                            <View style={{height: 70}} />
                        ) : (
                            <>
                                <View
                                    style={{
                                        borderColor: 'orange',
                                        borderWidth: 0,
                                        paddingTop: 50,
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        height: 70,
                                        flexDirection: 'column',
                                    }}>
                                    <Text
                                        style={{
                                            ...baseText,
                                            color: colors.text,
                                            fontFamily: fonts.semibold,
                                        }}>
                                        no transfers
                                    </Text>
                                </View>
                            </>
                        )
                    }
                />
            </>
        );
    }
}
