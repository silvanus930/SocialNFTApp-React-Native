import React, {useContext, useRef, useMemo} from 'react';
import {Animated as RNAnimated, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import {TransactionGrid} from 'components/FeedScreen';
import {HomeListTransactionMain} from 'components/HomeListTransactionGroup';
import ProfileModal from 'components/ProfileModal';
import FeedEndorsementsMenu from 'components/FeedEndorsementMenu';
import FeedEndorsementUsersMenu from 'components/FeedEndorsementUserMenu';

import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';

const TransferScreen = props => {
    const communityContext = useContext(CommunityStateContext);
    let communityID = communityContext.currentCommunity;
    let communityMap = communityContext.communityMap;
    const personaContext = useContext(PersonaStateContext);
    let personaKey = personaContext?.persona?.pid;
    let navigation = useNavigation();

    const personaEntry = useMemo(
        () => ({
            persona: personaContext.persona,
            personaKey,
            postList: [],
        }),
        [personaKey, personaContext],
    );

    let Grid = useMemo(
        () => TransactionGrid(communityID, communityMap, false, true),
        [communityID, communityMap],
    );

    const animatedOffset = useRef(new RNAnimated.Value(0)).current;
    const onScroll = RNAnimated.event(
        [{nativeEvent: {contentOffset: {y: props.route.params.offsetY}}}],
        {useNativeDriver: true},
    );

    return useMemo(
        () =>
            personaKey ? (
                <>
                    <View style={{marginTop: 10}} />
                    <HomeListTransactionMain
                        communityID={communityID}
                        animatedOffset={animatedOffset}
                        onScroll={onScroll}
                        personaEntry={personaEntry}
                        personaKey={personaKey}
                        displayHeader={true}
                        publicPersonasViewable={true}
                        offsetEmojis={true}
                        updateHeader={false}
                    />
                    <ProfileModal navigation={navigation} />
                    <FeedEndorsementsMenu />
                    <FeedEndorsementUsersMenu />
                </>
            ) : (
                <>
                    <View />
                    <Grid navigation={navigation} onScroll={onScroll} />
                    <ProfileModal navigation={navigation} />
                    <FeedEndorsementsMenu />
                    <FeedEndorsementUsersMenu />
                </>
            ),
        [
            personaKey,
            communityID,
            animatedOffset,
            onScroll,
            personaEntry,
            navigation,
            Grid,
        ],
    );
};

export default TransferScreen;
