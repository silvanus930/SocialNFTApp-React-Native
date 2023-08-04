import firestore from '@react-native-firebase/firestore';
import uniq from 'lodash.uniq';

const onError = err => {
    throw new Error('InitUserState.onError->', JSON.stringify(err));
};

export function addPersonaListener(csetState, user) {
    return (
        firestore()
            .collection('personas')
            /*.where('deleted', '==', false) // made sure to backfill before setting this*/
            .onSnapshot(async personasQuerySnapshot => {
                const personaList = [];

                const newPersonaMap = Object.fromEntries(
                    personasQuerySnapshot.docs.map(doc => {
                        doc.data().authors?.includes(user.uid) &&
                            personaList.push({
                                ...doc.data(),
                                pid: doc.id,
                                personaID: doc.id,
                            });
                        return [
                            doc.id,
                            {
                                ...doc.data(),
                                pid: doc.id,
                                personaID: doc.id,
                                key: doc.id,
                            },
                        ];
                    }),
                );

                csetState({
                    personaMap: newPersonaMap,
                    personaList,
                });
            }, onError)
    );
}

export function addUserListListener(csetState) {
    return firestore()
        .collection('users')
        .onSnapshot(async newDefinitelyNonGlobalUserSnap => {
            const fetchUsers: any = [];

            const newUserMap = Object.fromEntries(
                newDefinitelyNonGlobalUserSnap.docs.map(userRef => {
                    fetchUsers.push({
                        ...userRef.data(),
                        uid: userRef.id,
                        id: userRef.id,
                    });

                    return [
                        userRef.id,
                        {
                            ...userRef.data(),
                            id: userRef.id,
                            uid: userRef.id,
                        },
                    ];
                }),
            );
            csetState({
                userMap: newUserMap,
                userList: fetchUsers,
            });
        }, onError);
}

export function addCommunityListener(setCommunityMap) {
    return firestore()
        .collection('communities')
        .where('deleted', '==', false)
        .onSnapshot(communitiesQuerySnapshot => {
            const newCommunityMap = Object.fromEntries(
                communitiesQuerySnapshot?.docs?.map(doc => [
                    doc.id,
                    {
                        ...doc.data(),
                        cid: doc.id,
                        members: uniq(doc.data().members),
                    },
                ]) ?? [],
            );

            setCommunityMap(newCommunityMap);
        });
}
