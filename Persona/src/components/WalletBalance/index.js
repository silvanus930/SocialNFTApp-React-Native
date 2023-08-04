import React, {useEffect, useCallback, useState} from 'react';
import {Text, View} from 'react-native';
import Currency from 'components/Currency';
import {observer} from 'mobx-react-lite';
import TokenExchangeStore from 'stores/TokenExchangeStore';
import {getUser} from 'actions/users';

const REFRESH_INTERVAL_IN_SECONDS = 60;

export const WalletBalance = ({wallet, userId, style}) => {
    const [userWallet, setUserWallet] = useState(wallet);
    const [totalBalance, setTotalBalance] = useState(null);
    const tokens = TokenExchangeStore.tokens;

    const calculateBalance = async () => {
        let sum = null;

        if (userWallet) {
            sum = 0;
            for (const [symbol, object] of Object.entries(tokens)) {
                const count = userWallet[symbol];
                const exchangeRate = object?.rate;
                if (count && exchangeRate) {
                    sum += count * exchangeRate;
                }
            }
        }

        setTotalBalance(sum);
    };

    const getUserWallet = useCallback(
        async userId => {
            const user = await getUser(userId);
            setUserWallet(user.data().walletBalance);
        },
        [userId],
    );

    useEffect(() => {
        setUserWallet(wallet);
    }, [wallet]);

    useEffect(() => {
        getUserWallet(userId);
    }, [userId, tokens]);

    useEffect(() => {
        calculateBalance();
    }, [userWallet, tokens]);

    useEffect(() => {
        if (userId) {
            const interval = setInterval(() => {
                console.log(
                    '[WalletBalance] refreshing balance for userId: ',
                    userId,
                );
                getUserWallet(userId);
            }, REFRESH_INTERVAL_IN_SECONDS * 1000);

            return () => clearInterval(interval);
        }
    }, [userId]);

    if (!totalBalance) {
        return null;
    }

    return <Currency symbol="usd" amount={totalBalance} style={style} />;
};

export default observer(WalletBalance);
