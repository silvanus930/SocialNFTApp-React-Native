import React, {useState, useCallback} from 'react';
import isEqual from 'lodash.isequal';
import fonts from 'resources/fonts';
import colors from 'resources/colors';
import {PersonaCreateStateRefContext} from 'state/PersonaCreateStateRef';
import firestore from '@react-native-firebase/firestore';
import {vanillaPost} from 'state/PostState';
import {PostStateRefContext} from 'state/PostStateRef';
import {InviteStateContext} from 'state/InviteState';
import Icon from 'react-native-vector-icons/Feather';
import palette from 'resources/palette';
import {Text, TouchableOpacity, View, StyleSheet, Platform} from 'react-native';
import {PresenceStateRefContext} from 'state/PresenceStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(EditPostButton, propsAreEqual);
function EditPostButton({
    communityID,
    style = {},
    background = true,
    navigation,
    wide = false,
    persona,
    post,
    doFirst = null,
    postID,
    personaID,
    size = palette.icon.size / 2,
}) {
    const personaContext = React.useContext(PersonaCreateStateRefContext);
    const {
        current: {personaMap},
    } = React.useContext(GlobalStateRefContext);
    const postContext = React.useContext(PostStateRefContext);
    const inviteContext = React.useContext(InviteStateContext);
    const [showPostActionMenu, setShowPostActionMenu] = useState(false);
    const presenceContext = React.useContext(PresenceStateRefContext);
    //const presenceContext = React.useContext(PresenceStateContext);

    const editOnPressMemoized = React.useCallback(async () => {
        console.log('editOnPressMemoized w communityID', communityID);
        doFirst && doFirst();
        //personaContext.restoreVanilla({sNew: false, sEdit: true, persona: persona});
        if (post?.minted) {
            return;
        }

        personaContext.current.csetState({
            edit: true,
            new: false,
            posted: false,
            persona: Object.assign({pid: personaID}, persona),
            identityPersona: Object.assign({pid: personaID}, persona),
            personaID: personaID,
            pid: personaID,
        });
        //inviteContext.restoreVanilla({sNew: false, sEdit: true});
        //postContext.restoreVanilla({sNew: false, sEdit: true, sInit: true});

        let ppost = JSON.parse(JSON.stringify(vanillaPost));

        if (!post?.publishDate) {
            console.log(
                `EditPostButton querying personas/${personaID}/posts/${postID}`,
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
            //console.log('pst.data()->', pst.data());
        } else {
            console.log(
                `EditPostButton using post ${JSON.stringify(
                    post,
                    undefined,
                    4,
                )} at postID ${postID}`,
            );
            Object.assign(ppost, post);
        }

        //console.log('after the restoreVanilla train');
        //console.log('post?.subPersonaID', ppost?.subPersonaID);
        //console.log(JSON.stringify(ppost, undefined, 4));
        let subPersona = ppost?.subPersonaID
            ? Object.assign({}, personaMap[ppost?.subPersonaID])
            : {};

        postContext.current.csetState({
            post: {
                ...ppost,
                subPersona,
                pid: postID,
            },
            communityID: communityID,
            // init: true,
            // edit: true,
            visible: true,
            // remix: false,
            // new: false,
        });

        //console.log('after the postContext.csetState');
        inviteContext.csetState({new: false, edit: true});
        //personaContext.csetState({new: false, edit: true});
        //console.log('after the inviteContext.csetState');

        setTimeout(() => {
            navigation.navigate('Persona', {
                screen: 'StudioPostCreation',
                persona,
                personaID: persona?.pid,
                inputPost: ppost,
                inputPostID: ppost?.pid,
                editPost: true,
                communityID: communityID,
            });
        });
    }, [
        communityID,
        doFirst,
        post,
        personaContext,
        personaID,
        persona,
        personaMap,
        postContext,
        postID,
        inviteContext,
        navigation,
    ]);

    const togglePostActionMenu = useCallback(() => {
        setShowPostActionMenu(!showPostActionMenu);
    }, [showPostActionMenu]);

    const closePostActionMenuPosition =
        Platform.OS === 'ios'
            ? {bottom: 60, right: 110}
            : {bottom: 30, right: 110};

    const handleEditPost = () => {
        wide && navigation.navigate('Forum');
        if (post?.type === 'event') {
            postContext.current.csetState({
                event: true,
                post: {...post, pid: postID},
                edit: true,
            });
        } else {
            postContext.current.csetState({
                visible: true,
                post: {...post, pid: postID},
                edit: true,
            });
        }
    };

    if (wide) {
        return (
            <TouchableOpacity
                onPress={handleEditPost}
                style={{
                    marginStart: 40,
                    width: '80%',
                    height: 42,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginEnd: 40,
                    padding: 10,
                    borderRadius: 8,
                    marginTop: 20,
                    backgroundColor: colors.paleBackground,
                }}>
                <Icon
                    color={colors.textFaded2}
                    name={'edit'}
                    size={size * 0.88}
                />
                <Text
                    style={{
                        fontSize: 16,
                        color: colors.postAction,
                        fontFamily: fonts.bold,
                        marginStart: 10,
                    }}>
                    Edit
                </Text>
            </TouchableOpacity>
        );
    }

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
                    onPress={handleEditPost}>
                    <Icon
                        color={colors.textFaded2}
                        name={'edit'}
                        size={size * 0.88}
                    />
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
