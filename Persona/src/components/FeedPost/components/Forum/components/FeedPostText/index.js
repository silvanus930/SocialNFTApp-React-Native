import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import MarkDown from 'components/MarkDown';

import fonts from 'resources/fonts';

import styles from './styles';

import {propsAreEqual} from 'utils/propsAreEqual';
import CommentCounter from '../CommentCounter';
import PostEndorsementsPane from '../PostEndorsementsPane';
import EndorsementButton from '../EndorsementButton';

export default React.memo(FeedPostTextPreMemo, propsAreEqual);
function FeedPostTextPreMemo({
    post,
    text,
    hasMedia = false,
    navToPostDiscussion,
    personaKey,
    postKey,
    postType,
    compact,
    bookmark,
}) {
    return (
        <View style={styles.container}>
            {!compact && (
                <View style={styles.subContainer}>
                    <MarkDown
                        text={text.slice(0, 50) + ' ...'}
                        fontSize={16}
                        hasMedia={hasMedia}
                        fontFamily={fonts.regular}
                        elementStyles={styles.markDownElement}
                    />
                </View>
            )}

            {!bookmark && (
              <View style={styles.endorsementContainer}>
                <View style={styles.postEndorSementPaneContainer}>
                    <PostEndorsementsPane
                        personaKey={personaKey}
                        postKey={postKey}
                        post={post}
                    />
                </View>
                <View style={styles.endorsementButton}>
                    <EndorsementButton
                        postKey={postKey}
              personaKey={personaKey}
                    />
                </View>
              </View>
            )}
            {!bookmark && (
            <View style={styles.commentContainer}>
                <TouchableOpacity
                    hitSlop={{top: 2, bottom: 10, left: 30, right: 18}}
                    onPress={navToPostDiscussion}
                    style={styles.navToPostDiscussion}>
                    <CommentCounter
                        style={styles.commentCounter}
                        post={post}
                        postKey={postKey}
                        postType={postType}
                        personaKey={personaKey}
                    />
                </TouchableOpacity>
            </View>
            )}
        </View>
    );
}
