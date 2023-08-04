import React, {useContext, useState} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {BlurView} from '@react-native-community/blur';

import * as RootNavigator from 'navigators/RootNavigator';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {ACTIVITY_FONT_SIZE} from 'components/ActivityConstants';
import {MEMBER_ROLE} from 'utils/constants';
import {useNavToPersona, useNavToCommunity} from 'hooks/navigationHooks';

import colors from 'resources/colors';
import baseText from 'resources/text';
import fonts from 'resources/fonts';

import {getServerTimestamp} from 'actions/constants';

import InviteTimestamp from '../InviteTimestamp';
import EntityDisplay from '../EntityDisplay';

const InviteItem = ({invite, entity, invitedByUser}) => {
    const [loading, setLoading] = useState(false);

    const navigation = useNavigation();
    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const navToCommunity = useNavToCommunity(
        RootNavigator.navigationRef.current,
    );
    const navToPersona = useNavToPersona(RootNavigator.navigationRef.current);

    const handleAcceptInvitation = async () => {
        setLoading(true);

        const acceptInviteForExistingUser =
            functions().httpsCallable(
                'acceptInviteForExistingUser',
            );
        const result = await acceptInviteForExistingUser({
            userID: auth().currentUser?.uid,
            inviteID: invite.id,
        });

        const resultCode = result?.data?.result;

        try {
            collectionName = isPersona ? 'personas' : 'communities';

            const memberFieldName = isPersona ? 'authors' : 'members';

            entityID = (isPersona ? entity?.pid : entity?.cid) ?? entity?.id;

            const batch = firestore().batch();

            // Update the collection + persona
            // if isPersona, then this is updating persona.
            // if not, this is updating community

            const entityRef = firestore()
                .collection(collectionName)
                .doc(entityID);

            // old system, add uid to member list
            batch.update(entityRef, {
                [memberFieldName]: firestore.FieldValue.arrayUnion(
                    auth().currentUser.uid,
                ),
            });

            // new system, add role to memberRoles list
            // todo decide if we need this. For now removing.
            // if(role) {
            //     batch.update(entityRef, {
            //         memberRoles: {
            //             [auth().currentUser.uid]: firestore.FieldValue.arrayUnion( { ...role} ),
            //         }
            //     });
            // }

            let communityRef;

            if (isPersona) {
                // invited to persona, need to add to community as well
                communityRef =
                    typeof invite?.destination?.communityRef === 'string'
                        ? firestore().doc(invite.destination.communityRef)
                        : invite.destination.communityRef;

                // old system
                batch.update(communityRef, {
                    members: firestore.FieldValue.arrayUnion(
                        auth().currentUser.uid,
                    ),
                });

                // new system
                // todo decide if we need this. For now removing.
                // if(role) {
                //     batch.update(communityRef, {
                //         memberRoles: {
                //             [auth().currentUser.uid]: firestore.FieldValue.arrayUnion( {...role} ),
                //         }
                //     });
                // }
            }

            batch.update(invite.ref, {
                accepted: true,
                acceptedAt: getServerTimestamp(),
            });

            if (role) {
                // add this role to the array of roles
                const userRef = firestore()
                    .collection('users')
                    .doc(auth().currentUser.uid);

                batch.update(userRef, {
                    roles: firestore.FieldValue.arrayUnion({
                        ref: entityRef,
                        ...role,
                    }),
                });

                if (isPersona) {
                    batch.update(userRef, {
                        roles: firestore.FieldValue.arrayUnion({
                            ref: communityRef,
                            ...MEMBER_ROLE,
                        }),
                    });
                }
            }

            await batch.commit();

            Alert.alert(`Successfully joined ${entity?.name}`, '', [
                {
                    text: 'OK',
                    onPress: () => {
                        handleNavigate(collectionName, entityID);
                    },
                },
            ]);
        } catch (err) {
            console.log('error: ', err);
            Alert.alert(
                `Something went wrong joining ${entity?.name}. Please try again.`,
            );
        }

        setLoading(false);
    };

    const handleNavigate = (collectionName, entityID) => {
        if (collectionName === 'personas') {
            navigateToPersona(entityID);
        } else {
            navigateToCommunity(entityID);
        }
    };

    const navigateToPersona = entityID => {
        navToPersona(entityID);
        profileModalContextRef.current?.closeLeftDrawer();
        navigation.navigate('Persona');
    };

    const navigateToCommunity = entityID => {
        navToCommunity(entityID);
        profileModalContextRef.current?.closeLeftDrawer();
        navigation.navigate('Persona');
    };

    const handleDeclineInvitation = async () => {
        await invite.ref.update({
            declined: true,
            deleted: true,
            deletedAt: getServerTimestamp(),
        });
    };

    if (Platform.OS === 'android') {
        return (
            <View
                blurType={'chromeMaterialDark'}
                blurRadius={5}
                blurAmount={5}
                reducedTransparencyFallbackColor={colors.mediaPostBackground}
                style={{
                    flexDirection: 'column',
                    borderColor: colors.darkSeperator,
                    borderBottomWidth: 0,
                    marginLeft: 10,
                    paddingLeft: 5,
                    paddingRight: 5,
                    marginRight: 10,
                    paddingTop: 8,
                    paddingBottom: 10,
                    borderWidth: 0,
                    borderRadius: 8,
                    marginBottom: 10,
                }}>
                <View>
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                        }}>
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                flex: 0.15,
                            }}>
                            <EntityDisplay entity={entity} />
                        </View>

                        {/* Event text */}
                        <View
                            style={{
                                borderWidth: 0,
                                borderColor: 'orange',
                                flex: 0.8,
                                justifyContent: 'flex-start',
                                paddingLeft: 10,
                                paddingRight: 5,
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flex: 1,
                                    marginBottom: 15,
                                }}>
                                <Text
                                    style={{
                                        ...baseText,
                                        fontFamily: fonts.system,
                                        color: colors.text,
                                        fontSize: ACTIVITY_FONT_SIZE,
                                    }}>
                                    {invitedByUser?.userName} invited you to
                                    join{' '}
                                    <Text style={{fontWeight: 'bold'}}>
                                        {entity?.name}
                                    </Text>
                                </Text>
                            </View>
                            {loading ? (
                                <View>
                                    <ActivityIndicator
                                        style={{marginBottom: 19}}
                                        size="small"
                                    />
                                </View>
                            ) : (
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 10,
                                    }}>
                                    <TouchableOpacity
                                        onPress={handleAcceptInvitation}
                                        style={{
                                            paddingLeft: 6,
                                            paddingRight: 6,
                                            paddingTop: 3,
                                            paddingBottom: 3,
                                            borderRadius: 6,
                                            borderWidth: 1,
                                            borderColor: colors.actionText,
                                            marginRight: 15,
                                        }}>
                                        <Text
                                            style={{
                                                ...baseText,
                                                color: colors.actionText,
                                            }}>
                                            Accept
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{
                                            paddingLeft: 6,
                                            paddingRight: 6,
                                            paddingTop: 3,
                                            paddingBottom: 3,
                                            borderRadius: 6,
                                            borderWidth: 1,
                                            borderColor: colors.textFaded3,
                                        }}
                                        onPress={handleDeclineInvitation}>
                                        <Text
                                            style={{
                                                ...baseText,
                                                color: colors.textFaded3,
                                            }}>
                                            Decline
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <View
                            style={{
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                flex: 0.1,
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginBottom: 1,
                                    justifyContent: 'flex-start',
                                }}>
                                <InviteTimestamp invite={invite} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <BlurView
            blurType={'chromeMaterialDark'}
            blurRadius={5}
            blurAmount={8}
            reducedTransparencyFallbackColor={colors.mediaPostBackground}
            style={{
                flexDirection: 'column',
                borderColor: colors.darkSeperator,
                borderBottomWidth: 0,
                marginLeft: 10,
                paddingLeft: 5,
                paddingRight: 5,
                marginRight: 10,
                paddingTop: 8,
                paddingBottom: 10,
                borderWidth: 0,
                borderRadius: 8,
                marginBottom: 10,
            }}>
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                    }}>
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 0.15,
                        }}>
                        <EntityDisplay entity={entity} />
                    </View>

                    {/* Event text */}
                    <View
                        style={{
                            borderWidth: 0,
                            borderColor: 'orange',
                            flex: 0.8,
                            justifyContent: 'flex-start',
                            paddingLeft: 10,
                            paddingRight: 5,
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                flex: 1,
                                marginBottom: 15,
                            }}>
                            <Text
                                style={{
                                    ...baseText,
                                    fontFamily: fonts.system,
                                    color: colors.text,
                                    fontSize: ACTIVITY_FONT_SIZE,
                                }}>
                                {invitedByUser?.userName} invited you to join{' '}
                                <Text style={{fontWeight: 'bold'}}>
                                    {entity?.name}
                                </Text>
                                {invite?.destination?.role?.title && (
                                    <Text>
                                        {''} with the {invite?.destination?.role?.title} role
                                    </Text>
                                )}
                            </Text>
                        </View>
                        {loading ? (
                            <View>
                                <ActivityIndicator
                                    style={{marginBottom: 19}}
                                    size="small"
                                />
                            </View>
                        ) : (
                            <View
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 10,
                                }}>
                                <TouchableOpacity
                                    onPress={handleAcceptInvitation}
                                    style={{
                                        paddingLeft: 6,
                                        paddingRight: 6,
                                        paddingTop: 3,
                                        paddingBottom: 3,
                                        borderRadius: 6,
                                        borderWidth: 1,
                                        borderColor: colors.actionText,
                                        marginRight: 15,
                                    }}>
                                    <Text
                                        style={{
                                            ...baseText,
                                            color: colors.actionText,
                                        }}>
                                        Accept
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        paddingLeft: 6,
                                        paddingRight: 6,
                                        paddingTop: 3,
                                        paddingBottom: 3,
                                        borderRadius: 6,
                                        borderWidth: 1,
                                        borderColor: colors.textFaded3,
                                    }}
                                    onPress={handleDeclineInvitation}>
                                    <Text
                                        style={{
                                            ...baseText,
                                            color: colors.textFaded3,
                                        }}>
                                        Decline
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <View
                        style={{
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            flex: 0.1,
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                marginBottom: 1,
                                justifyContent: 'flex-start',
                            }}>
                            <InviteTimestamp invite={invite} />
                        </View>
                    </View>
                </View>
            </View>
        </BlurView>
    );
}

export default InviteItem;
