import React, {
    useContext,
    useEffect,
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    View,
} from 'react-native';
import {ScrollView, TouchableOpacity} from 'react-native-gesture-handler';
import RNPickerSelect from 'react-native-picker-select';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/Feather';

import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import styles, {SubtitleText, SubView} from './styles';
import {
    proposalDurations,
    currencyList,
    currencyMap,
    getEndTimeFromDuration,
    getPriceStr,
    targetTypes,
} from './constants';
import colors from 'resources/colors';
import {fonts} from 'resources';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {vanillaPost} from 'state/PostState';
import useDebounce from 'hooks/useDebounce';
import {isNumeric} from 'utils/helpers';
import {getServerTimestamp} from 'actions/constants';

const stringify = require('json-stringify-safe');

function Header({navigation}) {
    const closeScreen = () => {
        navigation.goBack();
    };

    return (
        <View
            style={{
                borderBottomColor: colors.timestamp,
                flexDirection: 'row',
                height: 50,
            }}>
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                <TouchableOpacity onPress={closeScreen}>
                    <Icon
                        name={'arrow-left'}
                        color={colors.postAction}
                        size={28}
                    />
                </TouchableOpacity>
            </View>
            <View
                style={{
                    flex: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: 'red',
                    borderWidth: 0,
                }}>
                <Text
                    style={{
                        fontFamily: fonts.light,
                        fontWeight: 500,
                        fontSize: 18,
                        color: '#D0D3D6',
                    }}>
                    Propose Withdrawal
                </Text>
            </View>
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: 'red',
                    borderWidth: 0,
                    paddingRight: 10,
                }}>
                <TouchableOpacity onPress={closeScreen}>
                    <Icon name={'x'} color={colors.postAction} size={28} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const initCurrenciesSumMap = () => {
    const map = {};
    for (let curr of currencyList) {
        map[curr.toLowerCase()] = 0.0;
    }
    return map;
};

const ProposeWithdrawalScreen = ({parentNavigation, entityID, entityType}) => {
    const [proposalTitle, setProposalTitle] = useState('');
    const [proposalDescription, setProposalDescription] = useState('');
    const [proposalDuration, setProposalDuration] = useState(
        proposalDurations[0],
    );
    const [sourceChannel, setSourceChannel] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [targets, setTargets] = useState([]);
    const [withdrawalSumMap, setWithdrawalSumMap] = useState({});

    const fetchData = useCallback(async () => {
        const [srcEntityType, srcEntityID] = sourceChannel.split('-');
        const entityCollectionName =
            srcEntityType === 'project' ? 'personas' : 'communities';
        const entityRef = firestore()
            .collection(entityCollectionName)
            .doc(srcEntityID);
        const dataRef = await entityRef.get();

        console.log('dataRef', dataRef.exists, dataRef.data());
        let oldTargetWalletBalance =
            (dataRef.exists && dataRef.data()?.walletBalance) ||
            initCurrenciesSumMap();

        setWithdrawalSumMap(oldTargetWalletBalance);
    }, [sourceChannel]);

    useEffect(() => {
        fetchData();
    }, [sourceChannel]);

    const {
        current: {communityMap, currentCommunity},
    } = useContext(CommunityStateRefContext);
    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);
    const {
        current: {userMap},
    } = useContext(GlobalStateRefContext);

    const myUserID = auth().currentUser.uid;

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
    const getUserName = userID => {
        if (!userID) {
            return null;
        }
        return userMap[userID]?.userName;
    };

    const getDocumentRef = ({docType, id}) => {
        if (docType === 'project') {
            return firestore().collection('personas').doc(id);
        } else if (docType === 'community') {
            return firestore().collection('communities').doc(id);
        } else {
            throw new Error('Unrecognized document type for withdrawal');
        }
    };

    useEffect(() => {
        const project =
            entityType === 'community'
                ? communityMap[entityID]
                : personaMap[entityID];
        const value =
            entityType === 'community'
                ? `community-${entityID}`
                : `project-${entityID}`;
        setSourceChannel(value);
    }, []);

    const currentProject = useMemo(() => {
        const project =
            entityType === 'community'
                ? communityMap[entityID]
                : personaMap[entityID];
        const value =
            entityType === 'community'
                ? `community-${entityID}`
                : `project-${entityID}`;
        return [
            {
                label: project?.name,
                value,
                ...(Platform.OS === 'android' && {
                    color: 'black',
                }),
            },
        ];
    }, [communityMap, currentCommunity, personaMap]);
    const communityMembersList = useMemo(() => {
        const community = communityMap[currentCommunity];
        return community?.members.map(userID => {
            return {
                label: userMap[userID]?.userName ?? userID,
                value: userID,
                ...(Platform.OS === 'android' && {
                    color: 'black',
                }),
            };
        });
    }, [communityMap, currentCommunity, userMap]);

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
            const votingDelay = 2 * 60 * 1000;
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

            // sourceChannel: {project|community}-{projectID|communityName}
            // sourceChannelName: personaMap[srcEntityID]
            const [srcEntityType, srcEntityID] = sourceChannel.split('-');
            const entityCollectionName =
                srcEntityType === 'project' ? 'personas' : 'communities';
            const entityRef = firestore()
                .collection(entityCollectionName)
                .doc(srcEntityID);
            const postRef = firestore()
                .collection(entityCollectionName)
                .doc(srcEntityID)
                .collection('posts')
                .doc();

            const entity =
                srcEntityType === 'project'
                    ? personaMap[srcEntityID]
                    : communityMap[srcEntityID];
            const quorum = parseInt(
                Math.max(
                    1,
                    parseInt(
                        (entity?.authors?.length || entity?.members?.length) ??
                            0,
                    ) / 4,
                ),
            );

            let dataRef = await entityRef.get();
            console.log('dataRef', dataRef.exists, dataRef.data());
            let oldTargetWalletBalance = (dataRef.exists &&
                dataRef.data()?.walletBalance) || {
                usdc: 0,
                eth: 0,
                cc: 0,
                nft: 0,
            };

            const proposalRef = firestore().collection('proposals').doc();
            const endTimeDate = getEndTimeFromDuration(proposalDuration);

            let actions = [];
            const sumsMap = initCurrenciesSumMap();
            for (let target of targets) {
                const cur = target.currency.toLowerCase();
                const isChannel = target.type === targetTypes.CHANNEL;
                sumsMap[cur] =
                    parseFloat(sumsMap[cur]) +
                    parseFloat(target.withdrawalAmount);

                if (!target.name) {
                    Alert.alert('Please select a destination account');
                    setIsSubmitting(false);
                    return;
                }
                if (
                    !isNumeric(target.withdrawalAmount) ||
                    target.withdrawalAmount <= 0
                ) {
                    console.log('transferAmount', target.withdrawalAmount);
                    Alert.alert('Please enter a valid deposit amount');
                    setIsSubmitting(false);
                    return;
                }
                if (sumsMap[cur] > oldTargetWalletBalance[cur]) {
                    Alert.alert(
                        `Not enough funds! Only ${
                            oldTargetWalletBalance[cur]
                        }${cur.toUpperCase()} available.`,
                    );
                    setIsSubmitting(false);
                    return;
                }
                let targetRef;
                if (isChannel) {
                    const [targetType, targetID] = target.name.split('-');
                    targetRef = getDocumentRef({
                        docType: targetType,
                        id: targetID,
                    });
                } else {
                    targetRef = firestore()
                        .collection('users')
                        .doc(target.name);
                }

                actions.push({
                    type: 'transfer',
                    currency: target.currency,
                    targetRef,
                    amount: parseFloat(target.withdrawalAmount),
                });
            }

            const proposal = {
                postRef,
                deleted: false,
                sourceRef: entityRef,
                actions, // multiple transfer targets in actions list
                quorum,
                createdAt: getServerTimestamp(),
                snapshotTime: getServerTimestamp(),
                startTime: firestore.Timestamp.fromMillis(
                    Date.now() + votingDelay,
                ),
                endTime: firestore.Timestamp.fromDate(endTimeDate),
                createdBy: myUserID,
                votes: {},
            };

            proposalPost.proposalRef = proposalRef;
            proposalPost.proposal = proposal;
            proposalPost.type = 'proposal';

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
                setIsSubmitting(false);
                return;
            }
            setIsSubmitting(false);

            parentNavigation.goBack();
        },
        [proposalTitle, proposalDescription, myUserID, targets],
        1000,
    );

    /**
     * Add additional states on press
     */
    const addTarget = type => {
        const target = {
            name: '',
            type,
            withdrawalAmount: 0,
            currency: currencyMap.eth,
        };
        setTargets([...targets, target]);
    };
    const addUser = () => {
        addTarget(targetTypes.USER);
    };
    const addChannel = () => {
        addTarget(targetTypes.CHANNEL);
    };
    const withdrawView = index => {
        const setTargetName = name => {
            if (index > targets.length - 1) {
                console.error(`Targets list index out of bounds`);
                return;
            }
            setTargets([
                ...targets.slice(0, index),
                {
                    ...targets[index],
                    name,
                },
                ...targets.slice(index + 1),
            ]);
        };
        const setWithdrawAmount = amount => {
            if (index > targets.length - 1) {
                console.error(`Targets list index out of bounds`);
                return;
            }
            const target = targets[index];
            setTargets([
                ...targets.slice(0, index),
                {
                    ...target,
                    withdrawalAmount: amount,
                },
                ...targets.slice(index + 1),
            ]);
        };
        const setCurrency = curr => {
            if (index > targets.length - 1) {
                console.error(`Targets list index out of bounds`);
                return;
            }
            setTargets([
                ...targets.slice(0, index),
                {
                    ...targets[index],
                    currency: curr,
                },
                ...targets.slice(index + 1),
            ]);
        };
        const removeView = () => {
            setTargets([
                ...targets.slice(0, index),
                ...targets.slice(index + 1),
            ]);
        };

        const currentCurr = targets[index].currency.toLowerCase();
        const currentType = targets[index].type;
        const currentName = targets[index].name;
        const isChannel = currentType === targetTypes.CHANNEL;
        const price = getPriceStr(withdrawalSumMap[currentCurr], currentCurr);

        return (
            <View
                key={index}
                style={{
                    borderWidth: 3,
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 10,
                    borderColor: '#111314',
                }}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                    }}>
                    <SubtitleText>Withdrawal destination</SubtitleText>
                    <Icon
                        color={'#868B8F'}
                        name={'minus-circle'}
                        size={22}
                        onPress={removeView}
                        title={'Remove'}
                        style={{
                            position: 'absolute',
                            right: 0,
                        }}
                    />
                </View>
                <RNPickerSelect
                    onValueChange={setTargetName}
                    placeholder={{}}
                    touchableWrapperProps={{activeOpacity: 0.2}}
                    items={
                        isChannel ? communityProjectsList : communityMembersList
                    }>
                    <View
                        style={{
                            ...styles.dropdownMenu,
                            alignItems: 'center',
                            display: 'flex',
                            flexDirection: 'row',
                            marginBottom: 13,
                        }}>
                        <Text style={styles.dropdownText}>
                            {isChannel
                                ? getEntityName(currentName)
                                : getUserName(currentName)}
                        </Text>
                        <Feather
                            name="chevron-down"
                            size={22}
                            color={'#868B8F'}
                            style={{
                                position: 'absolute',
                                right: 10,
                            }}
                        />
                    </View>
                </RNPickerSelect>

                <View>
                    <SubtitleText>Withdrawal value</SubtitleText>
                    <View
                        style={{
                            flexDirection: 'row',
                        }}>
                        <TextInput
                            style={{
                                ...styles.textInput,
                                flex: 1,
                                marginRight: 10,
                            }}
                            editable={true}
                            autoCapitalize="none"
                            multiline={false}
                            maxLength={500}
                            value={targets[index].withdrawalAmount}
                            placeholder="Enter a valid amount"
                            placeholderTextColor={'grey'}
                            onChangeText={setWithdrawAmount}
                            keyboardAppearance={'dark'}
                        />
                        <RNPickerSelect
                            onValueChange={setCurrency}
                            placeholder={{}}
                            touchableWrapperProps={{activeOpacity: 0.2}}
                            items={currencyList.map(c => {
                                return {
                                    label: `${c}`,
                                    value: `${c}`,
                                    color: '#000',
                                };
                            })}>
                            <View
                                style={{
                                    ...styles.dropdownMenu,
                                    alignItems: 'center',
                                    display: 'flex',
                                    flexDirection: 'row',
                                }}>
                                <Text style={styles.dropdownText}>
                                    {targets[index].currency}
                                </Text>
                                <Feather
                                    name="chevron-down"
                                    size={22}
                                    color={'#868B8F'}
                                />
                            </View>
                        </RNPickerSelect>
                    </View>
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        <Feather name="info" size={18} color={'#C1A77F'} />
                        <Text
                            style={{
                                color: '#C1A77F',
                                marginLeft: 5,
                            }}>
                            Available balance: {price}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderTargetChannelViews = targets.map((data, index) => {
        return withdrawView(index);
    });

    return (
        <KeyboardAvoidingView
            style={{
                flex: 1,
            }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
                style={{
                    flex: 1,
                    paddingTop: 60,
                    marginBottom: 30,
                }}>
                <Header navigation={parentNavigation} />
                <ScrollView>
                    <View style={styles.scrollView}>
                        <SubView>
                            <SubtitleText>From:</SubtitleText>
                            <Text style={styles.title}>
                                {getEntityName(sourceChannel)}
                            </Text>

                            {/* <SubtitleText>Select channel</SubtitleText> */}
                            {/* <RNPickerSelect */}
                            {/*     onValueChange={setSourceChannel} */}
                            {/*     placeholder={{}} */}
                            {/*     touchableWrapperProps={{activeOpacity: 0.2}} */}
                            {/*     items={currentProject}> */}
                            {/*     <View */}
                            {/*         style={{ */}
                            {/*             ...styles.dropdownMenu, */}
                            {/*             alignItems: 'center', */}
                            {/*             display: 'flex', */}
                            {/*             flexDirection: 'row', */}
                            {/*         }}> */}
                            {/*         <Text style={styles.dropdownText}> */}
                            {/*             {getEntityName(sourceChannel)} */}
                            {/*         </Text> */}
                            {/*         <Feather */}
                            {/*             name="chevron-down" */}
                            {/*             size={22} */}
                            {/*             color={'#868B8F'} */}
                            {/*             style={{ */}
                            {/*                 position: 'absolute', */}
                            {/*                 right: 10, */}
                            {/*             }} */}
                            {/*         /> */}
                            {/*     </View> */}
                            {/* </RNPickerSelect> */}
                        </SubView>
                        <SubView>
                            <SubtitleText>Proposal title</SubtitleText>
                            <TextInput
                                style={styles.textInput}
                                editable={true}
                                autoCapitalize="none"
                                multiline={false}
                                maxLength={2200}
                                value={proposalTitle}
                                placeholder="Enter a title"
                                placeholderTextColor={'grey'}
                                onChangeText={setProposalTitle}
                                keyboardAppearance={'dark'}
                            />
                        </SubView>
                        <SubView>
                            <SubtitleText>Description</SubtitleText>
                            <TextInput
                                style={styles.descriptionInput}
                                editable={true}
                                autoCapitalize="none"
                                multiline={true}
                                maxLength={2200}
                                value={proposalDescription}
                                placeholder="A few words describing the proposal..."
                                placeholderTextColor={'grey'}
                                onChangeText={setProposalDescription}
                                keyboardAppearance={'dark'}
                            />
                        </SubView>
                        <SubView>
                            <SubtitleText>Proposal duration</SubtitleText>
                            <RNPickerSelect
                                onValueChange={setProposalDuration}
                                placeholder={{}}
                                touchableWrapperProps={{activeOpacity: 0.2}}
                                items={proposalDurations.map(d => {
                                    return {
                                        label: `${d.duration} ${d.metric}`,
                                        value: d,
                                        color: '#000',
                                    };
                                })}>
                                <View
                                    style={{
                                        ...styles.dropdownMenu,
                                        alignItems: 'center',
                                        display: 'flex',
                                        flexDirection: 'row',
                                    }}>
                                    <Text style={styles.dropdownText}>
                                        {`${proposalDuration.duration} ${proposalDuration.metric}`}
                                    </Text>
                                    <Feather
                                        name="chevron-down"
                                        size={22}
                                        color={'#868B8F'}
                                        style={{
                                            position: 'absolute',
                                            right: 10,
                                        }}
                                    />
                                </View>
                            </RNPickerSelect>
                        </SubView>

                        <View style={{width: '100%'}}>
                            {/* pass in some parameter to add either channel or user destination */}
                            {renderTargetChannelViews}

                            <View
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingTop: 20,
                                    paddingBottom: 20,
                                }}>
                                <Icon
                                    color={'#868B8F'}
                                    name={'plus-circle'}
                                    size={22}
                                    onPress={addUser}
                                    title={'add more'}
                                />
                                <Text
                                    style={{
                                        marginLeft: 5,
                                        color: '#868B8F',
                                        paddingRight: 15,
                                    }}>
                                    {'Add Target User'}
                                </Text>
                                <Icon
                                    color={'#868B8F'}
                                    name={'plus-circle'}
                                    size={22}
                                    onPress={addChannel}
                                    title={'add more'}
                                />
                                <Text
                                    style={{
                                        marginLeft: 5,
                                        color: '#868B8F',
                                    }}>
                                    {'Add Target Channel'}
                                </Text>
                            </View>
                        </View>

                        <View style={{width: '100%'}}>
                            <TouchableOpacity
                                style={{
                                    borderRadius: 8,
                                    backgroundColor: '#375E8A',
                                    width: '100%',
                                    padding: 10,
                                }}
                                onPress={
                                    !isSubmitting
                                        ? handleCreateProposal
                                        : () => {}
                                }>
                                {!isSubmitting ? (
                                    <View
                                        style={{
                                            alignItems: 'center',
                                        }}>
                                        <Text
                                            style={{
                                                color: 'white',
                                                fontSize: 16,
                                                fontFamily: fonts.bold,
                                            }}>
                                            Submit proposal
                                        </Text>
                                    </View>
                                ) : (
                                    <ActivityIndicator
                                        color={colors.actionText}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ProposeWithdrawalScreen;
