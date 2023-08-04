import React, {useState, useRef} from 'react';
import styled from 'styled-components';
import baseText, {BaseText, CenteredText} from 'resources/text';
import {View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from 'resources/colors';

// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
function useInterval(callback, delay) {
    const intervalRef = React.useRef();
    const callbackRef = React.useRef(callback);

    // Remember the latest callback:

    React.useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Set up the interval:

    React.useEffect(() => {
        if (typeof delay === 'number') {
            intervalRef.current = window.setInterval(
                () => callbackRef.current(),
                delay,
            );

            // Clear interval if the components is unmounted or the delay changes:
            return () => window.clearInterval(intervalRef.current);
        }
    }, [delay]);

    // Returns a ref to the interval ID in case you want to clear it manually:
    return intervalRef;
}

// TODO: Verify that this really stays in sync with the time down to the
// second.
export default function Timer(props) {
    const {initialSeconds = 0, setIsVotingEnabled} = props;
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef();
    const timeComponents = secondsToTime(initialSeconds - seconds);
    function secondsToTime(secs) {
        const displaySecs = Math.max(secs, 0);
        return {
            days: Math.floor(displaySecs / (60 * 60 * 24)),
            hours: Math.floor((displaySecs / (60 * 60)) % 24),
            minutes: Math.floor((displaySecs / 60) % 60),
            seconds: Math.floor(displaySecs % 60),
        };
    }

    intervalRef.current = useInterval(() => {
        const timeRemaining = initialSeconds - seconds;
        if (timeRemaining > 0) {
            setSeconds(seconds + 1);
        } else {
            setIsVotingEnabled(false);
            clearInterval(intervalRef.current);
        }
    }, 1000);

    return (
        <TimerWrapper
            style={{
                paddingTop: 10,
                paddingBottom: 10,
                flexDirection: 'row',
                justifyContent: 'center',
            }}>
            <View style={{alignItems: 'center'}}>
                <Ionicons
                    name="alarm-outline"
                    size={14}
                    color={colors.textFaded}
                    style={{marginRight: 5, top: 2}}
                />
            </View>
            <BaseText style={{fontSize: 12, color: colors.textFaded}}>
                {timeComponents.days}d:{timeComponents.hours}h:
                {timeComponents.minutes}m:{timeComponents.seconds}s
            </BaseText>
        </TimerWrapper>
    );
}

const TimerWrapper = styled.View`
    padding-top: 10px;
    padding-bottom: 10px;
    flex-direction: row;
    justify-content: center;
`;
