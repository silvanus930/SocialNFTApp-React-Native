import React from 'react';
import isEqual from 'lodash.isequal';
import fonts from 'resources/fonts';
import colors from 'resources/colors';
import {RemixRenderStateContext} from 'state/RemixRenderState';
import Icon from 'react-native-vector-icons/Feather';
import palette from 'resources/palette';
import {Text, TouchableOpacity, View, StyleSheet} from 'react-native';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(RemixPostButton, propsAreEqual);
function RemixPostButton({
    color = colors.textFaded2,
    style = {},
    background = true,
    wide = false,
    persona,
    post,
    postID,
    doFirst = null,
    personaID,
    size = palette.icon.size / 2,
}) {
    const remixRenderState = React.useContext(RemixRenderStateContext);
    const remixOnPressMemoized = React.useCallback(async () => {
        doFirst && doFirst();
        console.log('remixPostButton: setting post', post);
        const postCopy = Object.assign({}, post);
        // Reset back to defaults
        postCopy.new = true;
        postCopy.anonymous = false;
        postCopy.identityID = '';
        postCopy.identityName = '';
        postCopy.identityBio = '';
        postCopy.identityProfileImgUrl = '';
        remixRenderState.csetState({
            draft: true,
            showToggle: true,
            personaID: personaID,
            post: postCopy,
            persona: persona,
            postID: postID,
        });
    }, [
        remixRenderState,
        postID,
        post,
        post?.subPersonaID,
        post?.pid,
        persona?.pid,
        persona,
        personaID,
        doFirst,
    ]);

    if (wide) {
        return (
            <TouchableOpacity
                onPress={remixOnPressMemoized}
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
                <Icon color={color} name={'refresh-ccw'} size={size * 0.88} />
                <Text
                    style={{
                        fontSize: 16,
                        color: colors.postAction,
                        fontFamily: fonts.bold,
                        marginStart: 10,
                    }}>
                    Remix
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <View style={{...Styles.optionsButton}}>
            <View
                style={{
                    padding: 0.5,
                    backgroundColor: background ? '' : colors.topBackground,
                    borderRadius: size * 1.7,
                    width: size * 1.7,
                    height: size * 1.7,
                    borderWidth: 1,
                    borderColor: 'grey',
                    zIndex: 9999,
                    ...style,
                }}>
                <TouchableOpacity
                    hitSlop={{top: 10, bottom: 30, left: 20, right: 20}}
                    onPress={remixOnPressMemoized}>
                    <Icon
                        color={color}
                        name={'refresh-ccw'}
                        size={size * 0.88}
                    />
                </TouchableOpacity>
            </View>
        </View>
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
    optionsButton: {
        alignItems: 'center',
        alignSelf: 'center',
        flex: 1,
        marginLeft: 5,
    },
});
