import React from 'react';
import styled from 'styled-components';
import baseText, {CenteredText} from 'resources/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Timer from 'components/Timer';
import {getUnixTime, format} from 'date-fns';
import {View} from 'react-native';

export default function ProposalCountdown(props) {
    const {endTime, setIsVotingEnabled} = props;
    const secondsRemaining = getUnixTime(endTime) - Date.now() / 1000;
    return secondsRemaining > 0 ? (
        <Timer
            setIsVotingEnabled={setIsVotingEnabled}
            initialSeconds={secondsRemaining}
        />
    ) : (
        <ExpiredWrapper>
            <View style={{alignItems: 'center'}}>
                <Ionicons
                    name="alarm-outline"
                    size={14}
                    color={baseText.color}
                    style={{marginRight: 5, top: 2}}
                />
            </View>
            <CenteredText style={{fontSize: 12}}>
                Closed {format(endTime, 'PPp')}
            </CenteredText>
        </ExpiredWrapper>
    );
}

const ExpiredWrapper = styled.View`
    padding-top: 10px;
    padding-bottom: 10px;
    flex-direction: row;
    justify-content: center;
`;
