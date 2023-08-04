import React from 'react';
import {
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {DateTime} from 'luxon';
import Currency from 'components/Currency';

import {images} from 'resources';
import styles from './styles';

const TransactionItem = ({
    type,
    timestamp,
    amount,
    currency,
    title,
    showCheckbox = false,
}) => {
    const transferIcon =
        type === 'Deposit'
            ? images.transfersDeposit
            : images.transfersWithdrawal;

    let datetimeString;

    if (timestamp) {
        datetimeString =
            DateTime.fromSeconds(timestamp).toFormat('hh:mm a, d LLL y');
    }
    const transferValueString = `${amount} ${currency}`;

    return (
        <View style={styles.innerContainer}>
            <View>
                <FastImage
                    source={transferIcon}
                    style={styles.iconTransferType}
                />
                {showCheckbox && (
                    <FastImage
                        source={images.greenCheckbox}
                        style={styles.iconCheckbox}
                    />
                )}
            </View>
            <View style={styles.contentContainerCenter}>
                <Text style={styles.textHeader}>{title ? title : type}</Text>
                <Text style={styles.textSubheader}>{datetimeString}</Text>
            </View>
            <View style={styles.contentContainerRight}>
                <Text style={styles.textHeader}>{transferValueString}</Text>
                <Text style={styles.textSubheader}>
                    <Currency
                        symbol={currency?.toLowerCase()}
                        amount={amount}
                    />
                </Text>
            </View>
        </View>
    );
};

export default TransactionItem;
