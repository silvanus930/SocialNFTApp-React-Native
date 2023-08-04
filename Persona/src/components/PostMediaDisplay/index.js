import React, {useContext} from 'react';
import {View} from 'react-native';

import {GlobalStateRefContext} from 'state/GlobalStateRef';

import {vanillaPersona} from 'state/PersonaState';
import {POST_TYPE_ARTIST} from 'state/PostState';

import PostMedia from 'components/PostMedia';

import {AutoSavePostText} from 'components/PostCommon';
import {DiscussionEngineDispatchContext} from 'components/DiscussionEngineContext';
import {safeAreaOffset} from 'components/DiscussionEngineConstants';

import FileList from './components/FileList';
import ArtistWrapped from './components/ArtistWrapped';

import styles from './styles';

export default function PostMediaDisplay({
    addPadding,
    animatedKeyboardOffset,
    myPost,
    myPersona,
    postHasMedia,
    post,
    small = false,
    postKey,
    navigation,
    mediaDisabled = false,
    registerMediaPlayer = null,
    startPaused = true,
    index = undefined,
    mediaBorderRadius = 0,
    personaKey,
}) {
    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);

    const subPersona = personaMap[post.subPersonaID]
        ? personaMap[post.subPersonaID]
        : vanillaPersona;

    const fileUris = post.fileUris ? post.fileUris : [];
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const onFocusPostText = () => {
        if (!addPadding) {
            animatedKeyboardOffset.value = safeAreaOffset;
        }
        dispatch({type: 'setEditingPost', payload: true});
    };
    const onBlurPostText = () => {
        dispatch({type: 'setEditingPost', payload: false});
    };
    return (
        <View style={{marginStart: 0}}>
            <PostMedia
                postKey={postKey}
                personaKey={personaKey}
                enableMediaFullScreenButton={true}
                index={index || postKey}
                mediaDisabled={mediaDisabled}
                navigation={navigation}
                startPaused={startPaused}
                offset={40}
                registerMediaPlayer={registerMediaPlayer}
                small={small}
                post={post}
                style={{
                    borderRadius: mediaBorderRadius,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    marginTop: 0,
                }}
            />
            {post?.type === POST_TYPE_ARTIST ? (
                <ArtistWrapped
                    navigation={navigation}
                    subPersona={subPersona}
                />
            ) : null}
            <View style={{marginStart: 0, marginTop: 6, marginEnd: 0}}>
                {/* Inline edit does not work on Android in post discussion because
         the component is scale inverted. This is fixable by moving the
         post discussion components outside of the inverted list header,
         however, it will require updating some measurements in the
         discussion engine - expect 4-8 hours of bugfixing.*/}
                <AutoSavePostText
                    inlineEditDisable={true}
                    onFocusPostText={onFocusPostText}
                    onBlurPostText={onBlurPostText}
                    postKey={postKey}
                    hasMedia={postHasMedia}
                    personaKey={personaKey}
                    fullText={post.text}
                    displayText={post.text}
                    myPersona={myPersona}
                    myPost={myPost}
                    postAnonymous={post?.anonymous}
                    postIdentityID={post?.identityID}
                />
            </View>
            {fileUris.length ? <FileList fileUris={fileUris} /> : null}
        </View>
    );
}
