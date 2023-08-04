import React, {useContext, useCallback} from 'react';
import {TouchableOpacity, View, Platform, LayoutAnimation} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {withTiming} from 'react-native-reanimated';
import auth from '@react-native-firebase/auth';
import {FlashList} from '@shopify/flash-list';
import {useSwitchCommunity} from 'hooks/navigationHooks';
import {CommunityStateContext} from 'state/CommunityState';
import {vanillaPersona} from 'state/PersonaState';
import {PersonaStateContext} from 'state/PersonaState';
import {PersonaStateRefContext} from 'state/PersonaStateRef';

import {images, constants} from 'resources';
import {updateProfileContext, updateCommunityContext} from 'actions/profile';
import getResizedImageUrl from 'utils/media/resize';
import {heightOffset} from 'components/NotchSpacer';
import {ForumFeedDispatchContext} from 'state/ForumFeedStateContext';
import {FeedDispatchContext} from 'state/FeedStateContext';
// import FeedButton from './components/FeedButton';
import {selectLayout} from 'utils/helpers';

import styles from './styles';

const CustomExitTransition = values => {
    'worklet';
    return {
        animations: {
            originX: withTiming(-60),
            opacity: withTiming(0),
        },
        initialValues: {
            originX: values.currentOriginX,
            opacity: 1,
        },
    };
};

const CustomEnterTransition = values => {
    'worklet';
    return {
        animations: {
            originX: withTiming(0),
            opacity: withTiming(1),
        },
        initialValues: {
            originX: -60,
            opacity: 0,
        },
    };
};

const CommunityList = ({navigation, closeLeftDrawer}) => {
    const communityContext = useContext(CommunityStateContext);
    const communityMap = communityContext?.communityMap;
    const currentCommunity = communityContext?.currentCommunity;

    const personaContextRef = useContext(PersonaStateRefContext);
    const personaContext = useContext(PersonaStateContext);

    const switchCommunity = useSwitchCommunity();

    const CommunityBlob = useCallback(
        ({item}) => {
            let selected =
                personaContext?.persona?.feed !== 'my' &&
                personaContext?.persona?.feed !== 'profile' &&
                currentCommunity === item;
            let community = communityMap[item];
            let personaProfileImgUrl = community?.profileImgUrl
                ? community.profileImgUrl
                : '';

            if (
                !community ||
                !community?.members ||
                !community?.members?.includes(auth().currentUser.uid)
            ) {
                return <></>;
            }

            return (
                <View style={styles.bioContainer(selected)}>
                    <FastImage
                        source={{
                            uri: personaProfileImgUrl
                                ? getResizedImageUrl({
                                      origUrl: personaProfileImgUrl
                                          ? personaProfileImgUrl
                                          : images.personaDefaultProfileUrl,
                                      height: constants.personaProfileSize,
                                      width: constants.personaProfileSize,
                                  })
                                : images.personaDefaultProfileUrl,
                        }}
                        style={{
                            height: constants.personaProfileSize,
                            width: constants.personaProfileSize,
                            borderRadius: 6,
                        }}
                    />
                </View>
            );
        },
        [communityMap, currentCommunity, personaContext?.persona?.feed],
    );

    const clearPersonaContext = useCallback(() => {
        updateProfileContext('');
        personaContextRef.current.csetState({persona: vanillaPersona});
    }, [personaContextRef]);

    const forumFeedDispatchContext = useContext(ForumFeedDispatchContext);
    const transactionFeedDispatchContext = useContext(FeedDispatchContext);

    const setCommunity = useCallback(
        community => {
            switchCommunity({communityID: community});
            updateCommunityContext(community);
            clearPersonaContext();
        },
        [
            clearPersonaContext,
            communityContext,
            forumFeedDispatchContext,
            transactionFeedDispatchContext,
        ],
    );

    const renderCommunity = ({item}) => {
        // Temporally prevent `feed` button for after, please keep the code

        // if (item === 'feed') {
        //     return (
        //         <FeedButton
        //             navigation={navigation}
        //             closeLeftDrawer={closeLeftDrawer}
        //         />
        //     );
        // }
        return (
            <TouchableOpacity onPress={() => setCommunity(item)}>
                <CommunityBlob item={item} />
            </TouchableOpacity>
        );
    };

    return (
        <Animated.View
            style={styles.container(heightOffset)}
            entering={selectLayout(CustomEnterTransition)}
            exiting={selectLayout(CustomExitTransition)}>
            <FlashList
                estimatedItemSize={50}
                contentContainerStyle={{
                    paddingTop: 0,
                    paddingBottom: 5,
                }}
                data={['feed'].concat(Object.keys(communityMap))}
                renderItem={renderCommunity}
            />
        </Animated.View>
    );
};

export default CommunityList;
