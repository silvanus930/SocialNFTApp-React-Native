import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';
import colors from 'resources/colors';
import baseText from 'resources/text';
import fonts from 'resources/fonts';

const GettingStarted = ({closeLeftDrawer}) => {
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);

    const personaContext = React.useContext(PersonaStateContext);
    const communityContext = React.useContext(CommunityStateContext);
    let communityID = communityContext?.currentCommunity;
    let communityMap = communityContext?.communityMap;
    let community = communityMap[communityID];
    let navigation = useNavigation();

    const clearPersonaContext = React.useCallback(() => {
        /*navigation.goBack();
        navigation.goBack();
        navigation.navigate('HomeScreen');*/
        personaContext.csetState({
            persona: personaMap.gettingstarted,
            openFromTop: true,
        });
        closeLeftDrawer();
    }, [personaContext, closeLeftDrawer, navigation]);

    let numMembers = community?.members?.filter(
        key => userMap[key]?.human,
    ).length;
    const feed = personaContext?.persona?.feed;

    const shouldHighlight = personaContext?.persona?.pid === 'gettingstarted';

    return React.useMemo(
        () =>
            feed === 'profile' ||
            feed === 'my' ||
            communityID !== 'persona' ? null : (
                <TouchableOpacity
                    onPress={clearPersonaContext}
                    style={{
                        borderColor: 'red',
                        borderWidth: 0,
                        backgroundColor: shouldHighlight
                            ? colors.paleBackground
                            : null,
                        height: 55,
                        justifyContent: 'center',
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 5,
                            paddingTop: 5,
                            marginStart: 17,
                            paddingBottom: 10,
                        }}>
                        <MaterialCommunityIcons
                            name={'help-box'}
                            style={{marginLeft: 2, marginRight: 4}}
                            size={33}
                            color={
                                personaContext?.persona?.pid
                                    ? colors.maxFaded
                                    : colors.postAction
                            }
                        />
                        <Text
                            style={{
                                ...baseText,
                                marginStart: 2.2,
                                color: shouldHighlight
                                    ? 'white'
                                    : colors.textFaded,
                                fontFamily: fonts.medium,
                                fontSize: 18,
                            }}>
                            Getting Started
                        </Text>
                    </View>
                </TouchableOpacity>
            ),
        [
            personaContext?.persona?.pid,
            personaContext?.persona?.feed,
            numMembers,
            feed,
            communityID,
        ],
    );
};

export default GettingStarted;
