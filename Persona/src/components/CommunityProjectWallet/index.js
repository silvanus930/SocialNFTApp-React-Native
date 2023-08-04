import {BlurView} from '@react-native-community/blur';
import React, {useCallback, useContext, useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import TokenExchangeStore from 'stores/TokenExchangeStore';

import images from 'resources/images';
import baseText from 'resources/text';
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
import {useNavigation} from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {Layout} from 'react-native-reanimated';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import {GlobalStateContext} from 'state/GlobalState';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {PersonaStateContext, vanillaPersona} from 'state/PersonaState';
import DepositModal from 'components/DepositModal';
import ProposeWithdrawalModal from 'components/ProposeWithdrawalModal';
import Currency from 'components/Currency';
import WalletBalance from 'components/WalletBalance';

import TransactionButtonsBar from 'components/TransactionButtonsBar';

import styles from './styles';
import stringify from 'json-stringify-safe';
import {selectLayout} from 'utils/helpers';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Section = ({title, icon, children}) => {
    return (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionPill}>
                <FastImage
                    source={icon.source}
                    style={[
                        styles.sectionPillIcon,
                        {
                            width: icon.width,
                            height: icon.height,
                        },
                    ]}
                />
                <Text style={styles.sectionPillText}>{title}</Text>
            </View>
            <View>{children}</View>
        </View>
    );
};

export const CommunityProjectWallet = ({hasAuth = true, small, persona}) => {
    const navigation = useNavigation();

    const [showProposeWithdrawalModal, setShowProposeWithdrawalModal] =
        useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [totalWalletBalance, setTotalWalletBalance] = useState(0);

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const personaContext = React.useContext(PersonaStateContext);
    const {personaMap} = useContext(GlobalStateContext);

    const isCommunity = !!persona?.cid;
    const entityID = persona?.pid || persona?.cid;

    const toggleShowProposeWithdrawalModal = useCallback(() => {
        setShowProposeWithdrawalModal(!showProposeWithdrawalModal);
    }, [showProposeWithdrawalModal]);

    const showProposeWithdrawalScreen = () => {
        profileModalContextRef.current.closeLeftDrawer();
        const entityType = isCommunity ? 'community' : 'project';

        navigation &&
            navigation.navigate('Propose Withdrawal', {
                entityID: entityID,
                entityType: entityType,
            });
    };

    const toggleShowDepositModal = useCallback(() => {
        setShowDepositModal(!showDepositModal);
    }, [showDepositModal]);

    //
    // Wallet
    //
    let wallet, walletBalance;
    if (persona?.cid || persona?.uid) {
        wallet = persona?.wallet ? persona?.wallet : '0x';
        walletBalance = persona?.walletBalance
            ? persona?.walletBalance
            : {usdc: 0, eth: 0, nft: 0};
    } else {
        wallet = personaMap[persona?.pid]?.wallet
            ? personaMap[persona?.pid]?.wallet
            : '0x';
        walletBalance = personaMap[persona?.pid]?.walletBalance
            ? personaMap[persona?.pid]?.walletBalance
            : {usdc: 0, eth: 0, nft: 0};
    }

    //
    // NFT Contract
    //
    const visitOpensea = React.useCallback(() => {
        Linking.openURL('https://opensea.io');
    }, [contract]);

    const visitPolygonscan = React.useCallback(() => {
        Linking.openURL(`https://polygonscan.com/token/${contract}`);
    }, [contract]);

    let contract = personaMap[persona?.pid]?.accessContract;
    if (persona?.cid) {
        contract = persona?.accessContract;
    }

    const viewAllAssets = useCallback(() => {
        personaContext.csetState({openFromTop: false, persona: vanillaPersona});
        profileModalContextRef.current.closeLeftDrawer();
        navigation?.navigate('Portfolio');
    }, [profileModalContextRef]);

    const usdBalance = walletBalance?.usd || 0;
    const ethBalance = walletBalance?.eth || 0;
    const usdcBalance = walletBalance?.usdc || 0;

    if (small) {
        return (
            <>
                <Animated.View
                    style={styles.smallContainer}
                    layout={selectLayout(Layout)}>
                    <Animated.View
                        style={styles.smallInnerTopContainer}
                        layout={selectLayout(Layout)}>
                        <Animated.Text
                            style={styles.smallTotalBalanceText}
                            layout={selectLayout(Layout)}>
                            <WalletBalance wallet={walletBalance} />
                        </Animated.Text>
                        <Animated.Text
                            style={styles.smallSpacerText}
                            layout={selectLayout(Layout)}>
                            •
                        </Animated.Text>
                        <Animated.Text
                            style={styles.smallViewAllAssetsText}
                            onPress={viewAllAssets}
                            layout={selectLayout(Layout)}>
                            View All Assets
                        </Animated.Text>
                    </Animated.View>
                    <Animated.View
                        style={styles.smallInnerBottomContainer}
                        layout={selectLayout(Layout)}>
                        <AnimatedTouchable
                            layout={selectLayout(Layout)}
                            onPress={toggleShowDepositModal}
                            style={styles.smallActionButton}>
                            <Animated.Text
                                style={styles.smallActionButtonText}
                                layout={selectLayout(Layout)}>
                                Deposit
                            </Animated.Text>
                        </AnimatedTouchable>
                        {/* -- show ProposeWithdrawalScreen instead --  */}
                        {hasAuth && (
                            <AnimatedTouchable
                                layout={selectLayout(Layout)}
                                onPress={showProposeWithdrawalScreen}
                                style={[
                                    styles.smallActionButton,
                                    styles.smallActionButtonWithdraw,
                                ]}>
                                <Animated.Text
                                    style={styles.smallActionButtonText}
                                    layout={selectLayout(Layout)}>
                                    Withdraw
                                </Animated.Text>
                            </AnimatedTouchable>
                        )}
                    </Animated.View>
                </Animated.View>

                <DepositModal
                    entityID={entityID}
                    entityType={isCommunity ? 'community' : 'project'}
                    toggleShowDepositModal={toggleShowDepositModal}
                    showDepositModal={showDepositModal}
                />

                {/* <ProposeWithdrawalModal
                    entityID={entityID}
                    entityType={isCommunity ? 'community' : 'project'}
                    toggleShowProposeWithdrawalModal={
                        toggleShowProposeWithdrawalModal
                    }
                    showProposeWithdrawalModal={showProposeWithdrawalModal}
                /> */}
            </>
        );
    }

    return (
        <View style={styles.container}>
            <TransactionButtonsBar
                onPressDeposit={toggleShowDepositModal}
                onPressWithdraw={showProposeWithdrawalScreen}
                onPressBuy={() => alert('Coming soon!')}
                onPressSwap={() => alert('Coming soon!')}
                canDeposit={true}
                canWithdraw={hasAuth}
                canBuy={hasAuth}
                canSwap={hasAuth}
            />

            <Section
                title="Wallet"
                icon={{source: images.portfolioWallet, width: 16, height: 16}}>
                <View>
                    {(!wallet || wallet) === '0x' ? (
                        <ActivityIndicator color={colors.timestamp} />
                    ) : (
                        <TextInput
                            editable={false}
                            style={styles.walletAddressText}>
                            {wallet.substring(0, 5) +
                                '...' +
                                wallet.slice(wallet.length - 4)}
                        </TextInput>
                    )}
                </View>

                {usdBalance ? (
                    <View style={styles.contentContainer}>
                        <View style={styles.contentContainerInnerLeft}>
                            <FastImage
                                source={{
                                    uri: images.usd,
                                }}
                                style={styles.contentIcon}
                            />
                        </View>
                        <View style={styles.contentContainerInnerCenter}>
                            <Text style={styles.contentTextPrimary}>
                                US Dollar
                            </Text>

                            <Text style={styles.contentTextSecondary}>
                                <Currency symbol={'usd'} amount={1} />
                            </Text>
                        </View>
                        <View style={styles.contentContainerInnerRight}>
                            <Text style={styles.contentTextPrimary}>
                                {(usdBalance || '0').toFixed(2)} USD
                            </Text>

                            <Text style={styles.contentTextSecondary}>
                                <Currency symbol={'usd'} amount={usdBalance} />
                            </Text>
                        </View>
                    </View>
                ) : null}

                {ethBalance ? (
                    <View style={styles.contentContainer}>
                        <View style={styles.contentContainerInnerLeft}>
                            <FastImage
                                source={{
                                    uri: images.eth,
                                }}
                                style={styles.contentIcon}
                            />
                        </View>
                        <View style={styles.contentContainerInnerCenter}>
                            <Text style={styles.contentTextPrimary}>
                                Ethereum
                            </Text>

                            <Text style={styles.contentTextSecondary}>
                                <Currency symbol={'eth'} amount={1} />
                            </Text>
                        </View>
                        <View style={styles.contentContainerInnerRight}>
                            <Text style={styles.contentTextPrimary}>
                                {ethBalance || '0'} ETH
                            </Text>

                            <Text style={styles.contentTextSecondary}>
                                <Currency symbol={'eth'} amount={ethBalance} />
                            </Text>
                        </View>
                    </View>
                ) : null}

                {usdcBalance ? (
                    <View style={styles.contentContainer}>
                        <View style={styles.contentContainerInnerLeft}>
                            <FastImage
                                source={{
                                    uri: images.usdc,
                                }}
                                style={styles.contentIcon}
                            />
                        </View>
                        <View style={styles.contentContainerInnerCenter}>
                            <Text style={styles.contentTextPrimary}>
                                USD Coin
                            </Text>

                            <Text style={styles.contentTextSecondary}>
                                <Currency symbol={'usdc'} amount={1} />
                            </Text>
                        </View>
                        <View style={styles.contentContainerInnerRight}>
                            <Text style={styles.contentTextPrimary}>
                                {usdcBalance || '0'} USDC
                            </Text>

                            <Text style={styles.contentTextSecondary}>
                                <Currency
                                    symbol={'usdc'}
                                    amount={usdcBalance}
                                />
                            </Text>
                        </View>
                    </View>
                ) : null}
            </Section>

            {contract && (
                <Section
                    title="NFT contracts"
                    icon={{
                        source: images.portfolioContract,
                        width: 14,
                        height: 18,
                    }}>
                    <View>
                        {!contract ? (
                            <ActivityIndicator color={colors.timestamp} />
                        ) : (
                            <TextInput
                                editable={false}
                                style={styles.walletAddressText}>
                                {contract?.substring(0, 5) +
                                    '...' +
                                    contract?.slice(contract?.length - 4)}
                            </TextInput>
                        )}

                        {contract && (
                            <>
                                <View style={styles.contentContainer}>
                                    <View
                                        style={
                                            styles.contentContainerInnerLeft
                                        }>
                                        <FastImage
                                            source={images.opensea}
                                            style={styles.contentIcon}
                                        />
                                    </View>

                                    <View
                                        style={
                                            styles.contentContainerInnerCenter
                                        }>
                                        <Text style={styles.contentTextPrimary}>
                                            OpenSea.io
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.contentContainerInnerRight
                                        }>
                                        <TouchableOpacity
                                            style={
                                                styles.contentButtonContainer
                                            }
                                            onPress={visitOpensea}>
                                            <Text
                                                style={
                                                    styles.contentButtonText
                                                }>
                                                Visit now
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.contentContainer}>
                                    <View
                                        style={
                                            styles.contentContainerInnerLeft
                                        }>
                                        <FastImage
                                            source={images.portfolioPolygonScan}
                                            style={styles.contentIcon}
                                        />
                                    </View>

                                    <View
                                        style={
                                            styles.contentContainerInnerCenter
                                        }>
                                        <Text style={styles.contentTextPrimary}>
                                            Polygonscan
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.contentContainerInnerRight
                                        }>
                                        <TouchableOpacity
                                            style={
                                                styles.contentButtonContainer
                                            }
                                            onPress={visitPolygonscan}>
                                            <Text
                                                style={
                                                    styles.contentButtonText
                                                }>
                                                Visit now
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </Section>
            )}

            <DepositModal
                entityID={entityID}
                entityType={isCommunity ? 'community' : 'project'}
                toggleShowDepositModal={toggleShowDepositModal}
                showDepositModal={showDepositModal}
            />
            {/* <ProposeWithdrawalModal
                toggleShowProposeWithdrawalModal={
                    toggleShowProposeWithdrawalModal
                }
                showProposeWithdrawalModal={showProposeWithdrawalModal}
            /> */}
        </View>
    );
};

export default observer(CommunityProjectWallet);
