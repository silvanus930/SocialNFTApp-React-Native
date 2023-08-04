import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import DepositModal from 'components/DepositModal';
import React, {useCallback, useContext, useState} from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import palette from 'resources/palette';
import baseText from 'resources/text';
import {BASE_API_URL} from '../../config/urls';
const SERVER_URL = BASE_API_URL;

import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateContext} from 'state/GlobalState';
import {InviteStateContext} from 'state/InviteState';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {MessageModalStateRefContext} from 'state/MessageModalStateRef';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {useNavToDMChat} from 'hooks/navigationHooks';
import {
    StripeProvider,
    collectBankAccountToken,
} from '@stripe/stripe-react-native';

const PersonaWallet = ({personaID}) => {
    const {personaMap} = useContext(GlobalStateContext);

    let wallet = personaMap[personaID]?.wallet;
    if (wallet) {
        wallet =
            wallet.substring(0, 7) +
            '...' +
            wallet.substring(wallet?.length - 5, wallet.length);
    }
    return wallet ? (
        <Text
            style={{
                color: colors.timestamp,
                fontSize: 12,
                fontFamily: fonts.mono,
            }}>
            {' '}
            {wallet}
        </Text>
    ) : null;
};
const UserWallet = ({userID}) => {
    const {userMap} = useContext(GlobalStateContext);

    let wallet = userMap[userID]?.wallet;
    if (wallet) {
        wallet =
            wallet.substring(0, 7) +
            '...' +
            wallet.substring(wallet?.length - 5, wallet.length);
    }
    return wallet ? (
        <Text
            style={{
                color: colors.timestamp,
                fontSize: 12,
                fontFamily: fonts.mono,
            }}>
            {' '}
            {wallet}
        </Text>
    ) : null;
};
export const FollowButton = ({user, style}) => {
    //const {following} = React.useContext(PresenceFeedStateContext);
    //console.log(Platform.OS, 'USER', user);
    let followed = false; /*following?.profileFollow
        ? following?.profileFollow?.includes(user.id)
        : false;*/

    const followOnPress = React.useCallback(async () => {
        //console.log('followed', followed);
        if (followed) {
            await firestore()
                .collection('users')
                .doc(auth().currentUser.uid)
                .collection('live')
                .doc('following')
                .set(
                    {
                        profileFollow: firestore.FieldValue.arrayRemove(
                            user.id,
                        ),
                    },
                    {merge: true},
                );
        } else {
            await firestore()
                .collection('users')
                .doc(auth().currentUser.uid)
                .collection('live')
                .doc('following')
                .set(
                    {
                        profileFollow: firestore.FieldValue.arrayUnion(user.id),
                    },
                    {merge: true},
                );
        }
    }, [followed]);
    return user.id !== auth().currentUser.uid ? (
        <GeneralFollow
            style={style}
            followed={followed}
            followOnPress={followOnPress}
        />
    ) : null;
};

export function GeneralFollow({
    showUnfollow = true,
    followOnPress,
    style = {},
    followed,
}) {
    return followed && !showUnfollow ? null : (
        <View>
            <TouchableOpacity
                style={{
                    zIndex: 999000000009999999,
                    elevation: 999000000009999999,
                    borderRadius: 19,
                    padding: 3,
                    paddingLeft: 10,
                    paddingRight: 10,
                    borderWidth: 0.5,
                    borderColor: followed
                        ? colors.maxFaded
                        : colors.emphasisRed,
                    backgroundColor: followed ? colors.studioBtn : null,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...style,
                }}
                disabled={Boolean(followed && !showUnfollow)}
                onPress={followOnPress}>
                <Text
                    style={{
                        ...baseText,
                        color: !followed ? colors.emphasisRed : colors.maxFaded,
                        fontSize: 12,
                        fontFamily: fonts.medium,
                    }}>
                    {!followed ? 'Follow' : 'Unfollow'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export const DMButton = ({personaVoice, navigation, user}) => {
    personaVoice && console.log('rendering DMButton in personaVoice');
    const navToDMChat = useNavToDMChat(navigation);
    const inviteContext = React.useContext(InviteStateContext);
    const {
        current: {user: currentUser},
    } = React.useContext(GlobalStateRefContext);

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );

    const messageModalContextRef = React.useContext(
        MessageModalStateRefContext,
    );

    const dmOnPress = React.useCallback(async () => {
        const chatContext = Object.assign(
            await inviteContext.pushChatStateToFirebaseAsync(
                [],
                [
                    {...currentUser, uid: currentUser.id},
                    {...user, uid: user.id},
                ],
                SYSTEM_DM_PERSONA_ID,
                'DM',
            ),
            {title: 'DM (2)', text: 'DM'},
        );
        profileModalContextRef.current.csetState({showToggle: false});
        profileModalContextRef.current.closeRightDrawer &&
            profileModalContextRef.current.closeRightDrawer();

        navToDMChat(chatContext.chatID, user);
    }, [
        navigation,
        profileModalContextRef,
        messageModalContextRef.current,
        inviteContext,
    ]);

    return (
        <View>
            <TouchableOpacity
                style={{
                    zIndex: 999000000009999999,
                    elevation: 999000000009999999,
                    borderWidth: 0,
                    borderColor: 'pink',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 40,
                    height: 40,
                }}
                onPress={dmOnPress}>
                <Icon
                    color={'white'}
                    name="send"
                    size={palette.header.icon.size}
                />
            </TouchableOpacity>
        </View>
    );
};

export default function UserBio({
    navigation,
    personaVoice = false,
    userNameTextStyle = {},
    containerStyle = {},
    textStyle = {},
    user,
    selected = false,
}) {
    const {
        user: currentUser,
        personaList,
        personaMap,
    } = useContext(GlobalStateContext);

    const [numberFollowers, setNumFollowers] = React.useState(0);
    const [externalAccounts, setExternalAccounts] = React.useState([]);

    const sendTransfer = async stripeAccount => {
        const transferResponse = await fetch(`${SERVER_URL}/stripe/transfers`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${await auth().currentUser.getIdToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount_cents: 1000,
            }),
        });
    };

    React.useEffect(() => {
        const fetchData = async () => {
            console.log('UserBio trying to get follower count', user.id);
            const docRef = await firestore()
                .collection('users')
                .doc(user.id)
                .collection('live')
                .doc('followers')
                .get();
            if (docRef.exists) {
                setNumFollowers(docRef.data()?.profileFollow?.length);
            }
        };
        fetchData();
    }, [setNumFollowers, user.id]);

    React.useEffect(() => {
        const fetchData = async () => {
            const externalAccountsRef = await firestore()
                .collection('users')
                .doc(user.id)
                .collection('stripeExternalAccounts')
                .get();
            const externalAccounts = [];
            externalAccountsRef.forEach(accountRef => {
                const stripeAccount = accountRef.data();
                externalAccounts.push(
                    <TouchableOpacity
                        onPress={sendTransfer.bind(this, stripeAccount)}
                        style={{
                            flex: 0.6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderRadius: 16,
                            borderColor: colors.timeline,
                            borderWidth: 0.4,
                            zIndex: 999000000009999999,
                            elevation: 999000000009999999,
                            borderRadius: 19,
                            padding: 6.5,
                            borderWidth: 0.5,
                            borderColor: colors.maxFaded,
                            backgroundColor: null,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Text
                            style={{
                                marginTop: 0,
                                fontSize: 11,
                                marginBottom: 0,
                                fontFamily: fonts.regular,
                                color: 'magenta',
                            }}>
                            Transfer $10 to {stripeAccount.bank_name} ending in{' '}
                            {stripeAccount.last4}
                        </Text>
                    </TouchableOpacity>,
                );
            });
            setExternalAccounts(externalAccounts);
        };
        fetchData();
    }, [user.id]);

    const isCurrentUser = user.id === currentUser.id;
    let numberPersonas;
    if (isCurrentUser) {
        numberPersonas = personaList.filter(p => !p.deleted).length || 0;
    } else {
        numberPersonas = Object.values(personaMap || {}).filter(
            p => p?.authors?.includes(user.id) && !p?.deleted,
        ).length;
    }

    let privatePersona = personaVoice
        ? personaMap[user?.pid]?.private &&
          !personaMap[user?.pid].authors.includes(auth().currentUser.uid)
        : false;
    let persona = personaVoice
        ? personaMap[user?.pid]
        : {communityMembers: [], private: false, anonymous: false};

    if (personaVoice) {
        numberPersonas = Object.keys(personaMap)
            .map(pid => personaMap[pid])
            .filter(
                persona =>
                    !persona.deleted &&
                    !persona.private &&
                    persona.parentPersonaID === user?.pid,
            ).length;
    }

    const [savedBioTime, setSavedBioTime] = React.useState({
        bio: user.bio,
        savedBio: user.bio,
        timeOfLastWrite: new Date(),
    });

    const updateBio = React.useCallback(
        bio => {
            console.log('updateBio:', bio);
            setSavedBioTime({
                bio: bio,
                savedBio: savedBioTime.savedBio,
                timeOfLastWrite: new Date(),
            });
        },
        [setSavedBioTime, savedBioTime, savedBioTime.savedBio],
    );

    const calculateTimeLeft = React.useCallback(async () => {
        //console.log('calculateTimeLeft');
        let newDate = new Date();
        newDate.setSeconds(savedBioTime.timeOfLastWrite.getSeconds() + 2.2);
        let difference = +newDate - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            //console.log('difference between now and timeOfLastWrite', difference);
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        //console.log('in seconds', timeLeft.seconds);
        if (!timeLeft.seconds && savedBioTime.savedBio !== savedBioTime.bio) {
            firestore()
                .collection('users')
                .doc(user.id)
                .set({bio: savedBioTime.bio}, {merge: true});
            /*console.log('writing to firestore!', {
        bio: savedBioTime.bio,
      });*/
            setSavedBioTime({
                savedBio: savedBioTime.bio,
                bio: savedBioTime.bio,
                timeOfLastWrite: new Date(),
            });
        }

        return timeLeft;
    }, [
        savedBioTime.timeOfLastWrite,
        savedBioTime,
        savedBioTime.bio,
        savedBioTime.savedBio,
        user,
        user.id,
    ]);

    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

    React.useEffect(() => {
        const timer = setTimeout(() => {
            let time = calculateTimeLeft();
            setTimeLeft(time);
        }, 1200);

        return () => clearTimeout(timer);
    });

    let walletBalance = user?.walletBalance || {};
    if (personaVoice) {
        walletBalance = personaMap[user?.pid]?.walletBalance
            ? personaMap[user?.pid]?.walletBalance
            : {nft: 0, usdc: 0, eth: 0, cc: 0};
    }

    const [showDepositModal, setShowDepositModal] = useState(false);
    const toggleShowDepositModal = useCallback(() => {
        setShowDepositModal(!showDepositModal);
    }, [showDepositModal]);

    const entityID = user?.pid || user?.id;
    const entityType = personaVoice ? 'project' : 'user';

    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    const communityNFTs = communityMap
        ? Object.keys(communityMap)
              .filter(key => communityMap[key]?.members.includes(user?.id))
              .map(key => communityMap[key])
        : [];

    numberPersonas += communityNFTs.length;

    const verifyCustomer = async () => {
        const accountLinksResponse = await fetch(
            `${SERVER_URL}/stripe/account_links`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${await auth().currentUser.getIdToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            },
        );

        const accountLink = await accountLinksResponse.json();

        console.log('showing webview', accountLink.data.url);
        Linking.openURL(accountLink.data.url);
    };

    const linkBankAccount = async () => {
        const financialConnectionSessionResponse = await fetch(
            `${SERVER_URL}/stripe/financial_connections/sessions`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${await auth().currentUser.getIdToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            },
        );

        const financialConnectionSession =
            await financialConnectionSessionResponse.json();

        const {token, err} = await collectBankAccountToken(
            financialConnectionSession.data.stripe_session_client_secret,
        );

        if (err) {
            console.log(`err code: ${err.code}`, err.message);
            // Add alerting here
            return;
        }

        if (!token) {
            return;
        }

        const externalAccountResponse = await fetch(
            `${SERVER_URL}/stripe/external_accounts`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${await auth().currentUser.getIdToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stripe_bank_account_token: token.id,
                }),
            },
        );
    };

    return (
        <>
            <View
                style={{
                    ...Styles.container,
                    ...containerStyle,
                    flex: 1.5,
                    borderColor: 'magenta',
                    borderWidth: 0,
                }}>
                <View
                    style={{
                        ...Styles.bioHeader,
                        borderWidth: selected ? 1 : 0,
                        borderRadius: 25,
                        marginEnd: selected ? 20 : 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            ...Styles.userNameText,
                            ...userNameTextStyle,
                            fontFamily: fonts.semibold,
                        }}>
                        {personaVoice ? user.name : user?.userName}
                        {personaVoice ? (
                            <PersonaWallet personaID={user?.pid} />
                        ) : (
                            <UserWallet
                                userID={user.id}
                                isCurrentUser={isCurrentUser}
                            />
                        )}
                    </Text>
                </View>
                <View style={{...Styles.countHeader, flexDirection: 'row'}}>
                    <View style={Styles.personaNumberContainer}>
                        <Text
                            style={{
                                ...baseText,
                                ...Styles.numberText,
                                ...textStyle,
                            }}>
                            {!personaVoice
                                ? numberFollowers
                                : personaMap[user?.pid]?.authors?.length}{' '}
                            {!personaVoice ? 'follower' : 'member'}
                            {numberFollowers !== 1 ? 's' : ''}{' '}
                        </Text>
                    </View>
                    <View style={Styles.personaNumberContainer}>
                        <Text
                            style={{
                                ...baseText,
                                ...Styles.numberText,
                                ...textStyle,
                            }}>
                            {personaVoice ? walletBalance.nft : numberPersonas}{' '}
                            NFT
                            {numberPersonas === 1 ? '' : 's'}{' '}
                        </Text>
                    </View>
                </View>

                {isCurrentUser ? (
                    <TextInput
                        autoCapitalize={'none'}
                        editable
                        multiline
                        defaultValue={savedBioTime.bio}
                        maxLength={80}
                        value={savedBioTime.bio}
                        color={colors.text}
                        onChangeText={updateBio}
                        placeholder={'Enter Bio...'}
                        placeholderTextColor={colors.textFaded2}
                        style={{...baseText, fontSize: 14}}
                    />
                ) : (
                    <Text
                        style={{
                            ...baseText,
                            fontSize: 16,
                            flex: 1,
                            flexWrap: 'wrap',
                            color: colors.textFaded2,
                        }}>
                        {user.bio}
                    </Text>
                )}

                {isCurrentUser && <View>{externalAccounts}</View>}

                {isCurrentUser && (
                    <TouchableOpacity
                        onPress={verifyCustomer}
                        style={{
                            flex: 0.6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderRadius: 16,
                            borderColor: colors.timeline,
                            borderWidth: 0.4,

                            zIndex: 999000000009999999,
                            elevation: 999000000009999999,
                            borderRadius: 19,
                            padding: 6.5,
                            borderWidth: 0.5,
                            borderColor: colors.maxFaded,
                            backgroundColor: null,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Text
                            style={{
                                marginTop: 0,
                                fontSize: 11,
                                marginBottom: 0,
                                fontFamily: fonts.regular,
                                color: 'magenta',
                            }}>
                            Verify your information
                        </Text>
                    </TouchableOpacity>
                )}

                {isCurrentUser && (
                    <StripeProvider publishableKey="pk_test_51LrqgNFexCEmpnpDwCdLGVv4Bdid7rBFhVYBBStId7tZtmprySCBZaliB9kocKyJmU9ok0HQyJnwcZy1bKJ8zF7K00mbGm4Mjg">
                        <TouchableOpacity
                            onPress={linkBankAccount}
                            style={{
                                flex: 0.6,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderRadius: 16,
                                borderColor: colors.timeline,
                                borderWidth: 0.4,

                                zIndex: 999000000009999999,
                                elevation: 999000000009999999,
                                borderRadius: 19,
                                padding: 6.5,
                                borderWidth: 0.5,
                                borderColor: colors.maxFaded,
                                backgroundColor: null,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                            <Text
                                style={{
                                    marginTop: 0,
                                    fontSize: 11,
                                    marginBottom: 0,
                                    fontFamily: fonts.regular,
                                    color: 'magenta',
                                }}>
                                Add account
                            </Text>
                        </TouchableOpacity>
                    </StripeProvider>
                )}

                {isCurrentUser && (
                    <View
                        style={{
                            borderColor: 'magenta',
                            paddingTop: 10,
                            borderWidth: 0,
                            flexDirection: 'column',
                        }}>
                        <Text
                            style={{
                                ...baseText,
                                color: colors.timestamp,
                                lineHeight: null,
                                fontFamily: fonts.mono,
                                fontSize: 14,
                            }}>
                            {walletBalance?.usdc || '0'} USDC
                        </Text>
                        <Text
                            style={{
                                ...baseText,
                                color: colors.timestamp,
                                lineHeight: null,
                                fontFamily: fonts.mono,
                                fontSize: 14,
                            }}>
                            {walletBalance?.eth || '0'} ETH
                        </Text>
                        <Text
                            style={{
                                ...baseText,
                                color: colors.timestamp,
                                lineHeight: null,
                                fontFamily: fonts.mono,
                                fontSize: 14,
                            }}>
                            {walletBalance?.cc || '0'} CC
                        </Text>
                    </View>
                )}

                {!isCurrentUser && navigation && (
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderColor: 'magenta',
                            borderWidth: 0,
                        }}>

                        <TouchableOpacity
                            onPress={toggleShowDepositModal}
                            style={{
                                flex: 0.6,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderRadius: 16,
                                borderColor: colors.timeline,
                                borderWidth: 0.4,

                                zIndex: 999000000009999999,
                                elevation: 999000000009999999,
                                borderRadius: 19,
                                padding: 6.5,
                                borderWidth: 0.5,
                                borderColor: colors.maxFaded,
                                backgroundColor: null,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                            <Text
                                style={{
                                    marginTop: 0,
                                    fontSize: 11,
                                    marginBottom: 0,
                                    fontFamily: fonts.regular,
                                    color: colors.text,
                                }}>
                                Deposit
                            </Text>
                            <DepositModal
                                entityID={entityID}
                                entityType={entityType}
                                toggleShowDepositModal={toggleShowDepositModal}
                                showDepositModal={showDepositModal}
                            />
                        </TouchableOpacity>

                        <DMButton
                            personaVoice={personaVoice}
                            navigation={navigation}
                            user={user}
                            currentUser={currentUser}
                        />
                    </View>
                )}
            </View>
        </>
    );
}

const Styles = StyleSheet.create({
    bioHeader: {
        flexDirection: 'row',
        marginBottom: 1,
        justifyContent: 'flex-start',
    },
    countHeader: {
        flexDirection: 'column',
        marginBottom: 7,
        justifyContent: 'flex-start',
    },
    container: {
        flexDirection: 'column',
        marginStart: 35,
        marginTop: 35,
        marginEnd: 25,
    },
    personaNumberContainer: {
        flex: 1.8,
        flexDirection: 'row',
        alignSelf: 'flex-start',
        marginBottom: 1,
    },
    userNameText: {
        fontFamily: fonts.bold,
        flex: 1,
    },
    numberText: {
        color: colors.textFaded2,
        fontSize: 13,
        marginBottom: -1,
    },
    userBioEditor: {
        position: 'absolute',
        top: 20,
        width: 200,
        height: 50,
        paddingLeft: 10,
        paddingTop: 5,
        backgroundColor: colors.textInputBackground,
        borderRadius: 20,
    },
    editBioText: {
        marginTop: 0,
        fontSize: 13,
        color: '#007AFF',
    },
    userBioText: {
        marginTop: 0,
        color: colors.text,
        flex: 1,
    },
});
