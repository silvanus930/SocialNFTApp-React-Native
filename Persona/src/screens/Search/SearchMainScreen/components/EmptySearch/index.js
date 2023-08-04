import React from 'react';
import {View, Text} from 'react-native';
import FastImage from 'react-native-fast-image';

import {images} from 'resources';

import styles from './styles';

const EmptySearch = () => {
    return (
        <View style={styles.emptyContentContainer}>
            <FastImage source={images.emptySearch} style={styles.emptyImage} />
            <View style={styles.emptycontentContainer}>
                <Text style={styles.emptyHeaderText}>
                    Sorry, we couldn’t find that
                </Text>
                <Text style={styles.emptyText}>
                    Please try searching for something else.
                </Text>
            </View>
        </View>
    );
};

export default EmptySearch;
