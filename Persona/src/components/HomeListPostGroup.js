import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, Dimensions, Animated as RNAnimated} from 'react-native';
import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import {AnimatedFlashList, FlashList} from '@shopify/flash-list';
import DateSeperatorListItem from 'components/DateSeperatorListItem';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GestureHandlerRefsContext} from 'state/GestureHandlerRefsContext';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

import fonts from 'resources/fonts';
import baseText from 'resources/text';
import colors from 'resources/colors';

import {makeRegisterMediaPlayer} from 'utils/media/helpers';
import FeedPost from 'components/FeedPost';
import ForumCreatePost, {
    CREATE_POST_CONTAINER_HEIGHT,
} from 'components/ForumCreatePost';

import Loading from 'components/Loading';
import FeedEndorsementUsersMenu from 'components/FeedEndorsementUserMenu';
import {HomeScrollContextState} from 'components/HomeScrollContext';

import {dateFor, isSameDay} from 'utils/DateTime';
import {determineUserRights} from 'utils/helpers';
import {getPersonaList} from 'actions/personas';
import {updatePostSeen} from 'actions/posts';
import {postTypes} from 'resources/constants';
import {HEADER_HEIGHT} from 'state/AnimatedHeaderState';

const nullFunc = () => {};

export function HomeListPostMain({
    personaEntry,
    displayHeader = true,
    communityID,
    displayOnly = false,
    onScroll = null,
    updateHeader,
}) {
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
        firstRender.current = true;
        postListRef.current = personaEntry.postList || [];
        //setPostList(postListRef.current);
        return getPersonaList(
            personaEntry,
            firstRender,
            postListRef,
            setPostList,
        );
    }, [displayOnly, personaEntry]);

    const navigation = useNavigation();

    const [mediaArtifactRegistry, setMediaArtifactRegistry] = useState({});
    const viewedItems = React.useRef([]);

    const postGroupRef = useRef();

    /*useEffect(() => {
        if (postGroupRef?.current?.scrollToOffset) {
            postGroupRef.current.scrollToOffset({
                animated: false,
                offset: 0,
            });
        }
    }, [personaKey]);*/

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
                                      await updatePostSeen(item);
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
        <View style={{flex: 1, left: 0}}>
            {persona === undefined || !personaEntry?.personaKey ? (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: colors.homeBackground,
                    }}
                />
            ) : (
                <View
                    style={{
                        borderWidth: 0,
                        borderColor: 'blue',
                        flex: 1,
                    }}>
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
                </View>
            )}
            <View
                style={{
                    borderWidth: 0,
                    borderColor: 'blue',
                }}>
                <ForumCreatePost />
            </View>
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
    onScroll,
    communityID,
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

    const renderItem = React.useCallback(
        ({item: {type, date, entry}}) => {
            // console.log(`Rendering HomeListPostGroup: ${persona, gridView, personaKey, navigation, postListRef}`);

            if (type === postTypes.DATE_SEPARATOR) {
                return <DateSeperatorListItem date={date} />;
            }

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
                                    'HomeListPostGroup',
                                )}
                                index={entry.postKey}
                                post={entry.post}
                                postType={
                                    personaKey
                                        ? postTypes.PERSONA
                                        : postTypes.COMMUNITY
                                }
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
                                forumType={'PersonaChannel'}
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
            (item.entry.postKey !== undefined ? item.entry.postKey : index) +
            'home',
        [],
    );

    let modifiedExpandedPostList = expandedPostList;

    let personaID = personaKey;

    const {
        current: {personaMap, user},
    } = React.useContext(GlobalStateRefContext);
    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;

    // let hasAuth = personaID
    //     ? personaMap[personaID]?.authors?.includes(myUserID) ||
    //       myUserID === 'PHobeplJLROyFlWhXPINseFVkK32'
    //     : communityMap[communityID]?.members?.includes(myUserID) ||
    //       myUserID === 'PHobeplJLROyFlWhXPINseFVkK32';

    const hasAuth = determineUserRights(
        communityID,
        null,
        user,
        'readChatPost',
    );

    // -----------------------------------------------------------------
    let filteredData = [];
    let dateSeparatedFilteredData = [];

    //
    // Add date seperators
    //
    modifiedExpandedPostList.map((i, index) => {
        let item = {...i};
        const prevDate = dateFor(modifiedExpandedPostList[index - 1]?.entry);
        const date = dateFor(item?.entry);

        item.date = date;

        const same = isSameDay(date, prevDate);
        if (!same && date) {
            dateSeparatedFilteredData.push({
                entry: {postKey: Math.random()},
                type: postTypes.DATE_SEPARATOR,
                postType: postTypes.DATE_SEPARATOR,
                date: date,
                fid: date.toString(),
            });
        }
        dateSeparatedFilteredData.push(item);
    });
    // -----------------------------------------------------------------

    return (
        <>
            {hasAuth ? (
                <View style={{flex: 1}}>
                    <AnimatedFlashList
                        numColumns={gridView ? 3 : 1}
                        onScroll={onScroll}
                        estimatedItemSize={
                            Dimensions.get('window').height * 0.8
                        }
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
                            <View style={{height: HEADER_HEIGHT}} />
                        }
                        ListFooterComponent={
                            modifiedExpandedPostList.length ? (
                                <View
                                    style={{
                                        height: CREATE_POST_CONTAINER_HEIGHT,
                                    }}
                                />
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
                                            no posts
                                        </Text>
                                    </View>
                                </>
                            )
                        }
                    />
                </View>
            ) : (
                <View
                    style={{
                        borderColor: 'orange',
                        borderWidth: 0,
                        paddingTop: 0,
                        marginTop: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: Dimensions.get('window').height,
                        width: Dimensions.get('window').width,
                        flexDirection: 'column',
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            color: colors.text,
                            fontFamily: fonts.semibold,
                        }}>
                        You do not have rights to view posts
                    </Text>
                </View>
            )}
        </>
    );
}
