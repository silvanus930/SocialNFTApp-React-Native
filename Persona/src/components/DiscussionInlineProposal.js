import React from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import UserBubble from 'components/UserBubble';
import {useCallback, useContext, useEffect, useState} from 'react';
import * as Progress from 'react-native-progress';
import fonts from 'resources/fonts';
import {BaseText} from 'resources/text';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {BinaryProposalOptions} from 'state/PostState';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import colors from 'resources/colors';
import useNavPushDebounce from 'hooks/navigationHooks';
import {determineUserRights} from 'utils/helpers';
import ProposalCountdown from './PostProposal/ProposalCountdown';
import {isAfter} from 'date-fns';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {getUnixTime, format} from 'date-fns';

export default function DiscussionInlineProposal({
    post,
    proposal: initialProposal,
    disableNav,
}) {
    const [proposal, setProposal] = useState(initialProposal);
    const {actions, proposalRef, proposalTitle, postRef, sourceRef} =
        initialProposal;
    const entityID = proposal?.entityID;
    const postID = postRef?.id;
    const {
        current: {personaMap, user, userMap},
    } = useContext(GlobalStateRefContext);
    const {
        current: {communityMap},
    } = useContext(CommunityStateRefContext);
    const entity = personaMap[entityID] || communityMap[entityID];
    const myUserID = auth().currentUser.uid;
    const endTimeDate = new Date((proposal?.endTime?.seconds ?? 0) * 1000);
    const isCommunityPost = sourceRef?.path?.includes('communities');
    const votingEnabledInitialCondition = isAfter(endTimeDate, new Date());
    const [isVotingEnabled, setIsVotingEnabled] = useState(
        votingEnabledInitialCondition,
    );

    useEffect(() => {
        if (proposalRef) {
            return firestore()
                .collection('proposals')
                .doc(proposalRef.id)
                .onSnapshot(snapshot => {
                    setProposal({
                        ...snapshot.data(),
                        entityID: snapshot.get('sourceRef')?.id,
                    });
                });
        }
    }, [proposalRef]);

    const recordVote = async voteOption => {
        if (
            voteOption !== BinaryProposalOptions.for &&
            voteOption !== BinaryProposalOptions.against &&
            voteOption !== BinaryProposalOptions.abstain
        ) {
            throw new Error('Vote outcome must be yes, no or abstain');
        }
        try {
            const batch = firestore().batch();
            batch.update(postRef, {
                [`proposal.votes.${myUserID}`]:
                    proposal.votes[myUserID] === voteOption
                        ? firestore.FieldValue.delete()
                        : voteOption,
            });
            batch.update(proposalRef, {
                [`votes.${myUserID}`]:
                    proposal.votes[myUserID] === voteOption
                        ? firestore.FieldValue.delete()
                        : voteOption,
            });
            await batch.commit();
        } catch (e) {
            console.log(e);
        }
    };

    const handleVoteFor = async () => {
        await recordVote(BinaryProposalOptions.for);
    };

    const handleVoteAgainst = async () => {
        await recordVote(BinaryProposalOptions.against);
    };

    const handleVoteAbstain = async () => {
        await recordVote(BinaryProposalOptions.abstain);
    };

    const handleNoAuthVote = () => {
        Alert.alert('You do not have voting rights.');
    };

    const navToPostDiscussion = useNavPushDebounce(
        'PostDiscussion', // TODO DCENTRY
        {
            personaName: entity?.name,
            personaKey: entityID,
            postKey: postID,
            personaProfileImgUrl: entity?.profileImgUrl,
            communityID: isCommunityPost ? entityID : null,
            scrollToMessageID: null,
            openToThreadID: null,
        },
        [entity, entityID],
    );

    const personaContext = React.useContext(PersonaStateRefContext);
    const handleNav = useCallback(() => {
        personaContext.current.csetState({
            openToThreadID: null,
            scrollToMessageID: null,
            threadID: null,
        });
        navToPostDiscussion();
    }, [navToPostDiscussion, sourceRef?.path]);

    const quorum = proposal?.quorum;

    const aggregatedVotes = {};
    let numTotalVotes = 0;
    Object.entries(proposal?.votes ?? []).forEach(([userID, vote]) => {
        numTotalVotes += 1;
        if (aggregatedVotes[vote]) {
            aggregatedVotes[vote].push(userID);
        } else {
            aggregatedVotes[vote] = [userID];
        }
    });

    let progressFor =
        parseInt(aggregatedVotes[0]?.length) /
        parseInt(entity?.authors?.length || entity?.members?.length);
    let progressAgainst =
        parseInt(aggregatedVotes[1]?.length) /
        parseInt(entity?.authors?.length || entity?.members?.length);
    let progressAbstain =
        parseInt(aggregatedVotes[2]?.length) /
        parseInt(entity?.authors?.length || entity?.members?.length);

    if (!progressFor) {
        progressFor = 0;
    }
    if (!progressAgainst) {
        progressAgainst = 0;
    }
    if (!progressAbstain) {
        progressAbstain = 0;
    }
    /*progressFor = 0.4;
    progressAgainst = 0.4;
    progressAbstain = 0.4;*/

    /*console.log(
        'progressFor:',
        progressFor,
        '<->',
        parseInt(aggregatedVotes[0]?.length),
        '/',
        parseInt(entity?.authors?.length || entity?.members?.length),
    );
    console.log('progressAgainst:', progressAgainst);
    console.log('progressAbstain:', progressAbstain);*/

    // const hasAuth = entity?.authors?.length
    //     ? entity?.authors?.includes(auth().currentUser.uid)
    //     : entity?.members?.includes(auth().currentUser.uid);

    const hasAuth = entity?.authors?.length
        ? determineUserRights(null, entityID, user, 'voteProposal')
        : determineUserRights(entityID, null, user, 'voteProposal');

    return proposal ? (
        <TouchableOpacity
            disabled={disableNav}
            onPress={handleNav}
            style={{
                marginTop: -10,
                padding: 5,
                borderWidth: 0,
                borderColor: 'purple',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <View
                style={{
                    width: 280,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                <BaseText
                    style={{
                        color: colors.maxFaded,
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        marginStart: 3,
                        marginBottom: 0,
                    }}>
                    proposal
                </BaseText>
                <View
                    style={{
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingTop: 5,
                        borderWidth: 0.4,
                        backgroundColor: colors.mediaPostBackground,
                        borderRadius: 6,
                        width: '100%',
                        borderWidth: 0,
                        borderColor: 'yellow',
                    }}>
                    <View
                        style={{
                            marginTop: 5,
                            marginBottom: actions[0] ? 4 : 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        {proposalTitle && (
                            <BaseText
                                style={{
                                    color: colors.textBright,
                                    fontFamily: fonts.medium,
                                    fontSize: 14,
                                }}>
                                {proposalTitle}
                            </BaseText>
                        )}
                    </View>
                    {actions.map(action => {
                        const {amount, targetRef, currency} = action;
                        return (
                            <View
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: 0,
                                    textAlign: 'center',
                                    borderWidth: 0,
                                    borderColor: 'red',
                                }}>
                                <BaseText
                                    style={{
                                        color: colors.textFaded,
                                        fontSize: 12,
                                        fontFamily: fonts.regular,
                                    }}>
                                    Transfer {amount} {currency ?? 'ETH'} →{' '}
                                    {personaMap[targetRef.id]?.name ||
                                        communityMap[targetRef.id]?.name ||
                                        userMap[targetRef.id]?.userName}
                                </BaseText>
                            </View>
                        );
                    })}
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            borderColor: 'red',
                            borderWidth: 0,
                            marginTop: 10,
                        }}>
                        <TouchableOpacity
                            disabled={endTimeDate < new Date()}
                            style={Styles.voteButton}
                            onPress={
                                hasAuth ? handleVoteFor : handleNoAuthVote
                            }>
                            <BaseText
                                style={{
                                    ...Styles.voteButtonText,
                                    color: colors.green,
                                }}>
                                for
                            </BaseText>
                            <View
                                style={{
                                    borderColor: 'magenta',
                                    borderWidth: 0,
                                }}>
                                <Progress.Bar
                                    color={colors.green}
                                    progress={progressFor}
                                    width={60}
                                />
                            </View>
                            <View
                                style={{
                                    position: 'absolute',
                                    borderColor: 'orange',
                                    borderWidth: 0,
                                    bottom: 7,
                                    left: 5,
                                }}>
                                <VoteProgressUsers
                                    userIDs={aggregatedVotes[0]}
                                    userMap={userMap}
                                />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            disabled={endTimeDate < new Date()}
                            style={Styles.voteButton}
                            onPress={
                                hasAuth ? handleVoteAgainst : handleNoAuthVote
                            }>
                            <BaseText
                                style={{
                                    ...Styles.voteButtonText,
                                    color: colors.red,
                                }}>
                                against
                            </BaseText>
                            <View
                                style={{
                                    borderColor: 'magenta',
                                    borderWidth: 0,
                                }}>
                                <Progress.Bar
                                    color={colors.red}
                                    progress={progressAgainst}
                                    width={60}
                                />
                            </View>
                            <View
                                style={{
                                    position: 'absolute',
                                    bottom: 7,
                                    left: 5,
                                }}>
                                <VoteProgressUsers
                                    userIDs={aggregatedVotes[1]}
                                    userMap={userMap}
                                />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            disabled={endTimeDate < new Date()}
                            style={Styles.voteButton}
                            onPress={
                                hasAuth ? handleVoteAbstain : handleNoAuthVote
                            }>
                            <BaseText
                                style={{
                                    ...Styles.voteButtonText,
                                    color: colors.maxFaded,
                                }}>
                                abstain
                            </BaseText>
                            <View
                                style={{
                                    borderColor: 'magenta',
                                    borderWidth: 0,
                                }}>
                                <Progress.Bar
                                    color={colors.maxFaded}
                                    progress={progressAbstain}
                                    width={60}
                                />
                            </View>
                            <View
                                style={{
                                    position: 'absolute',
                                    bottom: 7,
                                    left: 5,
                                }}>
                                <VoteProgressUsers
                                    userIDs={aggregatedVotes[2]}
                                    userMap={userMap}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            borderWidth: 0,
                            borderColor: 'blue',
                            paddingTop: 5,
                            paddingBottom: 0,
                            alignItems: 'center',
                        }}>
                        <View>
                            <BaseText
                                style={{
                                    color: colors.textFaded,
                                    fontSize: 12,
                                    marginEnd: 5,
                                }}>
                                Quorum: {quorum}
                            </BaseText>
                        </View>
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            <ProposalCountdown
                                setIsVotingEnabled={setIsVotingEnabled}
                                endTime={endTimeDate}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    ) : null;
}

function VoteProgressUsers({userIDs, userMap}) {
    const profileModalContextRef = useContext(ProfileModalStateRefContext);
    const navToProfile = useCallback(
        userID => {
            profileModalContextRef.current.csetState({
                showToggle: true,
                userID: userID,
            });
        },
        [profileModalContextRef],
    );
    const dupedData = userIDs;

    const keyExtractor = useCallback(item => item, []);
    const renderUser = useCallback(
        item => {
            const {item: userID} = item;
            const onPress = () => navToProfile(userID);
            const user = userMap[userID];
            return (
                <UserBubble
                    tag={'proposal'}
                    disabled={false}
                    margin={0}
                    authors={[]}
                    showName={false}
                    bubbleSize={12}
                    user={user}
                    onPress={onPress}
                />
            );
        },
        [navToProfile, userMap],
    );

    return userIDs && userIDs.length > 0 ? (
        <View>
            <FlatList
                bounces={false}
                showsHorizontalScrollIndicator={true}
                indicatorStyle={'white'}
                horizontal={true}
                data={dupedData}
                keyExtractor={keyExtractor}
                renderItem={renderUser}
            />
        </View>
    ) : null;
}

const Styles = StyleSheet.create({
    voteButton: {
        borderColor: colors.seperatorLineColor,
        borderRadius: 6,
        backgroundColor: colors.searchBackground,
        borderWidth: 0,
        padding: 8,
        flex: 1,
        height: 75,
        marginStart: 3,
        marginEnd: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    voteButtonText: {
        color: colors.textFaded,
        fontFamily: fonts.bold,
        fontSize: 12,
    },
});
