import React, {useContext, useState, useEffect, useCallback} from 'react';
import FeedPost from 'components/FeedPost';

import {useNavigation} from '@react-navigation/native';
import baseText from 'resources/text';
import {TouchableOpacity, View, FlatList, RNAnimated} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {clog, cerror} from 'utils/log';
import {PersonaStateContext} from 'state/PersonaState';

// import styles from './styles';

const CUSTOM_LOG_WARN_HEADER = '!! components/ProfileMenuScreen';
const log = (...args) =>
    global.LOG_DEBUG && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);

export default function BookmarksScreen() {
    const navigation = useNavigation();
    const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
    const userID = auth().currentUser.uid;

    const personaContext = React.useContext(PersonaStateContext);
    let personaKey = personaContext?.persona?.pid;

    useEffect(() => {
        let value;
        let unsubscribe = firestore()
            .collection('users')
            .doc(userID)
            .collection('bookmarks')
            .onSnapshot(bookmarkSnap => {
                value = bookmarkSnap.docs.map(doc => {
                    let data = doc.data();
                    data.postKey = doc.id;
                    return data;
                });
                setBookmarkedPosts(value);
            });
        return () => unsubscribe();
    }, [userID]);

    const keyExtractor = post => {
        return post.pid;
    };

    const renderItem = ({item}) => {
        return (
            <FeedPost
                showIdentity={true}
                post={item.post}
                navToPost={true}
                navigation={navigation}
                personaName={personaContext.persona.name}
                personaKey={item.personaID}
                persona={personaContext.persona}
                communityId={personaKey}
                postKey={item.postKey}
                compact={true}
                bookmark={true}
                key={item.postKey}
            />
        );
    };

    return (
        <View>
            <FlatList
                // onScroll={onScroll}
                data={bookmarkedPosts}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
            />
        </View>
    );
}
