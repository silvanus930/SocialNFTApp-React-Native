import React, {useCallback, useState, useRef, useContext, useMemo} from 'react';
import fonts from 'resources/fonts';
import BottomModal from 'components/DroidBottomModal';
import BottomSheet from './BottomSheet';
import {
    TextInput,
    Platform,
    View,
    Appearance,
    Alert,
    ActivityIndicator,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {format} from 'date-fns';
import RNPickerSelect from 'react-native-picker-select';
import baseText, {BaseText} from 'resources/text';
import {TouchableOpacity} from 'react-native-gesture-handler';
import colors from 'resources/colors';
import {getServerTimestamp} from 'actions/constants';
import firestore from '@react-native-firebase/firestore';
import {vanillaPost, ProposalAuthorizedVotersTypes} from 'state/PostState';
import auth from '@react-native-firebase/auth';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import useDebounce from 'hooks/useDebounce';

const currencies = {
    eth: 'ETH',
    usd: 'USD',
    usdc: 'USDC',
    cc: 'CC',
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

// todo: appears deprecated. -ken
export default function ProposeWithdrawalModal({
    entityID,
    entityType,
    showProposeWithdrawalModal,
    toggleShowProposeWithdrawalModal,
}) {
    return (
        <BottomSheet
            // windowScale={0.55}
            snapPoints={['55%']}
            showToggle={showProposeWithdrawalModal}
            toggleModalVisibility={toggleShowProposeWithdrawalModal}>
            <ProposeWithdrawalModalContent
                entityID={entityID}
                entityType={entityType}
                toggleShowProposeWithdrawalModal={
                    toggleShowProposeWithdrawalModal
                }
            />
        </BottomSheet>
    );
}

function ProposeWithdrawalModalContent({
    entityID,
    entityType,
    toggleShowProposeWithdrawalModal,
}) {
    const {
        current: {communityMap, currentCommunity},
    } = useContext(CommunityStateRefContext);
    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);

    // Why are we creating three identical dates here? I don't know.
    // I'm cargo cult copying my own shit from somewhere else
    // and figuring out what is happening is not important right now
    const myUserID = auth().currentUser.uid;
    const weekFromNow = new Date();
    const now = new Date();
    const defaultProposalEndTime = new Date(weekFromNow);
    defaultProposalEndTime.setDate(defaultProposalEndTime.getDate() + 7);
    const entityCollectionName =
        entityType === 'community' ? 'communities' : 'personas';

    const [proposalTitle, setProposalTitle] = useState('');
    const [proposalDescription, setProposalDescription] = useState('');
    const [transferAmount, setTransferAmount] = useState(0);
    const [endTime, setEndTime] = useState(defaultProposalEndTime);
    const [currency, setCurrency] = useState(currencies.eth);
    const [target, setTarget] = useState(null);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    let votingDelay = 2 * 60 * 1000;
    let votingPeriod = 24 * 60 * 60 * 1000;
    let quorum = 3;

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
        const cpl = community?.projects
            .filter(projectID => {
                const project = personaMap[projectID];
                return (
                    !project?.deleted &&
                    (!project?.private ||
                        (project?.private &&
                            project?.authors?.includes(auth().currentUser.uid)))
                );
            })
            .map(projectID => {
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

    const handleCreateProposal = useDebounce(
        async () => {
            setIsSubmitting(true);
            let cur = currency.toLowerCase();
            if (!isNumeric(transferAmount) || transferAmount <= 0) {
                console.log('transforAmound', transferAmount);
                Alert.alert('Please enter a valid deposit amount');
                setIsSubmitting(false);
                return;
            }
            if (!target) {
                Alert.alert('Please select a destination account');
                setIsSubmitting(false);
                return;
            }

            const proposalPost = Object.assign({}, vanillaPost);
            proposalPost.title = proposalTitle;
            proposalPost.text = proposalDescription;
            proposalPost.userID = myUserID;
            proposalPost.createDate = getServerTimestamp();
            proposalPost.editDate = getServerTimestamp();
            proposalPost.publishDate = getServerTimestamp();
            proposalPost.published = true;
            proposalPost.type = 'proposal';
            delete proposalPost.subPersona;

            const entityRef = firestore()
                .collection(entityCollectionName)
                .doc(entityID);
            const postRef = firestore()
                .collection(entityCollectionName)
                .doc(entityID)
                .collection('posts')
                .doc();

            let dataRef = await entityRef.get();
            console.log('dataRef', dataRef.exists, dataRef.data());
            let oldTargetWalletBalance = (dataRef.exists &&
                dataRef.data()?.walletBalance) || {
                usdc: 0,
                eth: 0,
                cc: 0,
                nft: 0,
            };

            if (parseFloat(transferAmount) > oldTargetWalletBalance[cur]) {
                Alert.alert(
                    `Not enough funds! Only ${
                        oldTargetWalletBalance[cur]
                    }${cur.toUpperCase()} available.`,
                );
                setIsSubmitting(false);
                return;
            }

            const proposalRef = firestore().collection('proposals').doc();
            const [targetType, targetID] = target.split('-');
            const proposal = {
                postRef,
                deleted: false,
                sourceRef: entityRef,
                actions: [
                    {
                        type: 'transfer',
                        currency: currency,
                        targetRef: getDocumentRef({
                            docType: targetType,
                            id: targetID,
                        }),
                        amount: parseFloat(transferAmount),
                    },
                ],
                quorum,
                createdAt: getServerTimestamp(),
                snapshotTime: getServerTimestamp(),
                startTime: firestore.Timestamp.fromMillis(
                    Date.now() + votingDelay,
                ),
                endTime: firestore.Timestamp.fromDate(endTime),
                createdBy: myUserID,
                votes: {},
            };

            proposalPost.proposalRef = proposalRef;
            proposalPost.proposal = proposal;
            proposalPost.type = 'proposal';

            setPending(true);
            try {
                const batch = firestore().batch();
                batch.set(postRef, proposalPost);
                batch.set(proposalRef, proposal);
                await batch.commit();
                Alert.alert('Proposal successfully created');
            } catch (err) {
                Alert.alert(
                    'Something went wrong creating your withdrawal proposal. Please try again.',
                );
                setPending(false);
                setIsSubmitting(false);
                return;
            }
            setPending(false);
            setIsSubmitting(false);
            toggleShowProposeWithdrawalModal();
        },
        [
            proposalTitle,
            proposalDescription,
            myUserID,
            entityCollectionName,
            transferAmount,
            target,
        ],
        1000,
    );

    return (
        <>
            <View
                style={{
                    padding: 20,
                    backgroundColor: colors.paleBackground,
                    marginStart: 40,
                    marginEnd: 40,
                    borderRadius: 8,
                    marginBottom: 5,
                }}>
                <BaseText
                    style={{
                        color: colors.textFaded2,
                        fontFamily: fonts.bold,
                        marginBottom: 10,
                    }}>
                    Propose Withdrawal
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
                        marginBottom: 10,
                    }}
                    editable={true}
                    autoCapitalize="none"
                    multiline={false}
                    maxLength={2200}
                    value={proposalTitle}
                    placeholder="Enter proposal title"
                    placeholderTextColor={'grey'}
                    onChangeText={setProposalTitle}
                    keyboardAppearance={'dark'}
                />
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
                        marginBottom: 10,
                    }}
                    editable={true}
                    autoCapitalize="none"
                    multiline={false}
                    maxLength={2200}
                    value={proposalDescription}
                    placeholder="Enter proposal description"
                    placeholderTextColor={'grey'}
                    onChangeText={setProposalDescription}
                    keyboardAppearance={'dark'}
                />
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
                    placeholder="Enter transfer amount"
                    placeholderTextColor={'grey'}
                    onChangeText={setTransferAmount}
                    keyboardAppearance={'dark'}
                />
                <View
                    style={{
                        backgroundColor: colors.lighterHighlight,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 20,
                    }}>
                    <RNPickerSelect
                        onValueChange={setTarget}
                        placeholder={{}}
                        style={{fontFamily: fonts.mono}}
                        touchableWrapperProps={{activeOpacity: 0.2}}
                        useNativeAndroidPickerStyle={false}
                        items={communityProjectsList}>
                        <TouchableOpacity
                            style={{
                                borderColor: 'red',
                                borderWidth: 0,
                                padding: 5,
                                paddingLeft: 80,
                                paddingRight: 80,
                            }}>
                            <BaseText>
                                {getEntityName(target) ?? 'send to...'}
                            </BaseText>
                        </TouchableOpacity>
                    </RNPickerSelect>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        marginTop: 20,
                        alignItems: 'center',
                        marginBottom: 0,
                    }}>
                    <BaseText
                        style={{color: colors.maxFaded, fontSize: 12, top: 1}}>
                        Voting end time
                    </BaseText>
                    <TouchableOpacity
                        style={{
                            alignItems: 'center',
                            backgroundColor: colors.lighterHighlight,
                            borderRadius: 8,
                            paddingLeft: 10,
                            paddingRight: 10,
                            marginStart: 10,
                        }}
                        onPress={() => setDatePickerOpen(!datePickerOpen)}>
                        <View>
                            <BaseText
                                style={{
                                    fontSize: 12,
                                    marginStart: 0,
                                    color: colors.actionText,
                                    fontFamily: fonts.mono,
                                }}>
                                {format(endTime, 'PPp')}
                            </BaseText>
                        </View>
                        <DatePicker
                            modal
                            minimumDate={now}
                            open={datePickerOpen}
                            date={endTime}
                            onConfirm={date => {
                                setDatePickerOpen(false);
                                setEndTime(date);
                            }}
                            onCancel={() => {
                                setDatePickerOpen(false);
                            }}
                            textColor={
                                Platform.OS === 'android' ||
                                Appearance.getColorScheme() === 'dark'
                                    ? baseText.color
                                    : undefined
                            }
                        />
                    </TouchableOpacity>
                </View>
                <View
                    style={{
                        backgroundColor: colors.lighterHighlight,
                        borderRadius: 8,
                        flexDirection: 'row',
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
                                {
                                    label: currencies[c],
                                    value: currencies[c],
                                    color: 'black',
                                },
                            ),
                        )}>
                        <TouchableOpacity
                            style={{
                                borderColor: 'red',
                                borderWidth: 0,
                                padding: 12,
                                paddingLeft: 110,
                                paddingRight: 110,
                            }}>
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
                onPress={!isSubmitting ? handleCreateProposal : () => {}}>
                {!isSubmitting ? (
                    <BaseText
                        style={{
                            color: colors.actionText,
                            fontSize: 18,
                            fontFamily: fonts.bold,
                        }}>
                        submit
                    </BaseText>
                ) : (
                    <ActivityIndicator color={colors.actionText} />
                )}
            </TouchableOpacity>
        </>
    );
}
