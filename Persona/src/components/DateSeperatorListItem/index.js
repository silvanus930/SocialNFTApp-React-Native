import React from 'react';
import {Text, View} from 'react-native';
import {DateTime} from 'luxon';

import styles from './styles';

// date is a luxon DateTime object
const DateSeperatorListItem = ({date}) => {
    const now = DateTime.now();
    let datetimeString = date.toFormat('d LLLL y');

    if (
        date.month === now.month &&
        date.day === now.day &&
        date.year === now.year
    ) {
        datetimeString = 'Today';
    }

    return (
        <View key={datetimeString} style={styles.container}>
            <View style={styles.contentContainer}>
                <Text style={styles.text}>{datetimeString}</Text>
            </View>
        </View>
    );
};

export default DateSeperatorListItem;
