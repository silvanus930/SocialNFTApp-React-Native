import React, {useCallback, useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import auth from '@react-native-firebase/auth';
import useDirectMessagesForUser from 'hooks/useDirectMessagesForUser';

import styles from './styles';

const DirectMessageTabIcon = ({color, size}) => {
    const {unseenDirectMessages} = useDirectMessagesForUser({
        userId: auth().currentUser.uid,
    });

    return (
        <View style={styles.container}>
            <FontAwesome
                color={color}
                name="comment"
                style={styles.icon}
                size={size + 1}
            />
            {unseenDirectMessages?.length > 0 && (
                <View style={styles.unreadIndicator} />
            )}
        </View>
    );
};

export default DirectMessageTabIcon;
