import React, {useEffect, useState, memo} from 'react';
import {Text, View} from 'react-native';

import FastImage from 'react-native-fast-image';
import pluralize from 'pluralize';

import images from 'resources/images';

import styles from './styles';

import {propsAreEqual} from 'utils/propsAreEqual';
import {getLivePost} from 'actions/posts';

const CommentCounterPreMemo = ({
    style = {},
    post,
    postKey,
    postType,
    personaKey,
}) => {
    const [numComments, setNumComments] = useState(post?.numComments || 0);
    useEffect(() => {
        const collection =
            postType === 'community' ? 'communities' : 'personas';
        return getLivePost(
            collection,
            personaKey,
            postKey,
            setNumComments,
            post,
        );
    }, [personaKey, post, postKey, postType]);

    return (
        <>
            <View style={styles.container(style)}>
                <FastImage source={images.commentBubble} style={styles.image} />
                <Text style={styles.text}>
                    {`${numComments} ${pluralize('comment', numComments)}`}
                </Text>
            </View>
        </>
    );
};

export default memo(CommentCounterPreMemo, propsAreEqual);
