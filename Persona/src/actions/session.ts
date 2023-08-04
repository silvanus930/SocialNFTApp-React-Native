import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';

export const logout = async ({userID, csetState, cleanupPresence}) => {
    let deviceToken = '';
    // ORDER OF EVENTS MATTERS FOR THE LOVE OF GOD, THE GOATS MOTHER AND THE
    // NUMBER 22 DONT U DARE CHANGE THE ORDER WITHOUT KNOWING WUT U R DOIN

    csetState({
        busyAuthStateChange: false,
        personasInit: true,
        userInit: true,
    });

    try {
        deviceToken = await messaging().getToken();
    } catch (err) {
        console.log('[Logout] Can not get device token: ', err.toString());
    }

    if (deviceToken.length) {
        try {
            // Important: These two actions have to occur before sign out
            // or else we end up with zombie data
            console.log('[Logout] Device token: ', deviceToken);

            await firestore()
                .collection('users')
                .doc(userID)
                .collection('tokens')
                .doc(userID)
                .update({
                    deviceTokens: firestore.FieldValue.arrayRemove(deviceToken),
                });

            await cleanupPresence();
        } catch (err) {
            console.log('[Logout] Data cleanup failed: ', err.toString());
            alert('Data cleanup failed: ' + err.toString());
            throw new Error(err);
        }
    }

    try {
        await auth().signOut();
    } catch (err) {
        console.log('[Logout] Sign out failed: ', err.toString());
        alert('Sign out failed: ' + err.toString());
        throw new Error(err);
    }
};
