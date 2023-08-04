import React, {useEffect, useRef} from 'react';
import {Text, View} from 'react-native';
import TokenExchangeStore from 'stores/TokenExchangeStore';
import Currency from 'components/Currency';
import pluralize from 'pluralize';

import styles from './styles';

const TransfersSummary = ({transfers}) => {
    const tokens = TokenExchangeStore.tokens;
    let usdSum = 0;

    if (!transfers || transfers.length === 0) {
        return null;
    }

    transfers.map(transfer => {
        const tx =
            transfer?.post?.data?.transfer || transfer?.entry?.post?.transfer;

        const token = tokens[tx?.currency.toLowerCase()];
        if (token) {
            usdSum += tx?.amount * token?.rate;
        }
    });

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                <Currency symbol="usd" amount={usdSum} />
                <Text>
                    {' '}
                    ({transfers.length}{' '}
                    {pluralize('transfers', transfers.length)})
                </Text>
            </Text>
        </View>
    );
};

export default TransfersSummary;
