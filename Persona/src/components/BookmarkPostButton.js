import auth from '@react-native-firebase/auth';
import React, {useState, useCallback, useEffect} from 'react';
import isEqual from 'lodash.isequal';
import colors from 'resources/colors';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import palette from 'resources/palette';
import {Text, TouchableOpacity, View, StyleSheet, Platform} from 'react-native';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(BookmarkPostButton, propsAreEqual);
function BookmarkPostButton({
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
    const [isBookmarked, setIsBookmarked] = useState(false);

    const userID = auth().currentUser.uid;

    useEffect(() => {
        let curPost = firestore()
            .collection('users')
            .doc(userID)
            .collection('bookmarks')
            .doc(postID);
        curPost.onSnapshot(doc => setIsBookmarked(doc.exists));
    }, [userID, postID]);

    const handleBookmark = async () => {
        const bookmarkRef = firestore()
            .collection(`users/${userID}/bookmarks`)
            .doc(postID);
        const bookmarkSnapshot = await bookmarkRef.get();
        if (bookmarkSnapshot.exists) {
            bookmarkRef.delete();
            setIsBookmarked(false);
        } else {
            communityID = communityID || 'none';
            let bookmarkData = {post, communityID, personaID};
            bookmarkRef.set(bookmarkData);
            setIsBookmarked(true);
        }
    };
    return (
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
                {/* {isBookmarked ? (
                    <Text>"bookmark"</Text>
                ) : (
                    <Text>"unbookmark"</Text>
                )} */}
                <TouchableOpacity
                    hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}
                    onPress={handleBookmark}>
                    <Icon
                        color={colors.textFaded2}
                        name={isBookmarked ? 'bookmark' : 'bookmark-o'}
                        size={size * 1.22}
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
    optionsButton: {marginTop: 2, marginLeft: 6},
});
