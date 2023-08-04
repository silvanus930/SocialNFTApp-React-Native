import firestore from '@react-native-firebase/firestore';

export function getTimeStamp() {
    return firestore.Timestamp.now();
}
export function getServerTimestamp() {
    return firestore.FieldValue.serverTimestamp();
}
