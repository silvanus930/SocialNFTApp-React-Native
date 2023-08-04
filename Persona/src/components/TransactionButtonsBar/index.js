import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
    TouchableWithoutFeedback,
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StyleSheet,
    Linking,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import {images} from 'resources';
import styles from './styles';

const ActionButton = ({
    onPress = null,
    fontColor = '#AAAEB2',
    label,
    image = null,
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.actionButtonContainer}>
            <View>{image}</View>
            <Text style={styles.actionButtonText({fontColor})}>{label}</Text>
        </TouchableOpacity>
    );
};

const BuyButton = ({onPress}) => {
    return (
        <ActionButton
            onPress={onPress}
            image={
                <FastImage
                    source={images.portfolioBuy}
                    style={styles.actionButtonIcon}
                />
            }
            label={'Buy'}
        />
    );
};

const SwapButton = ({onPress}) => {
    return (
        <ActionButton
            onPress={onPress}
            image={
                <FastImage
                    source={images.portfolioSwap}
                    style={styles.actionButtonIcon}
                />
            }
            label={'Swap'}
        />
    );
};

const WithdrawButton = ({onPress}) => {
    return (
        <ActionButton
            onPress={onPress}
            image={
                <FastImage
                    source={images.portfolioWithdraw}
                    style={styles.actionButtonIcon}
                />
            }
            fontColor="#E6E8EB"
            label={'Withdraw'}
        />
    );
};

const DepositButton = ({onPress}) => {
    return (
        <ActionButton
            onPress={onPress}
            image={
                <FastImage
                    source={images.portfolioDeposit}
                    style={styles.actionButtonIcon}
                />
            }
            fontColor="#E6E8EB"
            label={'Deposit'}
        />
    );
};

const TransactionButtonsBar = ({
    onPressDeposit,
    onPressWithdraw,
    onPressBuy,
    onPressSwap,
    canDeposit = true,
    canWithdraw = true,
    canBuy = true,
    canSwap = true,
}) => {
    return (
        <View style={styles.actionBarContainer}>
            {canDeposit && <DepositButton onPress={onPressDeposit} />}
            {canWithdraw && <WithdrawButton onPress={onPressWithdraw} />}
            {canBuy && <BuyButton onPress={onPressBuy} />}
            {canSwap && <SwapButton onPress={onPressSwap} />}
        </View>
    );
};

export default TransactionButtonsBar;
