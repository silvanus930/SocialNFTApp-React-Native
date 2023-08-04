import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import CommunityProjectWallet from 'components/CommunityProjectWallet';
import React, {useContext} from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Animated as RNAnimated,
} from 'react-native';

import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {HEADER_HEIGHT} from 'state/AnimatedHeaderState';
import {determineUserRights} from 'utils/helpers';

//import CommunityProjectNotif from 'components/CommunityProjectNotif';

const CommunityProjectNotif = ({persona, navigation}) => {
    const myUserID = auth().currentUser.uid;

    const communityContext = React.useContext(CommunityStateContext);
    let communityMap = communityContext?.communityMap;
    let communityID = communityContext.currentCommunity;
    let currentCommunity = communityID;

    let chatDocPath = persona?.pid
        ? `personas/${persona.pid}/chats/all`
        : `communities/${communityID}/chat/all`;

    const [areNotificationsMuted, setAreNotificationsMuted] =
        React.useState(null);

    const handleToggleMuteChatNotifications = () => {
        if (areNotificationsMuted) {
            firestore()
                .doc(chatDocPath)
                .set(
                    {
                        notificationsMutedUsers:
                            firestore.FieldValue.arrayRemove(myUserID),
                    },
                    {merge: true},
                );
        } else {
            firestore()
                .doc(chatDocPath)
                .set(
                    {
                        notificationsMutedUsers:
                            firestore.FieldValue.arrayUnion(myUserID),
                    },
                    {merge: true},
                );
        }
    }; //, [chatDocPath, areNotificationsMuted]);

    // TODO: This should be handled by DiscussionEngine probably
    React.useEffect(() => {
        if (chatDocPath) {
            return firestore()
                .doc(chatDocPath)
                .onSnapshot(chatDocSnap => {
                    const notificationsMutedUsers = chatDocSnap.get(
                        'notificationsMutedUsers',
                    );
                    const nextAreNotificationsMuted =
                        notificationsMutedUsers?.includes(myUserID) ?? false;
                    if (nextAreNotificationsMuted !== areNotificationsMuted) {
                        setAreNotificationsMuted(nextAreNotificationsMuted);
                    }
                });
        }
    }, [areNotificationsMuted, chatDocPath, myUserID]);

    return (
        <View
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                borderColor: 'orange',
                borderWidth: 0,
                backgroundColor: colors.paleBackground,
                borderRadius: 8,
                marginStart: 40,
                paddingTop: 4,
                paddingBottom: 4,
                marginEnd: 40,
                marginTop: 20,
            }}>
            <TouchableOpacity
                onPress={handleToggleMuteChatNotifications}
                style={{
                    marginStart: 20,
                    marginBottom: 0,
                    flexDirection: 'row',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 40,
                }}>
                <FontAwesome
                    name={areNotificationsMuted ? 'bell-slash' : 'bell'}
                    color={colors.textFaded}
                    size={18}
                />
                <Text
                    style={{
                        marginStart: 8,
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        color: colors.text,
                    }}>
                    chat notifications
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        flex: 0,
                        borderColor: 'orange',
                        borderWidth: 0,
                        width: '40%',
                    }}>
                    <Text
                        style={{
                            color: colors.maxFaded,
                            fontFamily: fonts.regular,
                            fontSize: 16,
                        }}>
                        {areNotificationsMuted ? 'off' : 'on'}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};
const TreasuryScreen = ({showHeader, marginTop, onScroll}) => {
    const myUserID = auth().currentUser.uid;
    const personaContext = React.useContext(PersonaStateContext);
    let personaKey = personaContext?.persona?.pid;
    let navigation = useNavigation();

    const communityContext = React.useContext(CommunityStateContext);
    let communityMap = communityContext?.communityMap;
    let communityID = communityContext.currentCommunity;
    let currentCommunity = communityID;

    let authors = personaKey
        ? personaContext?.persona?.authors
        : communityMap[currentCommunity]?.members;
    let persona = personaKey
        ? personaContext?.persona
        : communityMap[currentCommunity];

    /*const headerLeft = React.useCallback(
        () => (
            <View
                style={{
                    top: 16,
                    borderColor: 'green',
                    borderWidth: 0,
                    paddingRight: 10,
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                }}>
                <TouchableOpacity
                    onPress={() => navigation && navigation.goBack()}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <Ionicons
                        name={'chevron-back-outline'}
                        size={32}
                        color={colors.postAction}
                    />

                    <Text style={{...baseText, color: colors.postAction}}>
                        Chat
                    </Text>
                </TouchableOpacity>
            </View>
        ),
        [navigation],
    );*/
    /*React.useEffect(() => {
        navigation.setOptions({
            headerLeft: headerLeft,
        });
    }, [headerLeft,navigation]);*/
    return (
        <RNAnimated.ScrollView onScroll={onScroll}>
            <View style={{height: HEADER_HEIGHT, width: '100%'}} />
            <Header
                marginTop={marginTop}
                persona={persona}
                communityID={communityID}
                navigation={navigation}
            />
            <View style={{height: 30, width: '100%'}} />
        </RNAnimated.ScrollView>
    );
};

function Header({persona, navigation, marginTop, communityID}) {
    const {
        current: {user: currentUser, personaMap, user},
    } = useContext(GlobalStateRefContext);
    const communityContext = React.useContext(CommunityStateContext);
    let communityMap = communityContext?.communityMap;
    let personaID = persona?.pid;
    let myUserID = auth().currentUser.uid;
    // let hasAuth = personaID
    //     ? personaMap[personaID]?.authors?.includes(myUserID) ||
    //       myUserID === 'PHobeplJLROyFlWhXPINseFVkK32'
    //     : communityMap[communityID]?.members?.includes(myUserID) ||
    //       myUserID === 'PHobeplJLROyFlWhXPINseFVkK32';

    const hasAuth = personaID
        ? determineUserRights(null, personaID, user, 'withdrawal')
        : determineUserRights(communityID, null, user, 'withdrawal');

    return (
        <CommunityProjectWallet
            hasAuth={hasAuth}
            persona={persona}
            navigation={navigation}
        />
    );
}

export default TreasuryScreen;
