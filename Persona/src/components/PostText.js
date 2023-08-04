import React from 'react';
import {Text, View, StyleSheet, Vibration} from 'react-native';
import colors from 'resources/colors';
import {PostStateContext} from 'state/PostState';
import ParseText from 'components/ParseText';

import {DynamicText, Styles} from 'components/Dynamic';

export default function PostText({editable, post}) {
    const postContext = React.useContext(PostStateContext);

    return editable ? (
        <View
            style={{
                marginStart: 15,
                marginEnd: 15,
                flexDirection: 'column',
                marginTop: 6,
                marginBottom: 6,
            }}>
            <DynamicText
                key="dynamicPostTextInput"
                blurb="Compose some text for this post..."
                multiline={true}
                text={postContext.post.text}
                changeText={text => {
                    postContext.setPostText(text);
                }}
            />
        </View>
    ) : (
        <View
            style={{
                flex: 1,
                marginStart: 15,
                marginEnd: 15,
                flexDirection: 'column',
                marginTop: 6,
                marginBottom: 6,
            }}>
            <ParseText
                style={{color: colors.text}}
                text={post.text.toString()}
            />
        </View>
    );
}
