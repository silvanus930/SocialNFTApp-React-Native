import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Keyboard,
    View,
} from 'react-native';
import baseText from 'resources/text';
import FastImage from 'react-native-fast-image';
import colors from 'resources/colors';
import React, {useState, useContext} from 'react';
import {GlobalStateContext} from 'state/GlobalState';
import firestore from '@react-native-firebase/firestore';
import {useKeyboard} from 'hooks/useKeyboard';
import Icon from 'react-native-vector-icons/Feather';
import images from 'resources/images';
import getResizedImageUrl from 'utils/media/resize';

export default function CreateReportContent({}) {
    const {user} = useContext(GlobalStateContext);
    const [newComment, setNewComment] = useState('');
    const [keyboardHeight] = useKeyboard();

    function submitComment() {
        const postRef = firestore()
            .collection('personas')
            .doc(personaKey)
            .collection(studioChat ? 'chats' : 'posts')
            .doc(postKey);
        postRef.get().then(postDoc => {
            if (postDoc.exists && !postDoc.data().deleted) {
                postRef
                    .collection(studioChat ? 'messages' : 'comments')
                    .add({
                        userID: user.id,
                        timestamp: firestore.Timestamp.now(),
                        text: newComment,
                        deleted: false,
                    })
                    .then(ref => {
                        setNewComment('');
                        handleScrollToEnd();
                        Keyboard.dismiss();
                    });
            } else {
                alert(
                    "You're trying to comment on a post that no longer exists!",
                );
            }
        });
    }
    let approxHeightCommentContainer = 64;

    return (
        <View
            style={{
                ...Styles.reportContentContainer,
                bottom: keyboardHeight
                    ? keyboardHeight - approxHeightCommentContainer
                    : 0,
            }}>
            <FastImage
                source={{
                    uri: getResizedImageUrl({
                        origUrl:
                            user.profileImgUrl ||
                            images.personaDefaultProfileUrl,
                        height: Styles.personImage.height,
                        width: Styles.personImage.width,
                    }),
                }}
                style={Styles.personImage}
            />
            <TextInput
                ref={textInputRef}
                multiline
                style={Styles.textInput}
                placeholder={
                    studioChat
                        ? `Post to chat with ${
                              chatContext?.attendees
                                  ? chatContext?.attendees.length
                                  : 22
                          } users...`
                        : 'Add a comment...'
                }
                placeholderTextColor={colors.textFaded2}
                editable={true}
                clearTextOnFocus={false}
                onChangeText={setNewComment}
                spellCheck={true}
                value={newComment}
                keyboardAppearance="dark"
                maxLength={300}
                style={{...baseText}}
            />
            <TouchableOpacity
                style={Styles.postAction}
                onPress={submitComment}
                disabled={!newComment}>
                <View style={Styles.sendIcon}>
                    <Icon name="send" size={24} color={colors.actionText} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const Styles = StyleSheet.create({
    sendIcon: {
        width: 30,
        height: 25,
        flexDirection: 'column',
        alignContent: 'center',
        justifyContent: 'center',
    },
    reportContentContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 0,
        paddingTop: 10,
        paddingLeft: 15,
        paddingBottom: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: colors.seperatorLineColor,
        borderBottomColor: colors.seperatorLineColor,
    },
    postAction: {
        marginLeft: 10,
        marginRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 5,
        paddingRight: 5,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    personImage: {
        width: 30,
        height: 30,
        borderRadius: 30,
    },
    textInput: {
        color: 'white',
        fontSize: 14,
        marginLeft: 10,
        flex: 12,
        backgroundColor: colors.seperatorLineColor,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 8,
        borderRadius: 5,
    },
});
