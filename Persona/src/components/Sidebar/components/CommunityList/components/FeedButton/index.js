import React, {useContext, useCallback, useMemo} from 'react';
import {TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {CommunityStateContext} from 'state/CommunityState';
import {vanillaPersona} from 'state/PersonaState';
import {FeedDispatchContext} from 'state/FeedStateContext';
import {ForumFeedDispatchContext} from 'state/ForumFeedStateContext';
import {PersonaStateContext} from 'state/PersonaState';
import {constants, colors} from 'resources';

import styles from './style';

// Used in FeedButton
const ForYou = ({closeLeftDrawer, navigation}) => {
    const personaContext = useContext(PersonaStateContext);
    const communityContext = useContext(CommunityStateContext);
    const transactionFeedDispatchContext = useContext(FeedDispatchContext);
    const forumFeedDispatchContext = useContext(ForumFeedDispatchContext);

    const clearPersonaContext = useCallback(() => {
        navigation.goBack();
        navigation.goBack();
        forumFeedDispatchContext.dispatch({type: 'reset'});
        transactionFeedDispatchContext.dispatch({type: 'reset'});

        communityContext.csetState({currentCommunity: 'clear'});
        personaContext.csetState({persona: {...vanillaPersona, feed: 'my'}});
        closeLeftDrawer();
    }, [navigation, communityContext, personaContext, closeLeftDrawer]);

    let selected = personaContext?.persona?.feed === 'my';

    return useMemo(
        () => (
            <TouchableOpacity
                onPress={clearPersonaContext}
                style={styles.container}>
                <View style={styles.subContainer(selected)}>
                    <MaterialCommunityIcons
                        name={'timeline-text'}
                        size={constants.personaProfileSize - 2}
                        color={selected ? colors.postAction : colors.textFaded2}
                        style={styles.icon}
                    />
                </View>
            </TouchableOpacity>
        ),
        [clearPersonaContext, selected],
    );
};

// Used in CommunityList/renderCommunity
const FeedButton = ({navigation, closeLeftDrawer}) => {
    return <ForYou navigation={navigation} closeLeftDrawer={closeLeftDrawer} />;
};

export default FeedButton;
