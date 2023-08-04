import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {getServerTimestamp} from './constants';

export const getUser = async userId => {
    return await firestore().collection('users').doc(userId).get();
};

export function blockUser(user: object) {
    const myUserID = auth().currentUser.uid;
    return firestore()
        .collection('users')
        .doc(myUserID)
        .collection('blockedUsers')
        .doc(user.id)
        .set(
            {
                userID: user.id,
                userName: user.userName,
                blocked: true,
                timestamp: firestore.Timestamp.now(),
            },
            {merge: true},
        );
}
