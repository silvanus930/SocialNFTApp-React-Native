import React, {useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {connectSearchBox} from 'react-instantsearch-native';

import styles from './styles';

const RecentSearch = ({prevSearch, inputRef, refine, setSearchVal}) => {
    const handleRecentItem = useCallback(
        value => {
            inputRef?.current.setNativeProps({
                text: value,
            });
            setSearchVal(value);
            refine(value);
        },
        [refine, inputRef, setSearchVal],
    );

    return (
        <View style={styles.recentSearchContainer}>
            <Text style={styles.recentText}>Recent searches</Text>
            {prevSearch.map((item, i) => (
                <React.Fragment key={item}>
                    <TouchableOpacity
                        onPress={() => handleRecentItem(item)}
                        style={styles.recentItemContainer}>
                        <Ionicons
                            name={'time-outline'}
                            size={22}
                            color={'#868B8F'}
                        />
                        <Text numberOfLines={1} style={styles.recentItemText}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                    {i !== prevSearch.length - 1 ? (
                        <View style={styles.divider} />
                    ) : null}
                </React.Fragment>
            ))}
        </View>
    );
};

export default connectSearchBox(RecentSearch);
