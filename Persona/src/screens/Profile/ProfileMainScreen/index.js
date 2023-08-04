import React, {useState, useContext, useCallback, useRef} from 'react';
import {
    Alert,
    Platform,
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import {GlobalStateContext} from 'state/GlobalState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PERSONA_VERSION_TEXT} from 'config/version';

import ProfileHeader from 'screens/Profile/components/ProfileHeader';
import ProfileHeaderButton from 'screens/Profile/components/ProfileHeaderButton';
import MenuItem from 'screens/Profile/components/MenuItem';
import NFTModal from 'components/NFTModal';
import WalletBalance from 'components/WalletBalance';

import {logout} from 'actions/session';
import {colors} from 'resources';

import styles from './styles';
import {ConnectionContext} from 'state/ConnectionState';

const ProfileMainScreen = ({route, navigation}) => {
    const {
        user: currentUser,
        userMap,
        personaMap,
    } = useContext(GlobalStateContext);
    const {
        current: {csetState},
    } = useContext(GlobalStateRefContext);

    let {
        user: {
            id: userID,
            hideDMSeenIndicators,
            disableInAppNotifications,
            enableExtraLiveNotifications,
            chatMessageNotificationsOn,
        },
        useNativeModuleChat,
    } = useContext(GlobalStateContext);

    const {cleanupPresence} = useContext(ConnectionContext);

    const [notifications, setNotifications] = useState(
        chatMessageNotificationsOn || true,
    );
    const isCurrentUser = !userID || userID === currentUser.id;
    const [useNativeChat, setUseNativeChat] = useState(useNativeModuleChat);

    // AROTH: I dont like this... a userMap with everyone preloaded...
    const user = userMap[auth().currentUser.uid];

    const onPressLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            {text: 'No', style: 'cancel'},
            {
                text: 'Yes',
                onPress: () => {
                    logout({
                        userID: currentUser.id,
                        csetState,
                        cleanupPresence,
                    });
                },
            },
        ]);
    };

    const onPressPublicProfile = useCallback(() => {
        navigation.navigate('ProfilePublic');
    }, [navigation]);

    const toggleNotifications = () => {
        setNotifications(!notifications);
        firestore()
            .collection('users')
            .doc(userID)
            .set({chatMessageNotificationsOn: !notifications}, {merge: true});
    };

    const toggleUseNativeChat = () => {
        if (useNativeModuleChat) {
            setUseNativeChat(!useNativeChat);
            csetState({
                useNativeModuleChat: false,
            });
        } else {
            Alert.alert(
                `Enable ${
                    Platform.OS === 'ios' ? 'iOS' : 'Android'
                } Native Chat?`,
                `The ${
                    Platform.OS === 'ios' ? 'iOS' : 'Android'
                } native chat module is being worked on, and many features are still WIP.\n\nFor example (as if Feb 22, 2023), you are able to display most messages (except for posts), but only able to send messages and replies to messages. Some items like user images and usernames are also missing. \n\nPlease only turn on if you are sure.`,
                [
                    {
                        text: 'Cancel 😮‍💨',
                        style: 'cancel',
                    },
                    {
                        text: 'Proceed 🫡',
                        onPress: () => {
                            setUseNativeChat(!useNativeChat);
                            csetState({
                                useNativeModuleChat: true,
                            });
                        },
                    },
                ],
                {cancelable: false},
            );
        }
    };

    const headerButtons = (
        <>
            <ProfileHeaderButton
                title="Public profile"
                onPress={onPressPublicProfile}
            />
        </>
    );

    return (
        <SafeAreaView>
            <ScrollView bounces={false}>
                <ProfileHeader user={user} headerButtons={headerButtons} />

                <View style={styles.contentContainer}>
                    <View style={styles.menuSection}>
                        <MenuItem
                            icon={'menuIconAccount'}
                            title="Account details"
                            navigateToScreen={'ProfileAccountDetails'}
                            navigateToParams={{user}}
                        />

                        <MenuItem
                            icon={'menuIconAccount'}
                            title="Status"
                            subtext={'Active'}
                            subtextColor={'#7FC1A9'}
                            navigateToScreen={'XXX'}
                        />

                        <MenuItem
                            icon={'menuIconWallet'}
                            title="My wallet"
                            subtext={'$3280'}
                            subtextComponent={
                                <WalletBalance
                                    userId={user.uid}
                                    style={styles.walletBalanceText}
                                />
                            }
                            navigateToScreen={'ProfileWallet'}
                            navigateToParams={{}}
                        />

                        <MenuItem
                            icon={'menuIconNfts'}
                            title="My NFTs"
                            navigateToScreen={'XXX'}
                        />

                        <MenuItem
                            icon={'bookmark'}
                            title="My bookmarks"
                            navigateToScreen={'Bookmarks'}
                            navigateToParams={{}}
                        />

                        <MenuItem
                            icon={'menuIconPrivacy'}
                            title="Privacy settings"
                            navigateToScreen={'XXX'}
                        />

                        <MenuItem
                            icon={'menuIconNotifications'}
                            title="Notifications"
                            toggleSwitch={{
                                value: notifications,
                                toggle: toggleNotifications,
                            }}
                        />

                        <MenuItem
                            icon={'menuIconAccount'}
                            title="iOS Native Chat Module ⚡"
                            toggleSwitch={{
                                value: useNativeChat,
                                toggle: toggleUseNativeChat,
                            }}
                            isLastItem={true}
                        />
                    </View>

                    <View style={styles.menuSection}>
                        <MenuItem
                            icon={'menuIconTerms'}
                            title="Terms and conditions"
                            navigateToScreen={'Terms'}
                        />

                        <MenuItem
                            icon={'menuIconHelp'}
                            title="Help and support"
                            navigateToScreen={'XXX'}
                        />

                        <MenuItem
                            icon={'menuIconReport'}
                            title="Report"
                            navigateToScreen={'ProfileReportContent'}
                        />

                        <MenuItem
                            icon={'menuIconLogout'}
                            title="Logout"
                            titleColor={'#B15F5F'}
                            onPress={onPressLogout}
                            isLastItem={true}
                        />
                    </View>

                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>
                            {PERSONA_VERSION_TEXT}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileMainScreen;
