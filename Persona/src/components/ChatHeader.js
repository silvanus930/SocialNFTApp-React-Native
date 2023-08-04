import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import Post from 'components/Post';
import images from 'resources/images';
import palette from 'resources/palette';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';

import auth from '@react-native-firebase/auth';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import getResizedImageUrl from 'utils/media/resize';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';

export default function ChatHeader({
    navigation,
    personaName,
    personaProfileImgUrl,
    personaID,
    chatContext,
}) {
    const myUserID = auth().currentUser.uid;
    const {
        current: {userMap},
    } = React.useContext(GlobalStateRefContext);

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const navToProfile = React.useCallback(
        userID => {
            profileModalContextRef.current.csetState({
                userID: userID,
                showToggle: true,
            });
        },
        [profileModalContextRef],
    );
    /*
  const navToProfile = useDebounce(
    userID => {
      navigation.push('Profile', {userID: userID});
    },
    [navigation],
  );*/
    const maybeDMUser =
        userMap[chatContext.attendees.filter(u => u?.id !== myUserID)[0]?.id];
    const nullComponent = React.useCallback(() => <></>, []);

    const headerTitle = React.useCallback(
        <View style={palette.header.profileImgContainer}>
            <TouchableOpacity
                onPress={() => navToProfile(maybeDMUser?.id)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                <FastImage
                    source={{
                        uri: getResizedImageUrl({
                            origUrl:
                                maybeDMUser?.profileImgUrl ||
                                images.userDefaultProfileUrl,
                            width: 25,
                            height: 25,
                        }),
                    }}
                    style={{
                        width: 25,
                        height: 25,
                        borderRadius: 25,
                    }}
                />
                <Text style={{...palette.header.text, marginLeft: 8}}>
                    {maybeDMUser?.userName || ''}
                </Text>
            </TouchableOpacity>
        </View>,
        [maybeDMUser?.userName, navToProfile, maybeDMUser],
    );
    React.useEffect(() => {
        const setTitle = () => {
            navigation.setOptions({
                headerTitle: headerTitle,
                headerRight: nullComponent, // empty element for flexbox scaling
            });
        };

        setTitle();
    }, [navigation, chatContext, nullComponent]);

    return (
        <View>
            {personaID && personaID !== SYSTEM_DM_PERSONA_ID ? (
                <Post
                    small={true}
                    post={chatContext}
                    navigation={navigation}
                    postKey={chatContext.postID}
                    personaName={personaName}
                    personaKey={personaID}
                    personaProfileImgUrl={personaProfileImgUrl}
                    showPostActions={false}
                    showBottomTimeline={false}
                    showSeperator={false}
                />
            ) : null}
        </View>
    );
}
