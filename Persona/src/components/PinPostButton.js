import React from 'react';
import {TouchableOpacity, View, StyleSheet, Alert} from 'react-native';
import isEqual from 'lodash.isequal';
import colors from 'resources/colors';
import firestore from '@react-native-firebase/firestore';
import {vanillaPost} from 'state/PostState';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import palette from 'resources/palette';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {updateCommunityPost, updatePost} from 'actions/posts';
import {ForumFeedDispatchContext} from 'state/ForumFeedStateContext';
import {determineUserRights} from 'utils/helpers';

const stringify = require('json-stringify-safe');

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(PinPostButton, propsAreEqual);
function PinPostButton({
    communityID,
    style = {},
    forumType, // this must be assigned to differentiate source (home v. persona channels)
    background = true,
    persona,
    post,
    postType,
    doFirst = null,
    postID,
    personaID,
    size = palette.icon.size / 2,
}) {
    /**
     * Notes:
     *  post.type => {media, proposal}
     *  postType => {community, persona}
     */
    const [pinned, setPinned] = React.useState();
    const [pinnedHome, setPinnedHome] = React.useState();
    const {
        current: {personaMap, user},
    } = React.useContext(GlobalStateRefContext);
    const {dispatch} = React.useContext(ForumFeedDispatchContext);

    const hasAuth = personaID
        ? determineUserRights(null, personaID, user, 'canPinPost')
        : determineUserRights(communityID, null, user, 'canPinPost');

    React.useEffect(() => {
        if (postType === 'persona') {
            return firestore()
                .collection('personas')
                .doc(personaID)
                .collection('posts')
                .doc(postID)
                .onSnapshot(postDoc => {
                    const postData = postDoc.data();
                    setPinnedHome(postData?.pinnedHome);
                    setPinned(postData?.pinned);
                });
        } else if (postType === 'community') {
            return firestore()
                .collection('communities')
                .doc(communityID)
                .collection('posts')
                .doc(postID)
                .onSnapshot(postDoc => {
                    const postData = postDoc.data();
                    setPinnedHome(postData?.pinnedHome);
                    setPinned(postData?.pinned);
                });
        }
    }, [personaID, communityID, postID]);

    const pinOnPressMemoized = React.useCallback(async () => {
        doFirst && doFirst();
        if (post?.minted) {
            return;
        }
        let ppost = JSON.parse(JSON.stringify(vanillaPost));
        if (!post?.publishDate) {
            console.log(
                `PinPostButton querying personas/${personaID}/posts/${postID}`,
            );
            const pst = post
                ? post
                : await firestore()
                      .collection('personas')
                      .doc(personaID)
                      .collection('posts')
                      .doc(postID)
                      .get();

            Object.assign(ppost, post ? post : pst.data());
        } else {
            console.log(
                `PinPostButton using post ${stringify(
                    post,
                    undefined,
                    4,
                )} at postID ${postID}`,
            );
            Object.assign(ppost, post);
        }
        let subPersona = ppost?.subPersonaID
            ? Object.assign({}, personaMap[ppost?.subPersonaID])
            : {};

        let newPost;
        if (forumType == 'PersonaChannel') {
            newPost = Object.assign(
                {},
                {
                    ...ppost,
                    subPersona,
                    pid: postID,
                    pinned: !pinned,
                    deleted: false,
                    published: true,
                },
            );
        } else {
            newPost = Object.assign(
                {},
                {
                    ...ppost,
                    subPersona,
                    pid: postID,
                    pinnedHome: !pinnedHome,
                    deleted: false,
                    published: true,
                },
            );
        }

        if (postType === 'community') {
            await updateCommunityPost(communityID, postID, newPost);
        } else {
            await updatePost(personaID, postID, newPost);
        }
        dispatch({type: 'refreshFeed'});
    }, [
        communityID,
        personaMap,
        postID,
        post,
        post?.subPersonaID,
        post?.pid,
        persona?.pid,
        persona,
        personaID,
        post?.minted,
        doFirst,
        pinned,
        pinnedHome,
    ]);

    const needAuthAlert = () => {
        Alert.alert('You do not have the correct permission to pin posts.');
    };

    return !post?.minted ? (
        <View style={{...Styles.optionsButton}}>
            <View
                style={{
                    padding: 0.5,
                    backgroundColor: background ? '' : colors.topBackground,
                    borderRadius: size * 1.7,
                    width: 'auto', // size * 1.7,
                    height: 'auto', // size * 1.7,
                    borderWidth: 1,
                    borderColor: 'grey',
                    zIndex: 9999,
                    ...style,
                }}>
                <TouchableOpacity
                    hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}
                    onPress={hasAuth ? pinOnPressMemoized : needAuthAlert}>
                    {forumType == 'PersonaChannel' ? (
                        pinned ? (
                            <MaterialCommunityIcons
                                name="pin"
                                size={24}
                                style={{
                                    color: 'red',
                                }}
                            />
                        ) : (
                            <MaterialCommunityIcons
                                name="pin-outline"
                                size={24}
                                style={{
                                    color: colors.textFaded3,
                                }}
                            />
                        )
                    ) : pinnedHome ? (
                        <MaterialCommunityIcons
                            name="pin"
                            size={24}
                            style={{
                                color: 'red',
                            }}
                        />
                    ) : (
                        <MaterialCommunityIcons
                            name="pin-outline"
                            size={24}
                            style={{
                                color: colors.textFaded3,
                            }}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    ) : (
        <></>
    );
}

export const Styles = StyleSheet.create({
    container: {
        borderColor: 'purple',
        borderWidth: 0,
        zIndex: 99,
        elevation: 99,
        borderRadius: 25,
        padding: 8,
        marginStart: 10,
        marginEnd: 10,
        backgroundColor: colors.studioBtn,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginBottom: -20,
        marginTop: 20,
        alignItems: 'center',
    },
    personImage: {
        width: 30,
        height: 30,
        borderRadius: 30,
    },
    personName: {
        color: colors.text,
        marginStart: 10,
        fontWeight: 'bold',
    },
    iconMore: {
        height: 15,
        width: 15,
    },
    selectPersonaForHomeIcon: {
        width: 25,
        height: 25,
    },
    optionsButton: {marginTop: 2, marginLeft: 6},
});
