import React, {useCallback, useState, useRef, useContext, useMemo} from 'react';
import fonts from 'resources/fonts';
import BottomSheet from './BottomSheet';
import {Text, TextInput, Platform, View, Appearance, Alert} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {format} from 'date-fns';
import RNPickerSelect from 'react-native-picker-select';
import baseText, {BaseText} from 'resources/text';
import {TouchableOpacity} from 'react-native-gesture-handler';
import colors from 'resources/colors';
import firestore from '@react-native-firebase/firestore';
import {getServerTimestamp} from 'actions/constants';
import {vanillaPost} from 'state/PostState';
import auth from '@react-native-firebase/auth';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

const currencies = {
    eth: 'ETH',
    usdc: 'USDC',
    CC: 'CC',
};

function isNumeric(str) {
    if (typeof str !== 'string') {
        return false;
    } // we only process strings!
    return (
        !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))
    ); // ...and ensure strings of whitespace fail
}

export default function TransferModal({
    entityID,
    entityType,
    showTransferModal,
    toggleShowTransferModal,
}) {
    const {
        current: {communityMap, currentCommunity},
    } = useContext(CommunityStateRefContext);
    const {
        current: {personaMap, user: myUser},
    } = useContext(GlobalStateRefContext);
    const namespacedEntityID =
        entityType === 'community'
            ? `community-${entityID}`
            : `project-${entityID}`;

    const myUserID = auth().currentUser.uid;
    const entityCollectionName =
        entityType === 'community' ? 'communities' : 'personas';

    const [transferAmount, setTransferAmount] = useState(0);
    const [currency, setCurrency] = useState(currencies.eth);
    const [target, setTarget] = useState(namespacedEntityID);
    const [pending, setPending] = useState(false);

    const getDocumentRef = ({docType, id}) => {
        if (docType === 'project') {
            return firestore().collection('personas').doc(id);
        } else if (docType === 'community') {
            return firestore().collection('communities').doc(id);
        } else {
            throw new Error('Unrecognized document type for withdrawal');
        }
    };

    const getEntityName = namespacedID => {
        if (!namespacedID) {
            return null;
        }
        const [eType, eid] = namespacedID.split('-');
        if (eType === 'project') {
            return personaMap[eid]?.name;
        } else {
            return communityMap[eid]?.name;
        }
    };

    const communityProjectsList = useMemo(() => {
        const community = communityMap[currentCommunity];
        const cpl = community?.projects.map(projectID => {
            const project = personaMap[projectID];
            return {
                label: project?.name,
                value: `project-${projectID}`,
                ...(Platform.OS === 'android' && {
                    color: 'black',
                }),
            };
        });
        return [
            {
                label: community?.name,
                value: `community-${currentCommunity}`,
                ...(Platform.OS === 'android' && {
                    color: 'black',
                }),
            },
        ].concat(cpl);
    }, [communityMap, currentCommunity, personaMap]);

    const {
        current: {user, personaList, userMap},
    } = useContext(GlobalStateRefContext);

    let walletBalance = user?.walletBalance || {usdc: 0, eth: 0, cc: 30};
    console.log('rendering TransferModal walletBalance->', walletBalance);

    const handleCreateTransfer = async () => {
        console.log(
            'called handleCreateTransfer transferAmount->',
            transferAmount,
        );

        if (!isNumeric(transferAmount) || transferAmount <= 0) {
            Alert.alert('Please enter a valid deposit amount');
            return;
        }

        let cur = currency.toLowerCase();
        console.log('cur->', cur);
        let balance = walletBalance[cur];

        console.log('aight doing a deposit cur->', cur, 'balance->', balance);
        if (parseFloat(transferAmount) > balance) {
            Alert.alert(
                `Attempt to transfer an amount=${parseFloat(
                    transferAmount,
                )} more than available balance=${balance} in currency=${currency}`,
            );
            return;
        }

        const depositPost = Object.assign({}, vanillaPost);
        depositPost.title = `${myUser.userName} deposited ${transferAmount} ${currency}`;
        depositPost.userID = myUserID;
        depositPost.createDate = getServerTimestamp();
        depositPost.editDate = getServerTimestamp();
        depositPost.publishDate = getServerTimestamp();
        depositPost.published = true;
        depositPost.type = 'transfer';
        delete depositPost.subPersona;

        const entityRef = firestore()
            .collection(entityCollectionName)
            .doc(entityID);
        const postRef = firestore()
            .collection(entityCollectionName)
            .doc(entityID)
            .collection('posts')
            .doc();
        const userRef = firestore().collection('users').doc(myUserID);
        const transferRef = firestore().collection('transfers').doc();

        let newWalletBalance = Object.assign({}, walletBalance);
        newWalletBalance[cur] =
            parseFloat(walletBalance[cur]) - parseFloat(transferAmount);
        console.log(
            '>>>>>>>>>>>>>>>>>>>     for the record newWalletBalance->',
            newWalletBalance,
        );
        console.log(
            '>>>>>>>>>>>>>>>>>>>     for the record oldWalletBalance->',
            walletBalance,
        );

        let dataRef = await entityRef.get();
        console.log('dataRef', dataRef.exists, dataRef.data());
        let oldTargetWalletBalance = (dataRef.exists &&
            dataRef.data()?.walletBalance) || {usdc: 0, eth: 0, cc: 0};
        let newTargetWalletBalance = Object.assign({}, oldTargetWalletBalance);
        newTargetWalletBalance[cur] =
            parseFloat(oldTargetWalletBalance[cur]) +
            parseFloat(transferAmount);

        const [targetType, targetID] = target.split('-');
        const transfer = {
            postRef,
            sourceRef: userRef,
            targetRef: entityRef,
            amount: parseFloat(transferAmount),
            currency,
            createdAt: getServerTimestamp(),
            snapshotTime: getServerTimestamp(),
            refs: [userRef, entityRef],
        };
        depositPost.transfer = transfer;

        setPending(true);
        try {
            const batch = firestore().batch();
            batch.set(postRef, depositPost);
            batch.set(transferRef, transfer);
            await batch.set(
                userRef,
                {walletBalance: newWalletBalance},
                {merge: true},
            );
            await batch.set(
                entityRef,
                {walletBalance: newTargetWalletBalance},
                {merge: true},
            );
            await batch.commit();
            Alert.alert('Transfer successful');
        } catch (err) {
            Alert.alert(
                'Something went wrong completing your deposit. Please try again.',
            );
            setPending(false);
            return;
        }
        setPending(false);
        toggleShowTransferModal();
    };

    return (
        <BottomSheet
            // windowScale={0.4}
            snapPoints={['40%']}
            showToggle={showTransferModal}
            toggleModalVisibility={toggleShowTransferModal}>
            <View
                style={{
                    padding: 20,
                    backgroundColor: colors.paleBackground,
                    marginStart: 40,
                    marginEnd: 40,
                    borderRadius: 8,
                    marginBottom: 20,
                }}>
                <BaseText
                    style={{
                        color: colors.textFaded2,
                        fontFamily: fonts.bold,
                        marginBottom: 10,
                    }}>
                    Transfer funds to {getEntityName(namespacedEntityID)}
                </BaseText>
                <TextInput
                    style={{
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        color: colors.textBright,
                        borderRadius: 8,
                        backgroundColor: colors.lighterHighlight,
                        padding: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 0,
                    }}
                    keyboardType={'numeric'}
                    editable={true}
                    autoCapitalize="none"
                    multiline={false}
                    maxLength={2200}
                    value={transferAmount}
                    placeholder="Enter amount"
                    placeholderTextColor={'grey'}
                    onChangeText={setTransferAmount}
                    keyboardAppearance={'dark'}
                />
                {/* <View
                    style={{
                        backgroundColor: colors.lighterHighlight,
                        borderRadius: 8,
                        flexDirection: 'row',
                        padding: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 20,
                    }}>
                    <RNPickerSelect
                        disabled
                        onValueChange={setTarget}
                        value={
                            entityType === 'community'
                                ? `community-${entityID}`
                                : `project-${entityID}`
                        }
                        placeholder={{}}
                        style={{fontFamily: fonts.mono}}
                        touchableWrapperProps={{activeOpacity: 0.2}}
                        useNativeAndroidPickerStyle={false}
                        items={communityProjectsList}>
                        <TouchableOpacity>
                            <BaseText>{getEntityName(target)}</BaseText>
                        </TouchableOpacity>
                    </RNPickerSelect>
                </View> */}
                <View
                    style={{
                        backgroundColor: colors.lighterHighlight,
                        borderRadius: 8,
                        flexDirection: 'row',
                        padding: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 20,
                    }}>
                    <RNPickerSelect
                        onValueChange={setCurrency}
                        placeholder={{}}
                        style={{fontFamily: fonts.mono}}
                        touchableWrapperProps={{activeOpacity: 0.2}}
                        useNativeAndroidPickerStyle={false}
                        items={Object.keys(currencies).map(c =>
                            Object.assign(
                                {},
                                {label: currencies[c], value: currencies[c]},
                            ),
                        )}>
                        <TouchableOpacity>
                            <BaseText>{currency}</BaseText>
                        </TouchableOpacity>
                    </RNPickerSelect>
                </View>
            </View>
            <TouchableOpacity
                style={{
                    borderRadius: 8,
                    backgroundColor: colors.paleBackground,
                    padding: 10,
                    marginStart: 40,
                    marginEnd: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onPress={handleCreateTransfer}>
                <BaseText
                    style={{
                        color: colors.actionText,
                        fontSize: 18,
                        fontFamily: fonts.bold,
                    }}>
                    submit
                </BaseText>
            </TouchableOpacity>
        </BottomSheet>
    );
}
