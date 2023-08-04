import React from 'react';
import {Text} from 'react-native';
import baseText from 'resources/text';
import colors from 'resources/colors';

export default function PostPublishDate({
    post,
    editDate = false,
    style = {},
    editable = false,
}) {
    const publishDate = editDate ? post.editDate || {} : post.publishDate || {};
    const showDate = publishDate.hasOwnProperty('seconds');
    const date = editable ? new Date() : new Date(publishDate.seconds * 1000);
    const time = date
        .toLocaleTimeString()
        .replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, '$1$3');
    const dateString = date.toLocaleDateString() + ' ' + time;
    return true ? (
        <Text
            style={{
                ...baseText,
                color: colors.textFaded2,
                marginTop: 5,
                marginStart: 15,
                fontSize: 12,
                ...style,
            }}>
            {post.editDate && editDate ? 'Edited: ' : ''}
            {dateString}
        </Text>
    ) : (
        <></>
    );
}
