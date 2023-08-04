import React, {useContext, useCallback, useMemo} from 'react';
import {Text, TouchableOpacity, View, FlatList, Alert} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import FastImage from 'react-native-fast-image';

import {PersonaStateContext} from 'state/PersonaState';
import {InviteModalStateRefContext} from 'state/InviteModalStateRef';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

import PaddedLongButton from './components/PaddedLongButton';

import {images} from 'resources';
import getResizedImageUrl from 'utils/media/resize';

import styles from './styles';

const CommunityPreview = ({persona}) => {
    const personaContext = useContext(PersonaStateContext);
    const communityContext = useContext(CommunityStateContext);
    const personaID = personaContext?.persona?.pid;
    const communityID = communityContext.currentCommunity;
    const communityContextRef = useContext(CommunityStateRefContext);
    const {
        current: {userMap, personaMap, setTogglePresence},
    } = useContext(GlobalStateRefContext);

    let communityMap = communityContextRef?.current?.communityMap;
    let community = persona;

    const communityList = personaID
        ? community?.authors
              ?.map(userID => userMap[userID])
              .filter(u => u?.human)
        : community?.members
              ?.map(userID => userMap[userID])
              .filter(u => u?.human);

    const hasAuth = personaID
        ? persona?.authors?.includes(auth().currentUser.uid)
        : communityMap[communityID]?.members?.includes(auth().currentUser.uid);

    const SIZE = 30;
    const NUM = communityList?.length === 6 ? 6 : 5;
    const renderItem = ({item}) => {
        return (
            <View style={styles.renderItemContainer}>
                <FastImage
                    source={{
                        uri: item?.profileImgUrl
                            ? getResizedImageUrl({
                                  origUrl: item.profileImgUrl,
                                  width: SIZE,
                                  height: SIZE,
                              })
                            : images.userDefaultProfileUrl,
                    }}
                    style={styles.renderItemImage}
                />
            </View>
        );
    };

    const inviteModalContextRef = useContext(InviteModalStateRefContext);
    let currentCommunity = communityContextRef?.current.currentCommunity;

    const openCommunity = useCallback(setTogglePresence, [setTogglePresence]);

    const openModal = useCallback(() => {
        inviteModalContextRef.current.csetState({
            showToggle: true,
            authors: community
                ? communityMap[currentCommunity].members
                : personaMap[personaID].authors,
            persona: community
                ? communityMap[currentCommunity]
                : personaMap[personaID],
            usePersona: true,
        });
    }, [
        inviteModalContextRef,
        community,
        communityMap,
        currentCommunity,
        personaMap,
        personaID,
    ]);

    const additionalMembersCount = communityList
        ? communityList.length - NUM
        : 0;

    const docPath = personaID
        ? `personas/${personaID}`
        : `communities/${communityID}`;

    const isOpened = persona?.open;
    const isMember = hasAuth;

    const joinAsMember = useCallback(() => {
        Alert.alert('Do you want join?', '', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'OK',
                onPress: () => {
                    const fieldName = personaID ? 'authors' : 'members';
                    if (personaID) {
                        personaContext.addPersonaAuthor(auth().currentUser.uid);
                    } else {
                    }
                    firestore()
                        .doc(docPath)
                        .set(
                            {
                                [fieldName]: firestore.FieldValue.arrayUnion(
                                    auth().currentUser.uid,
                                ),
                            },
                            {merge: true},
                        );

                    // add member role to users table
                    const batch = firestore().batch();
                    const userRef = firestore()
                        .collection('users')
                        .doc(auth().currentUser.uid);

                    const destinationRef = firestore().doc(docPath);
                    let role = {};

                    console.log('personaID', personaID);
                    if (personaID) {
                        destinationRef.get().then(doc => {
                            if (doc.exists) {
                                const communityRef = firestore().doc(
                                    `communities/${doc.data().communityID}`,
                                );

                                const roleCollection = communityRef
                                    .collection('roles')
                                    .doc('each')
                                    .collection('role');

                                roleCollection
                                    .where('title', '==', 'member')
                                    .get()
                                    .then(roleSnap => {
                                        role = roleSnap.docs[0].data();
                                        const roleRef = roleCollection.doc(
                                            roleSnap.docs[0].id,
                                        );
                                        // update community role for user (will update persona role below)
                                        batch.update(userRef, {
                                            roles: firestore.FieldValue.arrayUnion(
                                                {
                                                    ref: communityRef,
                                                    ...role,
                                                    roleRef,
                                                },
                                            ),
                                        });
                                        // persona ref for user:
                                        batch.update(userRef, {
                                            roles: firestore.FieldValue.arrayUnion(
                                                {
                                                    ref: destinationRef,
                                                    ...role,
                                                    roleRef,
                                                },
                                            ),
                                        });
                                        batch.commit().then(() => {
                                            console.log(
                                                'SUCCESS BATCH COMMIT joining this persona',
                                            );
                                        });
                                    });
                            }
                        });
                    } else {
                        // need to get role to update community role for user:
                        const roleCollection = destinationRef
                            .collection('roles')
                            .doc('each')
                            .collection('role');

                        roleCollection
                            .where('title', '==', 'member')
                            .get()
                            .then(roleSnap => {
                                role = roleSnap.docs[0].data();
                                const roleRef = roleCollection.doc(
                                    roleSnap.docs[0].id,
                                );
                                // update community role for user
                                batch.update(userRef, {
                                    roles: firestore.FieldValue.arrayUnion({
                                        ref: destinationRef,
                                        ...role,
                                        roleRef,
                                    }),
                                });

                                batch.commit().then(() => {
                                    console.log(
                                        'SUCCESS BATCH COMMIT joining this community',
                                    );
                                });
                            });
                    }
                },
            },
        ]);
    }, [personaID, docPath, personaContext]);

    const hanglePaddedLongButtonPress = useCallback(() => {
        if (isMember) {
            openModal();
        } else if (isOpened) {
            joinAsMember();
        } else {
            openCommunity();
        }
    }, [isMember, isOpened, joinAsMember, openCommunity, openModal]);

    const paddedButtonLabel = isMember
        ? '+ Invite'
        : isOpened
        ? 'Join'
        : 'members';

    return useMemo(
        () => (
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity onPress={openCommunity}>
                    <FlatList
                        horizontal
                        data={communityList?.slice(0, NUM) || []}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.contentContainerStyle}
                        bounces={false}
                        ListFooterComponent={
                            <View style={styles.footerContainer}>
                                {communityList?.length > NUM && (
                                    <View style={styles.footerSubContainer}>
                                        <Text style={styles.footerText}>
                                            +{additionalMembersCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        }
                    />
                </TouchableOpacity>
                <View>
                    <PaddedLongButton
                        style={styles.button}
                        onPress={hanglePaddedLongButtonPress}
                        label={paddedButtonLabel}
                    />
                </View>
            </View>
        ),
        [hasAuth, persona?.open, persona?.members?.length, persona?.authors?.length],
    );
};

export default CommunityPreview;
