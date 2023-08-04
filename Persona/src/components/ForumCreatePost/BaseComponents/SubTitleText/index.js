import React from 'react';
import {Text, View} from 'react-native';
import styles from './styles';

const SubTitleText = ({title}) => {
    return <Text style={styles.text}>{title}</Text>;
};

export default SubTitleText;
