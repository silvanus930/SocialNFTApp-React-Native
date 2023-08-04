import React from 'react';
import {TouchableOpacity, ActivityIndicator} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles from './styles';

const RoundIconButton = ({icon, onPress, isLoading}) => (
    <TouchableOpacity
        style={styles.container}
        onPress={!isLoading ? onPress : () => {}}>
        {!isLoading ? (
            <FontAwesome name={icon} color="#AAAEB2" size={21} />
        ) : (
            <ActivityIndicator color="#AAAEB2" />
        )}
    </TouchableOpacity>
);

export default RoundIconButton;
