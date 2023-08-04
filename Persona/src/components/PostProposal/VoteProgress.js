import React from 'react';
import styled from 'styled-components';
import baseText, {BaseText} from 'resources/text';
import {PostProposalDisplayVariants} from 'components/PostProposal';
import colors from 'resources/colors';

export default function VoteProgress({
    votes,
    persona,
    myPersona,
    variant,
    authorizedVoters,
    aggregatedVotes,
}) {
    const numAuthors = persona.authors.length;
    const shouldShowUserVotes =
        (!persona.anonymous || (persona.anonymous && myPersona)) &&
        variant !== PostProposalDisplayVariants.grid;

    const shouldShowNumVotes =
        !persona.anonymous || (persona.anonymous && myPersona);

    let numTotalVotes = Object.keys(aggregatedVotes).length;

    const convertToPercent = num => (num * 100).toFixed(0) + '%';
    const countVotes = votesObj => Object.keys(votesObj ?? {}).length;
    const calculateVoteProgress = votesObj => {
        if (numTotalVotes > 0) {
            return convertToPercent(countVotes(votesObj) / numTotalVotes);
        } else {
            return convertToPercent(0);
        }
    };

    return (
        <Wrapper>
            <OutcomeWrapper>
                <VoteProgressTextWrapper>
                    <VoteProgressText variant={variant}>For</VoteProgressText>
                    <PercentText variant={variant}>
                        {calculateVoteProgress(aggregatedVotes?.for)}
                    </PercentText>
                </VoteProgressTextWrapper>
                {/* {shouldShowUserVotes && (
                    <VoteProgressUsers userIDs={aggregatedVotes?.for} />
                )} */}
            </OutcomeWrapper>
            <OutcomeWrapper>
                <VoteProgressTextWrapper>
                    <VoteProgressText variant={variant}>
                        Against
                    </VoteProgressText>
                    <PercentText variant={variant}>
                        {calculateVoteProgress(aggregatedVotes?.against)}
                    </PercentText>
                </VoteProgressTextWrapper>
                {/* {shouldShowUserVotes && (
                    <VoteProgressUsers userIDs={aggregatedVotes?.against} />
                )} */}
            </OutcomeWrapper>
            <OutcomeWrapper>
                <VoteProgressTextWrapper>
                    <VoteProgressText variant={variant}>
                        Abstain
                    </VoteProgressText>
                    <PercentText variant={variant}>
                        {calculateVoteProgress(aggregatedVotes?.abstain)}
                    </PercentText>
                </VoteProgressTextWrapper>
                {/* {shouldShowUserVotes && (
                    <VoteProgressUsers userIDs={aggregatedVotes?.against} />
                )} */}
            </OutcomeWrapper>
            <OutcomeWrapper>
                <VoteCountText>{`${numTotalVotes} vote${
                    numTotalVotes === 1 ? '' : 's'
                }`}</VoteCountText>
            </OutcomeWrapper>
        </Wrapper>
    );
}
const Wrapper = styled.View`
    padding: 10px 0px;
`;

const OutcomeWrapper = styled.View`
    flex-direction: column;
    align-items: center;
    flex: 1;
`;

const VoteProgressTextWrapper = styled.View`
    flex-direction: row;
`;

const VoteProgressText = styled(BaseText)`
    padding-right: 10px;
    color: ${p =>
        p.variant === PostProposalDisplayVariants.grid
            ? colors.textFaded
            : colors.textFaded};
    font-size: ${p =>
        p.variant === PostProposalDisplayVariants.grid
            ? '14px'
            : `${baseText.fontSize}px`};
`;

const PercentText = styled(BaseText)`
    color: ${p =>
        p.variant === PostProposalDisplayVariants.grid
            ? colors.textFaded
            : colors.textFaded};
    font-size: ${p =>
        p.variant === PostProposalDisplayVariants.grid
            ? '14px'
            : `${baseText.fontSize}px`};
`;

const VoteCountText = styled(BaseText)`
    color: ${colors.text};
    font-size: 14px;
`;

const VoteProgressUsersWrapper = styled.View`
    padding-top: 5px;
    padding-bottom: 5px;
`;
