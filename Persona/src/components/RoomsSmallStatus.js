import React, {useContext} from 'react';
//import SpeakingIndicator from 'components/SpeakingIndicator';
import useNavPushDebounce from 'hooks/navigationHooks';
//import SelfMicToggle from 'components/MicToggle';
//import UserMicToggle from 'components/UserMicToggle';
//import {ChannelProfile, ClientRole, ClientRoleType} from 'react-native-agora';
import {
    ActivityIndicator,
    TouchableOpacity,
    FlatList,
    View,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import DiscussionTypingIndicators from './DiscussionTypingIndicators';
import colors from 'resources/colors';
import UserBubble from 'components/UserBubble';
import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import {PresenceStateContext} from 'state/PresenceState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import isEqual from 'lodash.isequal';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import useRoomPresence from 'hooks/useRoomPresence';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}
export const RoomsSmallStatusMem = React.memo(
    RoomsSmallStatusProfiler,
    propsAreEqual,
);
export const RoomsSmallStatusWrapped = React.memo(
    RoomsSmallStatusWrappedMemo,
    propsAreEqual,
);

export default function RoomsSmallStatusProfiler(props) {
    return (
        <View style={{borderColor: 'blue', borderWidth: 0}}>
            <React.Profiler
                id={'RoomsSmallStatus'}
                onRender={(id, phase, actualDuration) => {
                    if (actualDuration > 2) {
                        //console.log('======> (Profiler)', id, phase, actualDuration);
                    }
                }}>
                <RoomsSmallStatusWrappedMemo {...props} />
            </React.Profiler>
        </View>
    );
}

function RoomsSmallStatusWrappedMemo({
    rootParentObjPath = null,
    toggleModalVisibility = null,
    showControls = true,
    showRoomTitle = false,
    isDM = false,
}) {
    const myUserID = auth().currentUser?.uid;
    const roomContext = useContext(PresenceStateContext);
    const {
        current: {personaMap},
    } = React.useContext(GlobalStateRefContext);
    //console.log('RENDERING ROOMSSMALLSTATUS w ', rootParentObjPath);
    let postKey = rootParentObjPath ? rootParentObjPath.split('/')[3] : '';
    let personaKey = rootParentObjPath ? rootParentObjPath.split('/')[1] : '';

    const isProjectAllChat =
        rootParentObjPath.includes('personas') &&
        rootParentObjPath.includes('chats');
    const isCommunityAllChat =
        rootParentObjPath.includes('communities') &&
        rootParentObjPath.includes('chat');
    const isChat = isProjectAllChat || isCommunityAllChat || isDM;

    const {roomPresence} = useRoomPresence({
        rootParentObjPath,
        room: {
            id: postKey,
            title: isChat ? 'chat' : roomContext?.roomTitle,
            slug: roomContext?.roomSlug ?? null,
        },
        myUserID,
    });

    const route = useRoute();
    const navigation = useNavigation();
    let participants = Object.keys(roomPresence ?? {});
    participants.sort(); // Why are we sorting by user ID?

    const onBackData = React.useRef({
        sticky: roomContext.sticky,
        multipleParticipants: participants.length > 1,
    });
    React.useEffect(() => {
        onBackData.current = {
            sticky: roomContext.sticky,
            multipleParticipants: participants.length > 1,
        };
    }, [roomContext.sticky, participants.length]);

    /*const startCall = React.useCallback(
        async (micVolume = 255, channelName = '') => {
            console.log(
                'RSS.js startCall micVolume:',
                micVolume,
                'channelName:',
                channelName,
            );
            roomContext.csetState({
                busyConnecting: true,
                channelName: channelName,
                micVolume: micVolume,
                micMuted: micVolume === 0 ? true : false,
            });
            //this.setLiveBar();
            //await roomContext.roomEngine?.enableLocalAudio(false);
            //await roomContext.roomEngine?.muteLocalAudioStream(true);

            let uid = 0;
            //this.setLiveBar();

            console.log('RSS.js pre define doAsyncStuff');
            const doAsyncStuff = async json => {
                console.log('started doAsyncStuff', json);
                let token = json.rtcToken
                    ? json.rtcToken
                    : '006ae58523e5bb14052a51b736e06d0ee3cIABWP6zqYDpf2K78lUFmGLPLEM4ttNpRXwDq+I4kTOQs/hqFz/cAAAAAEAA5kcIAKntGYwEAAQC6N0Vj';

                // json.rtcToken && console.log(`FOUND A TOKEN '${token}'`);
                // !json.rtcToken &&
                //     console.log(`reusing standard issue token ${token}`);
                let errCode =
                    1 ||
                    (await roomContext.roomEngine?.joinChannel(
                        token,
                        channelName,
                        uid, //optionalInfo
                        {
                            clientRoleType:
                                ClientRoleType.ClientRoleBroadcaster,
                        },
                    ));

                if (errCode === -17 || errCode === 17) {
                    let ec = await this.engine?.leaveChannel();
                    console.log('just left channel->', ec);
                    errCode =
                        1 ||
                        (await this.engine?.joinChannel(
                            token,
                            channelName,
                            uid,
                            {
                                clientRoleType:
                                    ClientRoleType.ClientRoleBroadcaster,
                            },
                        ));
                }
                console.log(
                    'RSS.js post joinChannel errCode->',
                    errCode,
                    'token->',
                    token,
                    'channelName->',
                    channelName,
                    'uid->',
                    uid,
                );
                try {
                    await roomContext.roomEngine?.setEnableSpeakerphone(true);
                    console.log('RSS.js post setEnableSpeakerphone');
                    await roomContext.roomEngine?.setDefaultAudioRoutetoSpeakerphone(
                        true,
                    );
                    console.log(
                        'RSS.js post setDefaultAudioRouteToSpeakerphone',
                    );
                } catch (e) {
                    console.log(
                        'RSS.js',
                        Platform.OS,
                        'failed to enable speaker phone!',
                    );
                }

                await roomContext.roomEngine?.enableLocalAudio(false);
                await roomContext.roomEngine?.muteLocalAudioStream(true);
            };

            let URL = `http://persona-agora-token-server.herokuapp.com/rtc/${channelName}/${ClientRoleType.ClientRoleBroadcaster}/uid/${uid}/`;
            console.log('RSS.js URL->', URL);
            const response = await fetch(URL);
            // console.log('RSS.js response->', response);
            let json = await response?.json();
            // console.log('RSS.js json->', json);
            doAsyncStuff(json);
        },
        [roomContext, roomContext.joinSucceed],
    );
  */

    /*useFocusEffect(
        React.useCallback(() => {
            const doStuff = async () => {
                await delay(400);

                if (!roomContext.joinSucceed) {
                    if (rootParentObjPath !== roomContext.presenceObjPath) {
                        await roomContext.roomEngine?.leaveChannel();
                        let newRoom = rootParentObjPath;
                        let perID = newRoom.split('/')[1];
                        let posID = newRoom.split('/')[3];
                        let channelName = `${perID}0000${posID}`;
                        console.log(
                            'DETECTED NOT JOINSUCCEED conn to->',
                            channelName,
                        );
                        await startCall(0, channelName);
                    }
                }
            };
            doStuff();

            return () => {
                //leaveRoom();
            };
        }, [rootParentObjPath, roomContext.joinSucceed]),
    );*/

    /*const toggleSticky = React.useCallback(async () => {
        console.log('RSS.js', Platform.OS, 'toggleSticky!');
        roomContext.csetState({
            sticky: !roomContext.sticky,
        });

        if (
            roomContext.sticky &&
            rootParentObjPath !== roomContext.presenceObjPath
        ) {
            await roomContext.roomEngine?.leaveChannel();
            let newRoom = rootParentObjPath;
            let perID = newRoom.split('/')[1];
            let posID = newRoom.split('/')[3];
            let channelName = `${perID}0000${posID}`;
            await startCall(0, channelName);
            try {
                if (Platform.OS === 'android') {
                    await roomContext.roomEngine.setParameters(
                        '{"che.audio.opensl":true}',
                    );
                }

                //await roomContext.roomEngine.setClientRole(ClientRole.Audience);
                console.log('RSS.js', 'set client role to audience');

                //roomContext.roomEngine.enableDeepLearningDenoise(true);
                //console.log('enableDeepLearningDenoise', 'set to true');

                Platform.OS !== 'android' &&
                    roomContext.roomEngine.enableAudioVolumeIndication(
                        Platform.OS === 'android' ? 500 : 200,
                        Platform.OS === 'android' ? 3 : 5,
                        true,
                    ); // interval in ms, smoothness factor (recommended is 3 / 10)
                console.log('RSS.js enableAudioVolumeIndication');
            } catch (e) {
                console.log(
                    'RSS.js something went wrong when setting parameters {"che.audio.opensl":true} or enableDeepLearningDenoise or enableAudioVolumeIndication in ROOMSSMALLSTATUS L320',
                );
            }

            let postDoc = await firestore()
                .collection('personas')
                .doc(perID)
                .collection('posts')
                .doc(posID)
                .get();
            let post = postDoc.data();
            roomContext.csetState({
                presenceObjPath: newRoom,
                presenceIntent: `${
                    post.title ? post.title : 'Untitled Post'
                } • ${personaMap[perID]?.name}`,
                currentRoom: channelName,
                channelName: channelName,
                roomTitle: post.title,
                uid: 0,
                //muted: {},
                micMuted: true,
                //peerIds: [],
                joinSucceed: true,
                //roomUsersPresent: [],
                roomPersonaID: perID,
                roomPostID: posID,
                roomPost: post,
                //roomPersona: {},
            });
        }
    }, [roomContext, rootParentObjPath]);*/

    const leaveRoom = React.useCallback(async () => {
        //console.log('RoomsSmolStatus.leaveRoom', roomContext.presenceObjPath);
        navigation.navigate('Persona');

        await roomContext.roomEngine?.leaveChannel();
        roomContext.csetState({
            presenceIntent: 'unset',
            presenceObjPath: 'unset',
            sticky: false,
            roomTitle: '',
            currentRoom: '',
            channelName: '',
            uid: 0,
            muted: {},
            micMuted: true,
            peerIds: [],
            pastRoomsStack: Object.assign([]),
            joinSucceed: false,
            roomUsersPresent: [],
            roomPersonaID: '',
            roomPostID: '',
            roomPost: {},
            roomPersona: {},
        });
        // await firestore()
        //   .collection('pings')
        //   .where('requesterID', '==', myUserID)
        //   .where('requesterID', '==', myUserID)
        //   .where('roomPostID', '==', oldRoomPostID)
        //   .where('roomPersonaID', '==', oldRoomPersonaID)
        //   .where('cancelled', '==', false)
        //   .get()
        //   .then(async pingsToCancel => {
        //     const batch = firestore().batch();
        //     for (const doc of pingsToCancel.docs) {
        //       batch.set(doc.ref, {cancelled: true}, {merge: true});
        //     }
        //     await batch.commit();
        //   });
    }, [roomContext, navigation]);

    const navToPostDiscussion = useNavPushDebounce(
        'PostDiscussion',
        {
            personaName: '',
            personaKey: personaKey,
            postKey: postKey,
            personaProfileImgUrl: '',
            scrollToMessageID: null,
            openToThreadID: null,
        },
        [postKey, personaKey],
    );

    let offset =
        route?.name === 'PostDiscussion' || route?.name === 'Post'
            ? 22
            : Platform.OS === 'android'
            ? 0
            : 5;
    return (
        <ContentWrapper
            offset={offset}
            currentRoom={roomPresence}
            toggleModalVisibility={toggleModalVisibility}
            roomTitle={roomContext.roomTitle}
            channelName={roomContext.channelName}
            presenceObjPath={roomContext.presenceObjPath}
            showRoomTitle={showRoomTitle}
            sticky={roomContext.sticky}
            participants={participants}
            toggleSticky={/*toggleSticky*/ null}
            joinSucceed={roomContext.joinSucceed}
            postKey={postKey}
            leaveRoom={leaveRoom}
            personaKey={personaKey}
            routeName={route?.name}
            rootParentObjPath={rootParentObjPath}
            navToPostDiscussion={navToPostDiscussion}
            showControls={showControls}
            userMicMuted={roomContext.micMuted}
        />
    );
}
function ContentWrapper({
    offset,
    currentRoom,
    busyConnecting,
    presenceObjPath,
    sticky,
    participants,
    postKey,
    personaKey,
    leaveRoom,
    rootParentObjPath,
    navToPostDiscussion,
    routeName,
    showControls,
    toggleModalVisibility,
    userMicMuted,
}) {
    const {
        current: {personaMap, user},
    } = React.useContext(GlobalStateRefContext);
    //console.log(Platform.OS, 'ROOMSSMOLSTATUS', participants);

    let canChat =
        personaKey && personaMap && personaMap[personaKey]
            ? personaMap[personaKey].publicCanAudioChat
            : true;
    let canTextChat =
        personaKey && personaMap && personaMap[personaKey]
            ? personaMap[personaKey].publicCanChat ||
              (personaKey &&
                  personaMap[personaKey]?.authors?.includes(
                      auth().currentUser.uid,
                  ))
            : true;

    /*console.log(
        'RSS.js ContentWrapper joinSucceed->',
        joinSucceed,
        'routeName',
        routeName,
    );*/

    if (!canTextChat) {
        return <></>;
    }
    return busyConnecting ? (
        <View style={{height: 66}}>
            <ActivityIndicator
                style={{zIndex: 99999999, elevation: 9999999}}
                size={'large'}
                color={colors.postAction}
            />
        </View>
    ) : (
        <TouchableOpacity
            style={{
                borderWidth: 0,
                borderColor: 'red',
                backgroundColor: null,
            }}
            onPress={
                postKey &&
                personaKey &&
                rootParentObjPath !== `personas/${personaKey}/posts/${postKey}`
                    ? navToPostDiscussion
                    : null
            }
            disabled={
                true ||
                !postKey ||
                !personaKey ||
                rootParentObjPath === `personas/${personaKey}/posts/${postKey}`
            }>
            <View style={{height: !canChat && canTextChat ? 40 : 0}} />
            <View
                style={{
                    zIndex: 999999999,
                    elevation: 99999999,
                    borderTopColor: colors.seperatorLineColor,
                    borderTopWidth:
                        routeName !== 'Post' &&
                        routeName !== 'PostDiscussion' &&
                        routeName !== 'Chat'
                            ? 0.4
                            : 0,

                    padding: canChat ? 3 : 0,

                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    marginBottom: canChat
                        ? Platform.OS === 'android'
                            ? 50
                            : offset
                        : 0,
                    paddingBottom: canChat ? 8 : 0,
                }}>
                <View
                    style={{
                        borderColor: 'purple',
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        paddingTop: canChat ? 2 : 0,
                        borderWidth: 0,
                        width: '100%',
                        opacity: 1,
                    }}>
                    <View style={{flexDirection: 'column'}}>
                        {canChat && (
                            <View
                                style={{
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                    flexDirection: 'row',
                                    borderColor: 'yellow',
                                    borderWidth: 0,
                                }}>
                                {false &&
                                personaKey !== SYSTEM_DM_PERSONA_ID &&
                                toggleModalVisibility ? (
                                    <View
                                        style={{
                                            borderColor: 'yellow',
                                            width: 35,
                                            height: 35,
                                            top:
                                                Platform.OS === 'android'
                                                    ? 1
                                                    : null,
                                            position:
                                                Platform.OS === 'android'
                                                    ? 'absolute'
                                                    : '',
                                            left: 19,
                                            flex: Platform.OS === 'ios' ? 2 : 0,
                                            borderWidth: 0,
                                            elevation: 99,
                                            zIndex: 99,
                                        }}>
                                        <View
                                            style={{
                                                alignSelf: 'flex-start',
                                                backgroundColor: 'black',
                                                opacity: 1,
                                                top: 0,
                                                borderRadius: 28,
                                                width: 28,
                                                height: 28,
                                                elevation: 99,
                                                zIndex: 99,
                                                borderWidth: 0,
                                                borderColor: 'blue',
                                            }}>
                                            {/*<SelfMicToggle
                                                rootParentObjPath={
                                                    rootParentObjPath
                                                }
                                                style={{
                                                    left: -0.5,
                                                    elevation: 9999999999999,
                                                    zIndex: 9999999999999,
                                                }}
                                            />*/}
                                        </View>
                                    </View>
                                ) : null}
                                <View
                                    style={{
                                        borderColor: 'magenta',
                                        borderWidth: 0,
                                        width: '100%',
                                        justifyContent: 'flex-end',
                                        flexDirection: 'row',
                                        borderWidth: 0,
                                        height: 35,
                                    }}>
                                    {showControls && (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                borderColor: 'red',
                                                borderWidth: 0,
                                                justifyContents: 'flex-end',
                                            }}>
                                            <UserListMemo
                                                style={{
                                                    borderColor: 'purple',
                                                    borderWidth: 0,
                                                }}
                                                currentRoom={currentRoom}
                                                routeName={routeName}
                                                participants={participants}
                                                presenceObjPath={
                                                    presenceObjPath
                                                }
                                                myUserID={user?.id}
                                                userMicMuted={userMicMuted}
                                            />
                                        </View>
                                    )}
                                    <ControlPanelMemo
                                        showControls={showControls}
                                        sticky={sticky}
                                        routeName={routeName}
                                        toggleModalVisibility={
                                            toggleModalVisibility
                                        }
                                        leaveRoom={leaveRoom}
                                        toggleSticky={/*toggleSticky*/ null}
                                        pObjPath={presenceObjPath}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}
const ControlPanelMemo = React.memo(ControlPanel, propsAreEqual);
function ControlPanel({pObjPath, routeName}) {
    //console.log('ControlPanel', routeName);
    return (
        <>
            {pObjPath &&
                pObjPath !== 'unset' &&
                routeName !== 'PostDiscussion' &&
                routeName !== 'Post' && (
                    <DiscussionTypingIndicators parentObjPath={pObjPath} />
                )}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    top: Platform.OS === 'android' ? 6 : -4,

                    borderColor: 'red',
                    borderWidth: 0,
                }}
            />
        </>
    );
}

const UserListMemo = React.memo(UserList, propsAreEqual);
function UserList({
    participants,
    currentRoom,
    presenceObjPath,
    myUserID,
    userMicMuted,
}) {
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);

    const keyExtractor = item => `${item.id.toString()}`;
    const [activePings, setActivePings] = React.useState([]);
    //   React.useEffect(() => {
    //     return firestore()
    //       .collection('pings')
    //       .where('cancelled', '==', false)
    //       .where('replied', '==', false)
    //       .where('presenceObjPath', '==', presenceObjPath)
    //       .onSnapshot(currentPings => {
    //         const pulledPings = currentPings.docs.map(doc => ({
    //           data: doc.data(),
    //           ref: doc.ref,
    //           id: doc.id,
    //         }));
    //         let newPings = [];
    //         let pingsBeyondExpiration = [];
    //         pulledPings.forEach(ping => {
    //           if (
    //             ping?.data?.timestamp?.seconds > Date.now() / 1000 - pingTimeout ||
    //             ping?.data?.timestamp?.seconds === undefined
    //           ) {
    //             newPings.push(ping);
    //           } else {
    //             pingsBeyondExpiration.push(ping);
    //           }
    //         });
    //         setActivePings([...new Set(newPings.map(({data}) => data.pingID))]);
    //         const batch = firestore().batch();
    //         pingsBeyondExpiration.forEach(ping =>
    //           batch.set(ping.ref, {replied: true}, {merge: true}),
    //         );
    //         batch.commit();
    //       });
    //   }, []);
    const renderParticipants = React.useCallback(
        ({item: {id: uid, ping}}) => {
            let conditional = currentRoom && currentRoom[uid];
            const conn = Object.keys(
                currentRoom?.[uid]?.connections ?? {},
            ).pop();
            const userConnection = currentRoom?.[uid]?.connections?.[conn];
            let personaVoice =
                currentRoom &&
                currentRoom[uid] &&
                userConnection?.identity?.startsWith('PERSONA');
            let identityID = '';
            if (personaVoice) {
                identityID = userConnection?.identity?.split('::')[1];
            }
            const micMuted =
                uid === myUserID ? userMicMuted : userConnection?.micMuted;
            //   let emoji = currentRoom && currentRoom[uid] ? currentRoom[uid].emoji : '';
            //
            if (uid === myUserID) {
                return null;
            }

            return (
                <View style={{flex: 0}}>
                    {/* {Boolean(emoji) && (
            <View
              style={{
                position: 'absolute',
                top: -5,
                left: 25,
                elevation: 9999,
                zIndex: 9999,
              }}>
              <Text style={{...baseText, fontSize: 12}}>{emoji}</Text>
            </View>
          )} */}
                    {/* {ping && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 25,
                elevation: 9999,
                zIndex: 9999,
              }}>
              <MaterialCommunityIcons
                color={colors.postAction}
                name={'hand-pointing-left'}
                size={16}
              />
            </View>
          )} */}
                    <View
                        style={{
                            flexDirection: 'column',
                            paddingRight: 0,
                            paddingLeft: 0,
                            top: 0,
                            borderWidth: 0,
                            borderColor: 'blue',
                            opacity: ping ? 0.5 : 1,
                        }}>
                        {false && conditional && (
                            <View
                                style={{
                                    position: 'absolute',
                                    borderColor: colors.textFaded2,
                                    left: 22,
                                    top: 7,
                                    borderWidth: 0,
                                    elevation: 9999,
                                    zIndex: 9999,
                                    borderRadius: 19,
                                    width: 19,
                                    height: 19,
                                }}>
                                {/*false && <UserMicToggle
                                    micMuted={micMuted}
                                    uid={uid}
                                    pObjPath={presenceObjPath}
                                />*/}
                            </View>
                        )}
                        {/*<SpeakingIndicator
                            uid={uid}
                            style={{left: 11}}
                            pObjPath={presenceObjPath}
                            size={20}
                        />*/}
                        <UserBubble
                            margin={0}
                            style={{
                                flex: 1,
                                marginTop: 0,
                            }}
                            showName={false}
                            bubbleSize={14}
                            user={
                                personaVoice
                                    ? {
                                          ...personaMap[identityID],
                                          uid: uid,
                                          userName:
                                              personaMap[identityID]?.name,
                                      }
                                    : userMap[uid]
                            }
                        />
                    </View>
                </View>
            );
        },
        [userMap, currentRoom, presenceObjPath, activePings, userMicMuted],
    );
    const participantIdentityIDs = participants.map(uid => {
        const userConnection =
            currentRoom?.[uid][Object.keys(currentRoom?.[uid] ?? {})?.pop()];
        const personaVoice =
            currentRoom &&
            currentRoom[uid] &&
            userConnection?.identity?.startsWith('PERSONA');
        let identityID = uid;
        if (personaVoice) {
            identityID = userConnection?.identity?.split('::')[1];
        }
        return identityID;
    });
    const data = activePings
        .filter(uid => !participantIdentityIDs.includes(uid))
        .map(id => ({id, ping: true}))
        .concat(participants.map(id => ({id, ping: false})));

    /*console.log("rendering userlist w presenceObjPath '", presenceObjPath, "'");*/
    return (
        <View
            style={{
                borderColor: 'red',
                flexDirection: 'row',
                borderWidth: 0,
                paddingRight: 15,
                width:
                    presenceObjPath && presenceObjPath.includes('chat')
                        ? '92%'
                        : '84%',
                right:
                    presenceObjPath && presenceObjPath.includes('chat')
                        ? -30
                        : -50,
                marginBottom: Platform.OS === 'android' ? -30 : null,
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    width: '100%',
                    flex: 10,
                    justifyContent: 'flex-end',
                    marginRight: 4,
                    bottom: 3,
                }}>
                <FlatList
                    horizontal={true}
                    bounces={true}
                    data={data}
                    contentContainerStyle={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                    }}
                    keyExtractor={keyExtractor}
                    renderItem={renderParticipants}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
}
