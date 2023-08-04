import React from 'react';
import {View} from 'react-native';

import {PostEndorsements} from 'components/PostCommon';
import {propsAreEqual} from 'utils/propsAreEqual';
import styles from './styles';

const PostEndorsementsPanePreMemo = ({postKey, personaKey}) => {
    return (
        <View style={styles.container}>
            <PostEndorsements
                vertical={false}
                personaKey={personaKey}
                postKey={postKey}
            />
        </View>
    );
};
export default React.memo(PostEndorsementsPanePreMemo, propsAreEqual);
