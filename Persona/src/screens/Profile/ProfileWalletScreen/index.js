import React, {useEffect, useState, useCallback} from 'react';
import {
    View,
    Text,
    ScrollView,
    ImageBackground,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {getWalletActivityForUser} from 'actions/transfers';

import DepositModal from 'components/DepositModal';
import WalletBalance from 'components/WalletBalance';
import TransactionButtonsBar from 'components/TransactionButtonsBar';
import BlurHeader from 'components/BlurHeader';
import {getDisplayNameForRef} from 'actions/refs';

import ProfileWalletActivityItem from './components/ProfileWalletActivityItem';

import {images} from 'resources';
import {HEADER_HEIGHT} from 'components/BlurHeader/styles';

import styles from './styles';

const ProfileWalletScreen = ({route, navigation}) => {
    const user = auth().currentUser;
    const userID = user.uid;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState(null);
    const [showDepositModal, setShowDepositModal] = useState(false); // TODO; use a single modal higher up in the nav stack

    const onPressSettings = useCallback(() => {
        alert('Coming soon!');
    }, []);

    const onPressViewAssetDetails = useCallback(() => {
        alert('Coming soon!');
    }, []);

    const onPressDeposit = useCallback(() => {
        setShowDepositModal(!showDepositModal);
    }, [showDepositModal]);

    const onPressWithdraw = useCallback(() => {
        alert('Coming soon!');
    }, []);

    const onPressBuy = useCallback(() => {
        alert('Coming soon!');
    }, []);

    const onPressSwap = useCallback(() => {
        alert('Coming soon!');
    }, []);

    const onRefresh = useCallback(() => {
        setIsLoading(true);
        loadTransactions();
    }, []);

    const loadTransactions = useCallback(async () => {
        const userRef = await firestore().collection('users').doc(userID);

        setError(null);

        try {
            getWalletActivityForUser(userRef).onSnapshot(async snapshot => {
                if (snapshot?.docs?.length > 0) {
                    const docs = await Promise.all(
                        snapshot?.docs?.map(async doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                sourceName: await getDisplayNameForRef(
                                    data.sourceRef,
                                ),
                                targetName: await getDisplayNameForRef(
                                    data.targetRef,
                                ),
                                ...data,
                            };
                        }),
                    ).catch(e => {
                        setError(
                            'Could not load recent activity, please try again',
                        );
                        console.log(
                            '[ProfileWalletScreen#loadTransactions] exception:1',
                            e,
                        );
                    });
                    setIsLoading(false);
                    setTransactions(docs);
                }
            });
        } catch (e) {
            setError('Could not load recent activity, please try again');
            console.log(
                '[ProfileWalletScreen#loadTransactions] exception:2',
                e,
            );
        }
    }, [userID]);

    useEffect(() => {
        loadTransactions();
    }, [route, navigation]);

    const renderItem = useCallback(
        ({item, index}) => {
            return (
                <ProfileWalletActivityItem
                    userId={userID}
                    item={item}
                    isLastItem={
                        transactions && index === transactions.length - 1
                    }
                />
            );
        },
        [transactions],
    );

    const headerComponent = (
        <View style={styles.headerContainer}>
            <View style={styles.walletCardContainer}>
                <View style={styles.walletCardUpper}>
                    <ImageBackground
                        source={images.walletCardBackground}
                        resizeMode={'cover'}
                        style={{
                            flex: 1,
                            padding: 20,
                        }}
                        imageStyle={{
                            resizeMode: 'cover',
                            width: 232,
                            height: 116,
                            left: 125,
                        }}>
                        <View>
                            <Text style={styles.walletCardHeaderText}>
                                Total wallet balance
                            </Text>
                            <Text style={styles.walletCardBalanceText}>
                                <WalletBalance userId={userID} />
                            </Text>

                            <TouchableOpacity
                                style={styles.walletCardButton}
                                onPress={onPressSettings}>
                                <Text style={styles.walletCardButtonText}>
                                    Settings
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ImageBackground>
                </View>

                <View style={styles.walletCardLower}>
                    <TouchableOpacity onPress={onPressViewAssetDetails}>
                        <Text style={styles.walletCardViewAssetDetailsText}>
                            View asset details >
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.transactionBarContainer}>
                <TransactionButtonsBar
                    onPressDeposit={onPressDeposit}
                    onPressWithdraw={onPressWithdraw}
                    onPressBuy={onPressBuy}
                    onPressSwap={onPressSwap}
                />
            </View>

            <View style={styles.listTopContainer}>
                <Text style={styles.listTopText}>Recent activity</Text>
            </View>
        </View>
    );

    const footerComponent = <View style={styles.listBottomContainer} />;

    const emptyComponent = () => {
        return (
            <View style={styles.listEmptyContainer}>
                {error && <Text style={styles.listEmptyText}>{error}</Text>}
                {!error && (
                    <Text style={styles.listEmptyText}>
                        {!transactions ? 'Loading...' : 'No recent activity'}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <FlashList
                    initialNumToRender={10}
                    estimatedItemSize={100}
                    removeClippedSubviews={false}
                    bounces={true}
                    data={transactions}
                    ListEmptyComponent={emptyComponent}
                    ListHeaderComponent={headerComponent}
                    ListFooterComponent={footerComponent}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    refreshing={isLoading}
                    onRefresh={onRefresh}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={onRefresh}
                            colors={['white']}
                            tintColor={'white'}
                            progressViewOffset={HEADER_HEIGHT}
                        />
                    }
                />
            </View>
            <DepositModal
                entityID={userID}
                entityType={'user'}
                toggleShowDepositModal={onPressDeposit}
                showDepositModal={showDepositModal}
            />
            <BlurHeader title="My persona wallet" />
        </View>
    );
};

export default ProfileWalletScreen;
