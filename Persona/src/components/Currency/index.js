import React, {useEffect, useCallback, useState} from 'react';
import {Text} from 'react-native';
import {observer} from 'mobx-react-lite';
const currencyFormatter = require('currency-formatter');
import TokenExchangeStore from 'stores/TokenExchangeStore';

const Currency = ({symbol, amount, style}) => {
    const tokens = TokenExchangeStore.tokens;

    useEffect(() => {
        TokenExchangeStore.fetchExchangeRate(symbol);
    }, [symbol, tokens]);

    const forceUpdateExchangeRate = useCallback(() => {
        TokenExchangeStore.fetchExchangeRate(symbol, true);
    }, [symbol]);

    let formattedValue;
    const exchangeRate = tokens[symbol]?.rate;
    const value = amount * exchangeRate;

    if (exchangeRate) {
        formattedValue = currencyFormatter.format(value, {code: 'USD'});
    } else {
        return null;
    }

    return <Text style={style}>{formattedValue}</Text>;
};

export default observer(Currency);
