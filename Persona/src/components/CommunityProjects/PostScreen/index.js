import React, {useContext, useRef, useMemo} from 'react';
import {Animated as RNAnimated, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import {AnimaGrid, FollowingGrid} from 'components/FeedScreen';
import FeedEndorsementsMenu from 'components/FeedEndorsementMenu';
import ProfileModal from 'components/ProfileModal';
import FeedEndorsementUsersMenu from 'components/FeedEndorsementUserMenu';
import {HomeListPostMain} from 'components/HomeListPostGroup';

import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';

const PostScreen = props => {
    const communityContext = useContext(CommunityStateContext);
    let communityID = communityContext.currentCommunity;
    let communityMap = communityContext.communityMap;

    const personaContext = useContext(PersonaStateContext);
    let personaKey = personaContext?.persona?.pid;
    let feedType = personaContext?.persona?.feed;
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
        () =>
            feedType === 'my'
                ? FollowingGrid(communityID, false)
                : AnimaGrid(communityID, communityMap, false, true),
        [communityID, communityMap, feedType],
    );

    const animatedOffset = useRef(new RNAnimated.Value(0)).current;
    const onScroll = RNAnimated.event(
        [{nativeEvent: {contentOffset: {y: props.route?.params?.offsetY}}}],
        {
            useNativeDriver: true,
        },
    );

    return useMemo(
        () =>
            personaKey ? (
                <>
                    <View style={{marginTop: 10}} />
                    <HomeListPostMain
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

export default PostScreen;
