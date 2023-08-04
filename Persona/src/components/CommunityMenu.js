import _ from 'lodash';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export function useLeaveCommunity() {
    return personaId => {
        const myUserID = auth().currentUser.uid;
        const homeStateDocRef = firestore()
            .collection('users')
            .doc(myUserID)
            .collection('live')
            .doc('homePersonaState');

        const batch = firestore().batch();
        batch.update(homeStateDocRef, {
            [personaId]: firestore.FieldValue.delete(),
        });
        batch.set(
            firestore().collection('personas').doc(personaId),
            {communityMembers: firestore.FieldValue.arrayRemove(myUserID)},
            {merge: true},
        );
        batch.set(
            firestore().collection('personaCaching').doc(personaId),
            {communityMembers: firestore.FieldValue.arrayRemove(myUserID)},
            {merge: true},
        );
        batch.commit();
    };
}

export function useBecomeAuthor({personaID}) {
    const myUserID = auth().currentUser.uid;

    return () => {
        const personaDocRef = firestore().collection('personas').doc(personaID);
        firestore().runTransaction(transaction => {
            return transaction.get(personaDocRef).then(personaDoc => {
                if ((personaDoc.get('authors') || []).includes(myUserID)) {
                    return;
                }
                transaction.set(
                    personaDocRef,
                    {
                        authors: firestore.FieldValue.arrayUnion(myUserID),
                        communityMembers:
                            firestore.FieldValue.arrayRemove(myUserID),
                        invitedUsers: {[myUserID]: {accepted: true}},
                    },
                    {merge: true},
                );
                transaction.set(
                    firestore().collection('personaCaching').doc(personaID),
                    {
                        authors: firestore.FieldValue.arrayUnion(myUserID),
                        communityMembers:
                            firestore.FieldValue.arrayRemove(myUserID),
                        invitedUsers: {[myUserID]: {accepted: true}},
                    },
                    {merge: true},
                );
                transaction.set(
                    firestore()
                        .collection('users')
                        .doc(myUserID)
                        .collection('live')
                        .doc('homePersonaState'),
                    {
                        [personaID]: {
                            communityMember: firestore.FieldValue.delete(),
                        },
                    },
                    {merge: true},
                );
            });
        });
    };
}
