import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {colors} from 'resources';
import styles from './styles';

const Header = ({title, setVisible}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={setVisible}>
                <Icon name={'arrow-left'} color={colors.postAction} size={25} />
            </TouchableOpacity>
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                <Text style={styles.text}>{title}</Text>
            </View>
            <TouchableOpacity onPress={setVisible}>
                <Icon name={'x'} color={colors.postAction} size={25} />
            </TouchableOpacity>
        </View>
    );
};

export default Header;
