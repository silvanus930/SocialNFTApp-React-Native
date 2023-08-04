import React from 'react';
import {Text, View} from 'react-native';
import ParseText from 'components/ParseText';
import colors from 'resources/colors';
import isEqual from 'lodash.isequal';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(PostText, propsAreEqual);
function PostText({text}) {
    return (
        <View
            style={{
                flexDirection: 'column',
                marginTop: 6,
                marginBottom: 6,
                marginLeft: 15,
                marginRight: 15,
            }}>
            <ParseText style={{color: colors.text}} text={text} />
        </View>
    );
}
