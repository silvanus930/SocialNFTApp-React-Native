import React, {useState} from 'react';
import isEqual from 'lodash.isequal';
import fonts from 'resources/fonts';
import colors from 'resources/colors';
import {PersonaStateContext} from 'state/PersonaState';
import firestore from '@react-native-firebase/firestore';
import {PostStateContext} from 'state/PostState';
import {getServerTimestamp} from 'actions/constants';
import {InviteStateContext} from 'state/InviteState';
import Icon from 'react-native-vector-icons/Feather';
import {clog, cwarn} from 'utils/log';
const CUSTOM_LOG_WARN_HEADER = '!! components/AddPostButton';
import palette from 'resources/palette';
import {Alert, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {recursiveMarkDelete} from 'actions/utils';
import {PresenceStateRefContext} from 'state/PresenceStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {POST_TYPE_PROPOSAL} from 'state/PostState';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(DeletePostButton, propsAreEqual);
function DeletePostButton({
    style = {},
    background = true,
    wide = false,
    doFirst = null,
    persona,
    post,
    postID,
    personaID,
    communityID,
    size = palette.icon.size / 2,
}) {
    //const presenceContext = React.useContext(PresenceStateContext);

    const deleteOnPressMemoized = React.useCallback(async () => {
        doFirst && doFirst();
        if (post?.minted) {
            return;
        }
        const postDoctRef =
            communityID === personaID
                ? firestore()
                      .collection('communities')
                      .doc(persona.pid)
                      .collection('posts')
                      .doc(postID)
                : firestore()
                      .collection('personas')
                      .doc(persona.pid)
                      .collection('posts')
                      .doc(postID);
        await postDoctRef.set(
            {deleted: true, deletedAt: getServerTimestamp()},
            {merge: true},
        );
        await recursiveMarkDelete(postDoctRef);

        if (post?.type === POST_TYPE_PROPOSAL) {
            await post?.proposalRef.update({
                deleted: true,
                deletedAt: getServerTimestamp(),
            });
        }

        //};
    }, [communityID, doFirst, post?.minted, persona.pid, postID]);
    const _deleteAsync = React.useCallback(() => {
        if (post?.minted) {
            return;
        }
        Alert.alert(`Delete ${post?.title || 'post'}`, 'Are you sure?', [
            {text: 'no', onPress: null, style: 'cancel'},
            {
                text: 'yes',
                onPress: deleteOnPressMemoized,
            },
        ]);
    }, [doFirst, post?.minted, post, deleteOnPressMemoized]);

    if (wide) {
        return (
            <TouchableOpacity
                onPress={_deleteAsync}
                style={{
                    marginStart: 40,
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: 42,
                    width: '80%',
                    marginEnd: 40,
                    padding: 10,
                    borderRadius: 8,
                    marginTop: 20,
                    backgroundColor: colors.paleBackground,
                }}>
                <Icon color={colors.red} name={'trash'} size={size * 1.42} />
                <Text
                    style={{
                        fontSize: 16,
                        color: colors.postAction,
                        fontFamily: fonts.bold,
                        color: colors.red,
                        marginStart: 10,
                    }}>
                    Delete
                </Text>
            </TouchableOpacity>
        );
    }

    return !post?.minted ? (
        <View style={{...Styles.optionsButton}}>
            <View style={{}}>
                <TouchableOpacity
                    hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}
                    onPress={_deleteAsync}>
                    <Icon
                        color={colors.textFaded2}
                        name={'x'}
                        size={size * 1.42}
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
        borderWidth: 5,
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
    optionsButton: {},
});
