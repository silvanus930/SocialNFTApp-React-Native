import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export function getPersonaProfile(personaID: string) {
    return firestore()
        .collection('personas')
        .doc(personaID)
        .collection('profile')
        .doc(auth().currentUser.uid);
}

export function updateProfileName(personaID: string, name: string) {
    return firestore()
        .collection('personas')
        .doc(personaID)
        .set({name}, {merge: true});
}

export function updateProfileContext(personaContext) {
    return firestore()
        .doc(`users/${auth().currentUser.uid}/live/voice`)
        .set({personaContext}, {merge: true});
}
export function updateCommunityContext(community) {
    return firestore()
        .doc(`users/${auth().currentUser.uid}/live/voice`)
        .set({communityID: community}, {merge: true});
}
