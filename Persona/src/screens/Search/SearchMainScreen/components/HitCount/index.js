import React, {useEffect, useContext} from 'react';
import auth from '@react-native-firebase/auth';
import {connectInfiniteHits} from 'react-instantsearch-native';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateContext} from 'state/GlobalState';

import {isOwnChat} from 'screens/Search/utils/helpers';

const HitCount = connectInfiniteHits(({hits, chatIsEmpty, setChatIsEmpty}) => {
    const currentUserId = auth().currentUser.uid;

    const {personaMap} = useContext(GlobalStateContext);
    const {communityMap} = useContext(CommunityStateContext);

    useEffect(() => {
        const filteredHits = hits.filter(item =>
            isOwnChat({
                item,
                communityMap,
                personaMap,
                currentUserId,
            }),
        );
        if (filteredHits.length === 0 && !chatIsEmpty) {
            setChatIsEmpty(true);
        } else if (filteredHits.length && chatIsEmpty) {
            setChatIsEmpty(false);
        }
    }, [
        hits,
        setChatIsEmpty,
        chatIsEmpty,
        communityMap,
        personaMap,
        currentUserId,
    ]);

    return null;
});

export default HitCount;
