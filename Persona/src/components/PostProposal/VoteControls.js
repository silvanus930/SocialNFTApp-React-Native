import React, {useCallback} from 'react';
import styled from 'styled-components';
import {
    View,
    TouchableOpacity,
    Alert,
    FlatList,
    StyleSheet,
} from 'react-native';
import colors from 'resources/colors';
import baseText, {BaseText} from 'resources/text';
import {
    BinaryProposalOptions,
    ProposalAuthorizedVotersTypes,
} from 'state/PostState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import UserBubble from 'components/UserBubble';
import {postVote} from 'actions/posts';

export default function VoteControls({
    myUserID,
    personaID,
    postID,
    isVotingEnabled,
    votes,
    canMyUserVote,
    authorizedVoters,
    aggregatedVotes,
}) {
    const myVote = votes[myUserID];
    const didVoteYes = myVote?.outcome === BinaryProposalOptions.for;
    const didVoteNo = myVote?.outcome === BinaryProposalOptions.against;

    const confirmAndRecordVote = async voteOption => {
        Alert.alert(
            'Confirm your vote',
            `Are you sure you want to vote ${voteOption}?`,
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                {
                    text: `Vote ${voteOption}`,
                    onPress: async () => await recordVote(voteOption),
                },
            ],
        );
    };

    const recordVote = async voteOption => {
        if (
            voteOption !== BinaryProposalOptions.for &&
            voteOption !== BinaryProposalOptions.against
        ) {
            throw new Error('Vote outcome must be yes or no');
        }
        try {
            await postVote(personaID, postID, voteOption);
        } catch (e) {
            console.log(e);
        }
    };

    const handleVoteFor = useCallback(async () => {
        // Record a vote
        await confirmAndRecordVote(BinaryProposalOptions.for);
    }, []);

    const handleVoteAgainst = useCallback(async () => {
        await confirmAndRecordVote(BinaryProposalOptions.against);
    }, []);

    const handleVoteAbstain = useCallback(async () => {
        await confirmAndRecordVote(BinaryProposalOptions.abstain);
    }, []);

    const whoCanVoteDescription = _authorizedVoters => {
        switch (_authorizedVoters) {
            case ProposalAuthorizedVotersTypes.authors:
                return 'Open to authors only';
            case ProposalAuthorizedVotersTypes.authorsAndFollowers:
                return 'Open to authors and persona followers';
            case ProposalAuthorizedVotersTypes.anyone:
                return 'Open to anyone';
            default:
                return 'Only authors can vote';
        }
    };

    return (
        <View>
            {isVotingEnabled ? (
                <View>
                    {canMyUserVote ? (
                        <>
                            <View
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                }}>
                                <TouchableOpacity
                                    style={Styles.voteButton}
                                    onPress={handleVoteFor}>
                                    <BaseText style={Styles.voteButtonText}>
                                        For
                                    </BaseText>
                                    <View
                                        style={{
                                            position: 'absolute',
                                            bottom: 7,
                                        }}>
                                        <VoteProgressUsers
                                            userIDs={aggregatedVotes?.for}
                                        />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={Styles.voteButton}
                                    onPress={handleVoteAgainst}>
                                    <BaseText style={Styles.voteButtonText}>
                                        Against
                                    </BaseText>
                                    <View
                                        style={{
                                            position: 'absolute',
                                            bottom: 7,
                                        }}>
                                        <VoteProgressUsers
                                            userIDs={aggregatedVotes?.against}
                                        />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={Styles.voteButton}
                                    onPress={handleVoteAbstain}>
                                    <BaseText style={Styles.voteButtonText}>
                                        Abstain
                                    </BaseText>
                                    <View
                                        style={{
                                            position: 'absolute',
                                            bottom: 7,
                                        }}>
                                        <VoteProgressUsers
                                            userIDs={aggregatedVotes?.abstain}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* <TouchableOpacity
                                disabled={!canMyUserVote || didVoteYes}
                                style={{marginBottom: 5}}
                                onPress={onPressVoteYes}>
                                <VoteButtonWrapper
                                    bg={
                                        didVoteYes
                                            ? colors.green
                                            : didVoteNo
                                            ? colors.extraFadedGreen
                                            : colors.fadedGreen
                                    }>
                                    <Feather
                                        name="check"
                                        size={18}
                                        color={
                                            didVoteNo
                                                ? colors.textFaded
                                                : baseText.color
                                        }
                                        style={{
                                            marginRight: 5,
                                            top:
                                                Platform.OS === 'android'
                                                    ? 2
                                                    : 0,
                                        }}
                                    />
                                    <VoteButtonText faded={didVoteNo}>
                                        {didVoteYes
                                            ? 'You voted for'
                                            : 'Vote For'}
                                    </VoteButtonText>
                                </VoteButtonWrapper>
                            </TouchableOpacity>
                            <TouchableOpacity
                                disabled={!canMyUserVote || didVoteNo}
                                onPress={onPressVoteNo}>
                                <VoteButtonWrapper
                                    bg={
                                        didVoteNo
                                            ? colors.red
                                            : didVoteYes
                                            ? colors.extraFadedRed
                                            : colors.fadedRed
                                    }>
                                    <Feather
                                        name="x"
                                        size={18}
                                        color={
                                            didVoteYes
                                                ? colors.textFaded
                                                : baseText.color
                                        }
                                        style={{
                                            marginRight: 5,
                                            top:
                                                Platform.OS === 'android'
                                                    ? 2
                                                    : 0,
                                        }}
                                    />
                                    <VoteButtonText faded={didVoteYes}>
                                        {didVoteNo
                                            ? 'You voted against'
                                            : 'Vote against'}
                                    </VoteButtonText>
                                </VoteButtonWrapper>
                            </TouchableOpacity> */}
                        </>
                    ) : (
                        <VoteButtonWrapper bg={colors.faded}>
                            <VoteButtonText>Ineligible to vote</VoteButtonText>
                        </VoteButtonWrapper>
                    )}
                    {/* <WhoCanVoteDescriptionTextWrapper>
                        <WhoCanVoteDescriptionText>
                            {whoCanVoteDescription(authorizedVoters)}
                        </WhoCanVoteDescriptionText>
                    </WhoCanVoteDescriptionTextWrapper> */}
                </View>
            ) : (
                <VoteButtonWrapper bg={colors.faded}>
                    <VoteButtonText>Voting has ended</VoteButtonText>
                </VoteButtonWrapper>
            )}
        </View>
    );
}

function VoteProgressUsers({userIDs}) {
    const {
        current: {userMap},
    } = React.useContext(GlobalStateRefContext);
    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const navToProfile = React.useCallback(
        userID => {
            profileModalContextRef.current.csetState({
                showToggle: true,
                userID: userID,
            });
        },
        [profileModalContextRef],
    );
    // FIXME: Somewhere along the line we're getting duplicate IDs here,
    // I don't know where and don't have time to figure it out 🤷‍♂️
    // It's probably sth simple
    const userIDsSet = new Set(userIDs);
    const dupedData = [...userIDsSet];

    const keyExtractor = useCallback(item => item, []);
    const renderUser = useCallback(item => {
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
    }, []);

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

const VoteButtonWrapper = styled.View`
    background-color: ${p => p.bg};
    padding: 15px;
    border-radius: 12px;
    flex-direction: row;
    justify-content: center;
`;

const VoteButtonText = styled(BaseText)`
    color: ${p => (p.faded ? colors.textFaded : baseText.color)};
    text-align: center;
`;

const WhoCanVoteDescriptionTextWrapper = styled.View`
    align-items: center;
    padding-top: 5px;
`;

const WhoCanVoteDescriptionText = styled(BaseText)`
    color: ${colors.text};
    font-size: 14px;
`;

const Styles = StyleSheet.create({
    voteButton: {
        borderColor: colors.seperatorLineColor,
        borderRadius: 6,
        backgroundColor: colors.searchBackground,
        borderWidth: 1,
        padding: 20,
        flex: 1,
        marginEnd: 5,
        height: 75,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voteButtonText: {
        color: colors.textBright,
        fontSize: 14,
    },
});
