import React, {useCallback} from 'react';
import {TouchableOpacity, FlatList, Clipboard, View, Text} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import styles from './styles';

export default function FileList({fileUris}) {
    const renderItem = useCallback(({item}) => {
        return (
            <TouchableOpacity
                onPress={() => Clipboard.setString(item.uri)}
                style={styles.item}>
                <Icon
                    color={'white'}
                    style={styles.itemIcon}
                    size={22}
                    name={'file'}
                />
                <View style={styles.itemTitleWrapper}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        );
    }, []);

    return (
        <FlatList
            bounces={false}
            showsHorizontalScrollIndicator={false}
            style={styles.list}
            contentContainerStyle={styles.listContainer}
            horizontal={true}
            data={fileUris}
            keyExtractor={item => {
                return item.uri;
            }}
            renderItem={renderItem}
        />
    );
}
