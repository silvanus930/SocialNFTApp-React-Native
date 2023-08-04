import React, {useContext, useEffect, useState} from 'react';
import {
    FlatList,
    View,
    ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import colors from 'resources/colors';
import {BaseText} from 'resources/text';

import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CommunityStateRefContext} from 'state/CommunityStateRef';

import {getServerTimestamp} from 'actions/constants';

import InviteItem from './components/InviteItem';

const UserInvitesScreen = ({destinationId}) => {
    const [invites, setInvites] = useState(null);
    const [loading, setLoading] = useState(true);
    const {
        current: {personaMap, userMap},
    } = useContext(GlobalStateRefContext);
    const {
        current: {communityMap},
    } = useContext(CommunityStateRefContext);

    useEffect(() => {
        async function updateLastOpenedAt() {
            await firestore()
                .collection('users')
                .doc(auth().currentUser.uid)
                .collection('live')
                .doc('invites')
                .set({lastOpenedAt: getServerTimestamp()}, {merge: true});
        }
        updateLastOpenedAt();
    }, []);

    useEffect(() => {
        if (destinationId) {
            return firestore()
                .collection('invites')
                .where('invitedUserID', '==', auth().currentUser.uid)
                .where('accepted', '==', false)
                .where('deleted', '==', false)
                .where('destination.id', '==', destinationId)
                .onSnapshot(querySnapshot => {
                    if (querySnapshot.docs.length > 0) {
                        setInvites(
                            querySnapshot.docs.map(doc => ({
                                ...doc.data(),
                                id: doc.id,
                                ref: doc.ref,
                            })),
                        );
                        console.log('setInvites', invites);
                    } else {
                        setInvites(null);
                    }
                    setLoading(false);
                });
        } else {
            return firestore()
                .collection('invites')
                .where('invitedUserID', '==', auth().currentUser.uid)
                .where('accepted', '==', false)
                .where('deleted', '==', false)
                .onSnapshot(querySnapshot => {
                    if (querySnapshot.docs.length > 0) {
                        setInvites(
                            querySnapshot.docs.map(doc => ({
                                ...doc.data(),
                                id: doc.id,
                                ref: doc.ref,
                            })),
                        );
                    } else {
                        setInvites(null);
                    }
                    setLoading(false);
                });
        }
    }, [destinationId]);

    const renderItem = item => {
        const invite = item?.item;
        const invitedByUser = userMap[invite?.invitedByUserID];
        let entity;
        if (invite?.destination?.type === 'project') {
            entity = personaMap[invite?.destination?.id];
        } else {
            entity = communityMap[invite?.destination?.id];
        }
        return (
            <InviteItem
                invite={invite}
                entity={entity}
                invitedByUser={invitedByUser}
            />
        );
    };

    return (
        <View style={{paddingTop: 50}}>
            {loading ? (
                <View style={{marginTop: 50}}>
                    <ActivityIndicator size="small" />
                </View>
            ) : invites && invites?.length > 0 ? (
                <FlatList
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    data={invites}
                />
            ) : (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                    }}>
                    <BaseText
                        style={{
                            color: colors.textFaded,
                            fontStyle: 'italic',
                            marginTop: 50,
                        }}>
                        No invites to show
                    </BaseText>
                </View>
            )}
        </View>
    );
};

export default UserInvitesScreen;