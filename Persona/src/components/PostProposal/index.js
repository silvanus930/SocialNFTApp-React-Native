import React, {useState} from 'react';
import styled from 'styled-components';
import colors from 'resources/colors';
import baseText, {CenteredText, BaseText} from 'resources/text';
import auth from '@react-native-firebase/auth';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import VoteControls from './VoteControls';
import ProposalCountdown from './ProposalCountdown';
import {isAfter} from 'date-fns';
import {View} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {ProposalAuthorizedVotersTypes} from 'state/PostState';

export const PostProposalDisplayVariants = {
    grid: 'grid',
    minimal: 'minimal',
};

export default function PostProposal({
    proposal,
    personaID,
    postID,
    myPersona,
    variant,
}) {
    const {endTime, text, votes = {}, transferAmount, targetAccount} = proposal;
    const {
        current: {personaMap},
    } = React.useContext(GlobalStateRefContext);
    const endTimeDate = new Date((endTime?.seconds ?? 0) * 1000);
    const persona = personaMap[personaID];
    const myUserID = auth().currentUser.uid;
    const votingEnabledInitialCondition = isAfter(endTimeDate, new Date());
    const [isVotingEnabled, setIsVotingEnabled] = useState(
        votingEnabledInitialCondition,
    );

    const canUserVote = userID => {
        switch (proposal.authorizedVoters) {
            case ProposalAuthorizedVotersTypes.authors:
                return myPersona;
            case ProposalAuthorizedVotersTypes.authorsAndFollowers:
                return (
                    (myPersona ||
                        persona?.communityMembers?.includes(userID)) ??
                    false
                );
            case ProposalAuthorizedVotersTypes.anyone:
                return true;
            default:
                // If we don't explicitly know who can vote default to authors only
                return myPersona;
        }
    };

    const canMyUserVote = canUserVote(myUserID);

    const aggregatedVotes = {};

    Object.entries(proposal?.votes ?? []).forEach(([userID, vote]) => {
        if (
            aggregatedVotes[vote.outcome]?.length &&
            !aggregatedVotes[vote.outcome].includes(userID)
        ) {
            aggregatedVotes[vote.outcome].push(userID);
        } else {
            aggregatedVotes[vote.outcome] = [userID];
        }
    });

    return variant === PostProposalDisplayVariants.minimal ? (
        <MinimalistPostProposalWrapper>
            <ProposalText variant={variant}>
                <FontAwesome5
                    name="lightbulb"
                    color={colors.text}
                    size={12}
                    style={{bottom: 1}}
                />
                {'  '}
                {text}
            </ProposalText>
        </MinimalistPostProposalWrapper>
    ) : (
        <View>
            <BaseText
                style={{
                    color: colors.fadedRed,
                    fontWeight: 'bold',
                    marginBottom: 5,
                }}>
                Proposal
            </BaseText>
            <Wrapper>
                <ProposalTextWrapper>
                    <ProposalText variant={variant}>{text}</ProposalText>
                </ProposalTextWrapper>
                {transferAmount && targetAccount && (
                    <View
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 5,
                            marginBottom: 10,
                            textAlign: 'center',
                            borderWidth: 0,
                            borderColor: 'red',
                        }}>
                        <BaseText style={{color: colors.textFaded}}>
                            Transfer {transferAmount} ETH → {targetAccount}
                        </BaseText>
                    </View>
                )}
                {variant !== PostProposalDisplayVariants.grid && (
                    <VoteControls
                        votes={votes}
                        myUserID={myUserID}
                        personaID={personaID}
                        postID={postID}
                        isVotingEnabled={isVotingEnabled}
                        canMyUserVote={canMyUserVote}
                        authorizedVoters={proposal?.authorizedVoters}
                        aggregatedVotes={aggregatedVotes}
                    />
                )}
                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                    <View>
                        <BaseText
                            style={{
                                color: colors.textFaded,
                                marginTop: 2,
                                fontSize: 12,
                            }}>
                            Quorum: {parseInt(persona?.authors?.length / 3)}
                        </BaseText>
                    </View>
                    {variant === PostProposalDisplayVariants.grid ? (
                        <PostProposalHeader />
                    ) : (
                        <ProposalCountdown
                            setIsVotingEnabled={setIsVotingEnabled}
                            endTime={endTimeDate}
                        />
                    )}
                </View>
            </Wrapper>
        </View>
    );
}

function PostProposalHeader() {
    return (
        <ProposalHeaderWrapper
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
            }}>
            <FontAwesome5
                name="lightbulb"
                color={colors.text}
                size={14}
                style={{marginRight: 5, bottom: 1}}
            />
            <ProposalHeader>Vote</ProposalHeader>
        </ProposalHeaderWrapper>
    );
}

const Wrapper = styled.View`
    border-color: ${colors.fadedRed};
    border-width: 1px;
    border-radius: 12px;
    padding: 15px;
`;

const ProposalTextWrapper = styled.View`
    margin-bottom: 10px;
    padding: 10px 0px 0px 0px;
`;

const ProposalHeaderWrapper = styled.View`
    flex-direction: row;
`;

const ProposalHeader = styled(CenteredText)`
    color: ${colors.text};
    font-weight: bold;
    font-size: 14px;
`;

const ProposalText = styled(BaseText)`
    color: ${p =>
        p.variant === PostProposalDisplayVariants.grid
            ? colors.text
            : baseText.color};
    font-size: ${p =>
        p.variant === PostProposalDisplayVariants.grid
            ? '14px'
            : p.variant === PostProposalDisplayVariants.minimal
            ? '11px'
            : `${baseText.fontSize}px`};
`;

const MinimalistPostProposalWrapper = styled(ProposalTextWrapper)`
    align-items: center;
    justify-content: center;
    flex: 1;
`;
