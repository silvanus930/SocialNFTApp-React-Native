/*
  Deprecated in favor of `src/components/ProfileScreen/components/ProfileHeader`

  keeping this file around for a bit in case we need to reference anything left in it
*/

// import React, {useEffect, useState} from 'react';
// import {ActivityIndicator, View, Text, StyleSheet, Alert} from 'react-native';
// import {TouchableOpacity} from 'react-native-gesture-handler';
// import {GlobalStateRefContext} from 'state/GlobalStateRef';
// import images from 'resources/images';
// import colors from 'resources/colors';
// import FastImage from 'react-native-fast-image';
// import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
// import {PROFILE_IMAGE_QUALITY} from 'utils/media/compression';
// import {uploadMediaToS3} from 'utils/s3/helpers';
// import firestore from '@react-native-firebase/firestore';
// import CameraIcon from './CameraIcon';
//
// import {clog, cwarn, LOG_DEBUG, WARN_DEBUG} from 'utils/log';
// import getResizedImageUrl from 'utils/media/resize';
// const CUSTOM_LOG_WARN_HEADER = '!! components/PostComments';
// const log = (...args) => LOG_DEBUG && clog(CUSTOM_LOG_WARN_HEADER, ...args);
// const warn = (...args) => WARN_DEBUG && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
// const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);
//
// export default function ProfileHeader({user, isCurrentUser}) {
//     const [response, setResponse] = useState(null);
//
//     const chooseProfilePhoto = () => {
//         Alert.alert('Edit profile', '', [
//             {
//                 text: 'Select a photo',
//                 onPress: async () =>
//                     launchImageLibrary(
//                         {mediaType: 'photo', quality: PROFILE_IMAGE_QUALITY},
//                         setResponse,
//                     ),
//             },
//             {
//                 text: 'Take a photo',
//                 onPress: () =>
//                     launchCamera(
//                         {
//                             mediaType: 'photo',
//                             quality: PROFILE_IMAGE_QUALITY,
//                             saveToPhotos: true,
//                         },
//                         setResponse,
//                     ),
//             },
//             {
//                 text: 'Cancel',
//                 style: 'cancel',
//             },
//         ]);
//     };
//
//     const [progressIndicator, setProgressIndicator] = React.useState('');
//
//     // Upload to S3
//     useEffect(() => {
//         (async function upload() {
//             if (response !== null && response.assets.length) {
//                 const file = {
//                     ...response.assets[0],
//                     uri: response.assets[0].uri,
//                     name: response.assets[0].fileName,
//                     type: 'image/jpeg',
//                 };
//                 const imgUrl = await uploadMediaToS3(
//                     file,
//                     setProgressIndicator,
//                 );
//
//                 await firestore()
//                     .collection('users')
//                     .doc(user.id)
//                     .set({profileImgUrl: imgUrl}, {merge: true})
//                     .catch(err =>
//                         error('Profile img update failed: ', err.toString()),
//                     );
//             }
//         })();
//     }, [response]);
//     const {
//         current: {userMap},
//     } = React.useContext(GlobalStateRefContext);
//
//     const isUser = Object.keys(userMap).includes(user.id);
//
//     return (
//         <View
//             style={{...Styles.container, borderColor: 'blue', borderWidth: 0}}>
//             {progressIndicator === 'busy' && (
//                 <View style={Styles.loadingIndicator}>
//                     <ActivityIndicator size="large" color={colors.text} />
//                 </View>
//             )}
//             <TouchableOpacity
//                 disabled={!isCurrentUser}
//                 style={{
//                     flex: 1,
//                     paddingRight: 5,
//                     zIndex: 99999999,
//                     elevation: 99999999,
//                 }}
//                 onPress={chooseProfilePhoto}>
//                 {isCurrentUser && (
//                     <CameraIcon
//                         containerStyle={{
//                             marginTop: 100,
//                             marginStart: 135,
//                             elevation: 220000,
//                         }}
//                         onPress={chooseProfilePhoto}
//                     />
//                 )}
//                 <FastImage
//                     source={{
//                         uri: user.profileImgUrl
//                             ? getResizedImageUrl({
//                                   origUrl:
//                                       user.profileImgUrl ||
//                                       images.userDefaultProfileUrl,
//                                   height: Styles.profilePicture.height,
//                                   width: Styles.profilePicture.width,
//                               })
//                             : isUser
//                             ? images.userDefaultProfileUrl
//                             : images.personaDefaultProfileUrl,
//                     }}
//                     style={Styles.profilePicture}
//                 />
//             </TouchableOpacity>
//         </View>
//     );
// }
//
// const Styles = StyleSheet.create({
//     loadingIndicator: {
//         position: 'absolute',
//         left: 75,
//         top: 22,
//         zIndex: 99,
//         elevation: 99,
//         opacity: 0.8,
//         marginTop: 30,
//         marginBottom: 40,
//     },
//     container: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 25,
//     },
//     profilePicture: {
//         height: 145,
//         width: 145,
//         borderRadius: 8,
//         marginLeft: 20,
//     },
//     numberContainer: {
//         color: 'white',
//         fontWeight: 'bold',
//         alignSelf: 'center',
//         fontSize: 15,
//     },
//     container2: {
//         flex: 1,
//         flexDirection: 'row',
//         alignSelf: 'center',
//         marginEnd: 20,
//     },
//     text: {
//         color: 'white',
//         alignSelf: 'center',
//     },
//     container3: {
//         flexDirection: 'column',
//         flex: 1,
//         justifyContent: 'space-between',
//     },
// });
