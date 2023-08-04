import React from 'react';
import {MessageModalStateRefContext} from 'state/MessageModalStateRef';
import {PersonaStateContext, vanillaPersona} from 'state/PersonaState';
import {useNavigation} from '@react-navigation/native';
import baseText from 'resources/text';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import colors from 'resources/colors';
import {timestampToDateString} from 'utils/helpers';
import {View, Text, TouchableOpacity} from 'react-native';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import images from 'resources/images';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';
import Timestamp from 'components/Timestamp';

import {GlobalStateRefContext} from 'state/GlobalStateRef';
import getResizedImageUrl from 'utils/media/resize';

import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';

export default function ChatListItem({chatSummary, navigation}) {
    const {
        current: {csetState},
    } = React.useContext(PersonaStateRefContext);
    const myUserID = auth().currentUser.uid;
    const globalRefContext = React.useContext(GlobalStateRefContext);

    const otherUsersInvolved = chatSummary.data.involved.filter(
        id => id !== myUserID,
    );
    const userToDMid = otherUsersInvolved[0];

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const navToProfile = React.useCallback(() => {
        profileModalContextRef.current.csetState({
            userID: userToDMid,
            showToggle: true,
        });
    }, [userToDMid, profileModalContextRef]);

    /*
  const navToProfile = useNavPushDebounce(
    'Profile',
    {
      userID: userToDMid,
    },
    [userToDMid],
  );*/

    if (otherUsersInvolved.length !== 1) {
        return (
            <Text
                style={{
                    ...baseText,
                    color: 'red',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    textAlign: 'center',
                }}>
                An error occured, please report
            </Text>
        );
    }

    const messageModalContextRef = React.useContext(
        MessageModalStateRefContext,
    );
    const userToDM = globalRefContext.current.userMap[userToDMid];
    const navToChat = () => {
        profileModalContextRef?.current.closeLeftDrawer &&
            profileModalContextRef?.current.closeLeftDrawer();
        navigation?.navigate('Persona');
        //
        //csetState({openFromTop: false, persona: vanillaPersona});

        /*navigation?.navigate('Chat', {
            chatDocPath: `personas/${SYSTEM_DM_PERSONA_ID}/chats/${chatSummary.id}`,
            showSeenIndicators: !chatSummary.data.involved.some(
                id =>
                    globalRefContext.current.userMap[id]?.hideDMSeenIndicators,
            ), // if either party turns off, don't show
            // this is the SAME behavior as WhatsApp - shows by default but allows for changing in the user
            //   profile. We now have a flag in the user profile that a user can turn off seen indicators in DMs.
        });*/

        messageModalContextRef.current.csetState({
            showToggle: true,
            chatID: chatSummary.id,
        });
    };

    return (
        <TouchableOpacity
            onPress={navToChat}
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                flex: 1,
                marginStart: 18,
                marginBottom: 17,
                marginTop: 5,
            }}>
            <TouchableOpacity onPress={navToProfile}>
                <FastImage
                    source={{
                        uri: !userToDM?.profileImgUrl
                            ? images.userDefaultProfileUrl
                            : getResizedImageUrl({
                                  origUrl:
                                      userToDM?.profileImgUrl ||
                                      images.userDefaultProfileUrl,
                                  width: 45,
                                  height: 45,
                              }),
                    }}
                    style={{
                        width: 45,
                        height: 45,
                        borderRadius: 45,
                    }}
                />
            </TouchableOpacity>
            <View
                style={{
                    flex: 1,
                    marginStart: 15,
                    marginEnd: 20,
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                }}>
                <View style={{borderColor: 'red', borderWidth: 0}}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                        }}>
                        <Text
                            style={{
                                ...baseText,
                                fontWeight: 'bold',
                                color: colors.text,
                            }}>
                            {userToDM?.userName || ''}
                        </Text>
                        <Text
                            style={{
                                ...baseText,
                                color: colors.textFaded,
                                marginHorizontal: 5,
                            }}>
                            ·
                        </Text>
                        <Timestamp
                            seconds={
                                chatSummary.data.latestMessage.timestamp
                                    ?.seconds
                            }
                            style={{
                                ...baseText,
                                color: colors.textFaded,
                                flex: 1,
                            }}
                        />
                    </View>
                    <Text
                        style={{
                            ...baseText,
                            marginTop: 2,
                            flex: 1,
                            color: colors.textFaded2,
                        }}>
                        {chatSummary.data.latestMessage.data.userID ===
                        myUserID ? (
                            <Text style={{...baseText, fontStyle: 'italic'}}>
                                You:{' '}
                            </Text>
                        ) : (
                            ''
                        )}
                        {chatSummary.data.latestMessage.data.text}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
