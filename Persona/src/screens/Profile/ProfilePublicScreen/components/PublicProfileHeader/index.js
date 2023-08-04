import React, {useContext, useState, useCallback, useEffect} from 'react';
import {
    Animated as RNAnimated,
    View,
    Alert,
    Text,
    TouchableOpacity,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import {timestampToTime} from 'utils/helpers';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {InviteStateContext} from 'state/InviteState';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {MessageModalStateRefContext} from 'state/MessageModalStateRef';

import WalletBalance from 'components/WalletBalance';
import DepositModal from 'components/DepositModal';

import getResizedImageUrl from 'utils/media/resize';
import {PROFILE_IMAGE_QUALITY} from 'utils/media/compression';
import {uploadMediaToS3} from 'utils/s3/helpers';
import {useNavToDMChat} from 'hooks/navigationHooks';
import ReportContentModal from '../ProfileReportModal';
import {images} from 'resources';

import styles from './styles';

const ProfileProfileHeader = ({
    user,
    isCurrentUser,
    personaVoice,
    navigation,
}) => {
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [progressIndicator, setProgressIndicator] = useState('');
    const {
        current: {user: currentUser},
        personaMap,
    } = useContext(GlobalStateRefContext);
    const profileModalContextRef = useContext(ProfileModalStateRefContext);
    const messageModalContextRef = useContext(MessageModalStateRefContext);
    const inviteContext = useContext(InviteStateContext);

    // ------------
    const navToDMChat = useNavToDMChat(navigation);

    // ------------
    const entityID = user?.pid || user?.id;
    const entityType = personaVoice ? 'project' : 'user';

    // ------------
    const roles = user?.profile?.roles || []; // TODO: establish field
    const showInteractionMenu = !isCurrentUser;
    const showLocalTime = true; // TODO: user has no timezone field yet
    const showRoles = roles.length > 0;

    const toggleShowDepositModal = useCallback(() => {
        setShowDepositModal(!showDepositModal);
    }, [showDepositModal]);

    const chooseAndUploadPhoto = useCallback(
        ({title, subtitle = null, field, quality = PROFILE_IMAGE_QUALITY}) => {
            const uploadPhoto = async (asset, field) => {
                const file = {
                    ...asset,
                    uri: asset.uri,
                    name: asset.fileName,
                    type: 'image/jpeg',
                };

                const imgUrl = await uploadMediaToS3(
                    file,
                    setProgressIndicator,
                );

                await firestore()
                    .collection('users')
                    .doc(user.id)
                    .set({[field]: imgUrl}, {merge: true})
                    .catch(err =>
                        error(`${field} img update failed: ${err.toString()}`),
                    );
            };

            const callback = ({assets, didCancel, errorCode, errorMessage}) => {
                if (assets) {
                    uploadPhoto(assets[0], field);
                }

                if (didCancel) {
                    console.log(
                        '[chooseAndUploadPhoto] didCancel',
                        title,
                        field,
                    );
                }

                if (errorCode) {
                    console.log(
                        '[chooseAndUploadPhoto] error',
                        errorMessage,
                        errorCode,
                    );
                }
            };

            Alert.alert(title, subtitle, [
                {
                    text: 'Select a photo',
                    onPress: async () =>
                        launchImageLibrary(
                            {mediaType: 'photo', quality: quality},
                            callback,
                        ),
                },
                {
                    text: 'Take a photo',
                    onPress: () =>
                        launchCamera(
                            {
                                mediaType: 'photo',
                                quality: quality,
                                saveToPhotos: true,
                            },
                            callback,
                        ),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]);
        },
        [],
    );

    const onMessage = useCallback(async () => {
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
            {title: 'DM (3)', text: 'DM'},
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

    // TODO
    const onCall = useCallback(() => {
        alert('ring, ring...');
    }, []);

    const onViewAllAssets = useCallback(() => {
        navigation.navigate('ProfileWallet', {});
    }, []);

    const onWithdraw = useCallback(() => {
        alert('Coming soon!');
    }, []);

    const onDeposit = useCallback(() => {
        toggleShowDepositModal();
    }, []);

    // TODO
    const onFollow = useCallback(() => {
        alert('follow');
    }, []);

    const [showReportModal, setShowReportModal] = useState(false);
    const onReport = useCallback(() => {
        setShowReportModal(true);
    }, []);

    useEffect(() => {
        console.log('showReportModal', showReportModal);
    }, [showReportModal]);

    const onEditProfile = () => {
        profileModalContextRef.current.csetState({showToggle: false});
        profileModalContextRef.current.closeRightDrawer &&
            profileModalContextRef.current.closeRightDrawer();
        navigation.navigate('Account');
    };

    const onBookmarks = () => {
        profileModalContextRef.current.csetState({showToggle: false});
        profileModalContextRef.current.closeRightDrawer &&
            profileModalContextRef.current.closeRightDrawer();
        navigation.navigate('Bookmarks');
    };

    let walletBalance = user?.walletBalance || {};
    if (personaVoice) {
        walletBalance =
            personaMap && personaMap[user?.pid]?.walletBalance
                ? personaMap[user?.pid]?.walletBalance
                : {nft: 0, usdc: 0, eth: 0, cc: 0};
    }

    const localtimeString = timestampToTime(firestore.Timestamp.now().seconds); // TODO: field required
    const roleHeaderText = isCurrentUser ? 'My roles' : 'Roles';
    const nftHeaderText = isCurrentUser
        ? 'My NFTs'
        : `NFTs of ${user.userName}`;

    return (
        <>
            <View style={styles.container}>
                {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
                {showLocalTime && (
                    <Text style={styles.localtime}>
                        Local time {localtimeString}
                    </Text>
                )}

                {showInteractionMenu && (
                    <View style={styles.interactionContainer}>
                        <TouchableOpacity
                            style={styles.interactionSection}
                            onPress={onMessage}>
                            <FastImage
                                source={images.profileMessage}
                                style={{
                                    width: 17.5,
                                    height: 16.25,
                                    marginBottom: 3,
                                }}
                            />
                            <Text style={styles.interactionText}>Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.interactionSection}
                            onPress={onCall}>
                            <FastImage
                                source={images.profileCall}
                                style={styles.interactionIconCall}
                            />
                            <Text style={styles.interactionText}>Call now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.interactionSection}
                            onPress={onDeposit}>
                            <FastImage
                                source={images.profileDeposit}
                                style={styles.interactionIconDeposit}
                            />
                            <Text style={styles.interactionText}>Deposit</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.contentContainer}>
                    {isCurrentUser && (
                        <View style={styles.smallContainer}>
                            <View style={styles.smallInnerTopContainer}>
                                <Text style={styles.smallTotalBalanceText}>
                                    <WalletBalance wallet={walletBalance} />
                                </Text>
                                <Text style={styles.smallSpacerText}>•</Text>
                                <Text
                                    style={styles.smallViewAllAssetsText}
                                    onPress={onViewAllAssets}>
                                    View All Assets
                                </Text>
                            </View>
                            <View style={styles.smallInnerBottomContainer}>
                                <TouchableOpacity
                                    onPress={onDeposit}
                                    style={styles.smallActionButton}>
                                    <Text style={styles.smallActionButtonText}>
                                        Deposit
                                    </Text>
                                </TouchableOpacity>
                                {1 === 1 && (
                                    <TouchableOpacity
                                        onPress={onWithdraw}
                                        style={[
                                            styles.smallActionButton,
                                            styles.smallActionButtonWithdraw,
                                        ]}>
                                        <Text
                                            style={
                                                styles.smallActionButtonText
                                            }>
                                            Withdraw
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    {showRoles ? (
                        <View style={styles.contentContainerRoles}>
                            <Text style={styles.contentContainerHeaderText}>
                                {roleHeaderText}
                            </Text>

                            <View style={styles.contentContainerRolePills}>
                                {roles?.map(role => (
                                    <View
                                        style={[
                                            styles.rolePill,
                                            styles[`rolePill${role}`],
                                        ]}>
                                        <Text style={styles.rolePillText}>
                                            {role}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}
                    <View style={styles.contentContainerNFTs}>
                        <Text style={styles.contentContainerHeaderText}>
                            {nftHeaderText}
                        </Text>
                    </View>
                </View>
            </View>
            <DepositModal
                entityID={entityID}
                entityType={entityType}
                toggleShowDepositModal={toggleShowDepositModal}
                showDepositModal={showDepositModal}
            />
        </>
    );
};

export default ProfileProfileHeader;
