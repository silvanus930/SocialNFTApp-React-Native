import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {Layout} from 'react-native-reanimated';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext, vanillaPersona} from 'state/PersonaState';
import colors from 'resources/colors';
import baseText from 'resources/text';
import fonts from 'resources/fonts';
import styles from './styles';
import Timestamp from 'components/Timestamp';
import {selectLayout} from 'utils/helpers';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CommunityChat = ({personaTouchedMap, chatActivity, closeLeftDrawer}) => {
    const {
        current: {userMap, showCommunityList},
    } = React.useContext(GlobalStateRefContext);

    const personaContext = React.useContext(PersonaStateContext);
    const communityContext = React.useContext(CommunityStateContext);
    let communityID = communityContext?.currentCommunity;
    let communityMap = communityContext?.communityMap;
    let community = communityMap[communityID];
    let navigation = useNavigation();

    const unreadCount = chatActivity?.unreadCount;

    const clearPersonaContext = React.useCallback(() => {
        /*navigation.goBack();
        navigation.goBack();
        navigation.navigate('Persona');*/
        personaContext.csetState({
            openFromTop: false,
            persona: vanillaPersona,
            openToThreadID: null,
            scrollToMessageID: null,
        });
        communityContext.csetState({
            openToThreadID: 'clear',
            scrollToMessageID: 'clear',
        });
        closeLeftDrawer();
    }, [personaContext, closeLeftDrawer, navigation]);

    let numMembers = community?.members?.filter(
        key => userMap[key]?.human,
    ).length;
    const feed = personaContext?.persona?.feed;

    const shouldHighlight = !(
        personaContext?.persona?.pid || personaContext?.persona?.feed
    );

    const lastActive = chatActivity?.lastActive;
    let lastEditAt = personaTouchedMap[communityID] ?? lastActive;
    lastEditAt = lastActive > lastEditAt ? lastActive : lastEditAt;

    return React.useMemo(
        () =>
            feed === 'profile' || feed === 'my' ? null : (
                <AnimatedTouchable
                    layout={selectLayout(Layout)}
                    onPress={clearPersonaContext}
                    style={{
                        backgroundColor: shouldHighlight
                            ? colors.paleBackground
                            : null,
                        height: 55,
                        justifyContent: 'center',
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            paddingTop: 5,
                            marginStart: 17,
                            paddingBottom: 5,
                        }}>
                        <MaterialCommunityIcons
                            name={'home'}
                            style={{marginLeft: 2, marginRight: 4}}
                            size={33}
                            color={
                                personaContext?.persona?.pid
                                    ? colors.maxFaded
                                    : colors.postAction
                            }
                        />

                        <View style={styles.listItemContentContainer}>
                            <Text
                                style={{
                                    ...baseText,
                                    marginStart: -5,
                                    color: shouldHighlight
                                        ? 'white'
                                        : colors.textFaded,
                                    fontFamily: fonts.medium,
                                    fontSize: 18,
                                }}>
                                Home Channel
                            </Text>
                            {unreadCount > 0 && (
                                <Animated.View
                                    layout={selectLayout(Layout)}
                                    style={[
                                        styles.timestampContainer,
                                        {
                                            backgroundColor: '#933D38',
                                        },
                                    ]}>
                                    <Animated.Text
                                        layout={selectLayout(Layout)}
                                        style={{
                                            ...baseText,
                                            fontSize: 12,
                                            fontFamily: fonts.timestamp,
                                            fontWeight: '500',
                                        }}>
                                        {unreadCount}
                                    </Animated.Text>
                                </Animated.View>
                            )}

                            {lastEditAt?.seconds && (
                                <Animated.View
                                    layout={selectLayout(Layout)}
                                    style={[
                                        styles.timestampContainer,
                                        {
                                            position: 'absolute',
                                            right: 13.0,
                                        },
                                    ]}>
                                    <Timestamp seconds={lastEditAt?.seconds} />
                                </Animated.View>
                            )}
                        </View>
                    </View>
                </AnimatedTouchable>
            ),
        [
            personaContext?.persona?.pid,
            personaContext?.persona?.feed,
            numMembers,
            feed,
            showCommunityList,
            chatActivity,
        ],
    );
};

export default CommunityChat;
