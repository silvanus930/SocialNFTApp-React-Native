import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {View, Text} from 'react-native';
import GridView from 'components/GridView';
import {GestureHandlerRefsContext} from 'navigators/MainNavigator';
import {PresenceStateRefContext} from 'state/PresenceStateRef';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import useDebounce from 'utils/useDebounce';

export default PostHomeGridWrapped = React.memo(PostHomeGrid);

function PostHomeGrid({
    postList = [],
    persona,
    navigation,
    personaKey,
    isPersonaAccessible,
    headerComponent,
}) {
    const globalPan = React.useContext(GestureHandlerRefsContext);
    const presenceContextRef = React.useContext(PresenceStateRefContext);
    const [data, setData] = useState(postList);

    const updatePresence = useCallback(
        async post => {
            const {postKey} = post;
            let presenceObjPath = `personas/${personaKey}/posts/${postKey}`;
            let myUserID = auth().currentUser.uid;

            if (
                persona.private &&
                !(
                    persona.authors.includes(myUserID) ||
                    persona.communityMembers.includes(myUserID)
                )
            ) {
                alert('You do not have access to this persona!');
                return null;
            }

            // await firestore()
            //     .doc(ROOMS_ADDRESS)
            //     .set(
            //         {
            //             rooms: {
            //                 [presenceObjPath]: {
            //                     [myUserID]: {
            //                         title: post.title || 'Untitled Post',
            //                         heartbeat: new Date(),
            //                         identity: presenceContextRef.current.identityID,
            //                         muted: presenceContextRef.current.micMuted,
            //                         locale: 'PostHomeGrid',
            //                     },
            //                 },
            //             },
            //         },
            //         {merge: true},
            //     );

            presenceContextRef.current.csetState({
                roomPostID: postKey,
                roomPersonaID: personaKey,
                roomTitle: post.title || '',
                roomSlug: post.slug,
                roomPost: post,
                presenceObjPath: presenceObjPath,
                pastRooms: {
                    ...presenceContextRef.current.pastRooms,
                    [presenceObjPath]: Date.now(),
                },

                pastRoomsStack: [
                    ...presenceContextRef.current.pastRoomsStack,
                    presenceObjPath,
                ],
                presenceIntent: `${post.title || 'Untitled Post'} • ${
                    persona.name
                }`,
            });
        },
        [presenceContextRef, personaKey],
    );

    const navToPostDiscussionBase = useDebounce(
        postKey =>
            navigation.push('PostDiscussion', {
                personaKey: personaKey,
                postKey: postKey,
            }),
        [navigation, personaKey],
    );

    const navToPostDiscussion = useCallback(
        entry => {
            if (entry?.postKey && entry?.post) {
                !presenceContextRef.current.sticky &&
                    updatePresence(entry?.post);
                navToPostDiscussionBase(entry?.postKey);
            }
        },
        [updatePresence, presenceContextRef],
    );

    useEffect(() => {
        setData(postList);
    }, [postList, setData]);

    const onPressCell = useCallback(item => {
        const {entry, type} = item;
        if (type === 'post' && entry) {
            navToPostDiscussion(entry);
        }
    });

    const onReleaseCell = useCallback(
        items => {
            globalPan?.current?.setNativeProps({
                enabled: true,
            });
            setData(items);
        },
        [setData],
    );

    const onBeginDragging = useCallback(() => {
        globalPan?.current?.setNativeProps({
            enabled: false,
        });
    }, []);

    const renderItem = useCallback(
        item => {
            const {type, entry} = item;
            if (type === 'dud') {
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
            return persona?.deleted || !isPersonaAccessible ? <></> : null;
        },
        [persona, isPersonaAccessible, navigation, personaKey],
    );

    const keyExtractor = useCallback(item => item.entry.postKey, []);

    return postList.length === 0 ? null : (
        <GridView
            data={data}
            numColumns={3}
            renderItem={renderItem}
            onReleaseCell={onReleaseCell}
            keyExtractor={keyExtractor}
            onBeginDragging={onBeginDragging}
            headerComponent={headerComponent}
            onPressCell={onPressCell}
        />
    );
}
