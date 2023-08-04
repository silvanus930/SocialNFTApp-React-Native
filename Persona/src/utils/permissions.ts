import {Platform} from 'react-native';
import {
    request,
    checkMultiple,
    PERMISSIONS,
    RESULTS,
    openSettings,
    check,
} from 'react-native-permissions';

export function checkAllPermissions() {
    const androidPermissions = [
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.RECORD_AUDIO,
    ];
    const iosPermissions = [
        PERMISSIONS.IOS.CAMERA,
        PERMISSIONS.IOS.CONTACTS,
        PERMISSIONS.IOS.MEDIA_LIBRARY,
        PERMISSIONS.IOS.MICROPHONE,
        PERMISSIONS.IOS.PHOTO_LIBRARY,
        //PERMISSIONS.IOS.FACE_ID,
    ];

    checkMultiple([...androidPermissions, ...iosPermissions]).then(statuses => {
        Platform.OS === 'android' &&
            console.log('ANDROID.CAMERA', statuses[PERMISSIONS.ANDROID.CAMERA]);
        Platform.OS === 'android' &&
            console.log(
                'ANDROID.WRITE_EXTERNAL_STORAGE',
                statuses[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE],
            );
        Platform.OS === 'android' &&
            console.log(
                'ANDROID.READ_EXTERNAL_STORAGE',
                statuses[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE],
            );
        Platform.OS === 'android' &&
            console.log(
                'ANDROID.RECORD_AUDIO',
                statuses[PERMISSIONS.ANDROID.RECORD_AUDIO],
            );

        Platform.OS === 'android' &&
            console.log(
                'ANDROID.RECORD_AUDIO',
                statuses[PERMISSIONS.ANDROID.RECORD_AUDIO],
            );

        Platform.OS === 'ios' &&
            console.log('Camera', statuses[PERMISSIONS.IOS.CAMERA]);
        Platform.OS === 'ios' &&
            console.log('Contacts', statuses[PERMISSIONS.IOS.CONTACTS]);
        Platform.OS === 'ios' &&
            console.log(
                'MEDIALIBRARY',
                statuses[PERMISSIONS.IOS.MEDIA_LIBRARY],
            );
        Platform.OS === 'ios' &&
            console.log(
                'PHOTOLIBRARY',
                statuses[PERMISSIONS.IOS.PHOTO_LIBRARY],
            );
        Platform.OS === 'ios' &&
            console.log('MICROPHONE', statuses[PERMISSIONS.IOS.MICROPHONE]);
        //Platform.OS === 'ios' && console.log('FACE_ID', statuses[PERMISSIONS.IOS.FACE_ID]);
    });
}
export default async function requestPermissions() {
    if (Platform.OS === 'android') {
        // ANDROID marshmellow and later needs runtime permissions, apparently?

        try {
            await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE).then(
                result => {
                    console.log(
                        'after requesting permissions:',
                        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
                        result,
                    );
                    /*

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the storage');
      } else {
        console.log('permission denied');
        return;
      }
      */
                },
            );
        } catch (err) {
            console.error((err as any).toString());
            return;
        }

        try {
            await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE).then(
                result => {
                    console.log(
                        'after requesting permissions:',
                        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
                        result,
                    );
                    /*

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the storage');
      } else {
        console.log('permission denied');
        return;
      }
      */
                },
            );
        } catch (err) {
            console.error((err as any).toString());
            return;
        }

        try {
            await request(PERMISSIONS.ANDROID.RECORD_AUDIO).then(result => {
                console.log(
                    'after requesting permissions:',
                    PERMISSIONS.ANDROID.RECORD_AUDIO,
                    result,
                );
                /*
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the camera');
        } else {
          console.log('permission denied');
          return;
        }
        */
            });
        } catch (err) {
            console.warn(err);
            return;
        }

        try {
            await request(PERMISSIONS.ANDROID.CAMERA).then(result => {
                console.log(
                    'after requesting permissions:',
                    PERMISSIONS.ANDROID.CAMERA,
                    result,
                );
                /*
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the camera');
        } else {
          console.log('permission denied');
          return;
        }
        */
            });
        } catch (err) {
            console.warn(err);
            return;
        }
    } else if (Platform.OS === 'ios') {
        try {
            await request(PERMISSIONS.IOS.CAMERA).then(result => {
                console.log(
                    'after requesting permissions:',
                    PERMISSIONS.IOS.CAMERA,
                    result,
                );
                /*
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the camera');
        } else {
          console.log('permission denied');
          return;
        }
        */
            });
        } catch (err) {
            console.warn(err);
            return;
        }

        try {
            await request(PERMISSIONS.IOS.MICROPHONE).then(result => {
                console.log(
                    'after requesting permissions:',
                    PERMISSIONS.IOS.MICROPHONE,
                    result,
                );
                /*
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the camera');
        } else {
          console.log('permission denied');
          return;
        }
        */
            });
        } catch (err) {
            console.warn(err);
            return;
        }

        try {
            await request(PERMISSIONS.IOS.PHOTO_LIBRARY).then(result => {
                console.log(
                    'after requesting permissions:',
                    PERMISSIONS.IOS.PHOTO_LIBRARY,
                    result,
                );
                /*
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the camera');
        } else {
          console.log('permission denied');
          return;
        }
        */
            });
        } catch (err) {
            console.warn(err);
            return;
        }

        try {
            await request(PERMISSIONS.IOS.MEDIA_LIBRARY).then(result => {
                console.log(
                    'after requesting permissions:',
                    PERMISSIONS.IOS.MEDIA_LIBRARY,
                    result,
                );
                /*
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the camera');
        } else {
          console.log('permission denied');
          return;
        }
        */
            });
        } catch (err) {
            console.warn(err);
            return;
        }
    }
}

export async function askContactsPermission() {
    try {
        if (Platform.OS === 'android') {
            const checkResult = await check(PERMISSIONS.ANDROID.READ_CONTACTS);

            if (checkResult === RESULTS.DENIED) {
                const requestResult = await request(
                    PERMISSIONS.ANDROID.READ_CONTACTS,
                );

                if (
                    requestResult === RESULTS.BLOCKED ||
                    requestResult === RESULTS.DENIED
                ) {
                    await openSettings();
                }
            }
        } else if (Platform.OS === 'ios') {
            const checkResult = await check(PERMISSIONS.IOS.CONTACTS);
            console.log('contact permission', checkResult);
            if (
                checkResult === RESULTS.DENIED ||
                checkResult === RESULTS.BLOCKED
            ) {
                const requestResult = await request(PERMISSIONS.IOS.CONTACTS);

                if (
                    requestResult === RESULTS.BLOCKED ||
                    requestResult === RESULTS.DENIED
                ) {
                    await openSettings();
                }
            }
        }
    } catch (error) {
        return {status: 'error', error: error};
    }

    return {status: 'success'};
}
