import React, {useContext} from 'react';
import {TouchableOpacity, View} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {FeedMenuDispatchContext} from 'state/FeedStateContext';

import colors from 'resources/colors';

import styles from './styles';

export default function EndorsementButton({style, postKey, personaKey}) {
    const {dispatch} = useContext(FeedMenuDispatchContext);
    return (
        <TouchableOpacity
            onPress={({nativeEvent}) =>
                dispatch({
                    type: 'openEndorsementsMenu',
                    payload: {
                        touchY: nativeEvent.pageY,
                        postKey,
                        personaKey,
                    },
                })
            }
            style={styles.container(style)}>
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name={'emoji-emotions'}
                    style={styles.icon}
                    size={18}
                    color={colors.textFaded2}
                />
            </View>
        </TouchableOpacity>
    );
}
