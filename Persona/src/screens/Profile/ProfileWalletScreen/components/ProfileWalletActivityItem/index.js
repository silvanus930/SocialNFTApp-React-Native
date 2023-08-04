import React, {useEffect, useState, useCallback, useContext} from 'react';
import {
    View,
    Text,
    ScrollView,
    ImageBackground,
    TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

import TransactionItem from 'components/TransactionItem';

import styles from './styles';

const ProfileWalletActivityItem = ({userId, item, isLastItem}) => {
    const userPath = `users/${userId}`;
    const sourceRefPath = item.sourceRef.path;
    const targetRefPath = item.targetRef.path;

    let title, type;

    if (item.sourceName === item.targetName) {
        type = 'Deposit';
        title = 'Wallet deposit';
    } else if (userPath === sourceRefPath) {
        type = 'Withdrawal';
        title = `Payment to ${item.targetName}`;
    } else if (userPath === targetRefPath) {
        type = 'Deposit';
        title = `Payment from ${item.sourceName}`;
    }

    return (
        <View style={styles.container}>
            <View style={styles.innerContainer({isLastItem: isLastItem})}>
                <TransactionItem
                    title={title}
                    type={type}
                    amount={item?.amount}
                    currency={item?.currency}
                    timestamp={item?.createdAt?.seconds}
                    showCheckbox={true}
                />
            </View>
        </View>
    );
};

export default ProfileWalletActivityItem;
