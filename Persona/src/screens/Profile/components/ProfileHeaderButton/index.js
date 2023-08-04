import React, {
    useContext,
    useState,
    useRef,
    useEffect,
    useCallback,
} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';

import styles from './styles';

const ProfileHeaderButton = ({title, onPress}) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
    );
};

export default ProfileHeaderButton;
