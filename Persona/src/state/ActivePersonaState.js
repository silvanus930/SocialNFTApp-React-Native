import React from 'react';
import {clog, cwarn} from 'utils/log';
import _ from 'lodash';
const CUSTOM_LOG_WARN_HEADER = '!! state/ActivePersonaState';
const log = (...args) =>
    global.LOG_STATE_GLOBAL && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_STATE_GLOBAL && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
import {
    TextInput,
    ActivityIndicator,
    View,
    Image,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Animated,
    Dimensions,
    Easing,
    LayoutAnimation,
} from 'react-native';

const ActivePersonaStateContext = React.createContext({
    audioManager: null,
    setRoomState: () => {},
    presenceObjPath: null,
});

export {ActivePersonaStateContext};

export default class ActivePersonaState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roomTitle: '',
            following: {},
            intents: {},
            rooms: {},
            listeners: [],
            audioManager: null,
            appID: '79a336f985df4758b0ceeb26b80da86b',
            sticky: false,
            pastRooms: {},
            pastRoomsStack: [],
            token: '',
            channelName: '',
            currentRoom: '',
            personaVoice: false,
            joinSucceed: false,
            peerIds: [],
            roomEngine: null,
            showVideoCamera: false,
            useMic: true,
            busyConnecting: false,
            micVolume: 255,
            micMuted: true,
            uid: 0,
            muted: {},
            roomPersonaID: '',
            roomPostID: '',
            roomPersona: {},
            roomPost: {},
            roomUsersPresent: [],
            roomUsersAudioConnected: [],
            roomUsersAudioSpeakers: [],
            post: {state: 'unset'},
            persona: {state: 'unset'},
            identityID: '',
            identityName: '',
            activeSpeakerTimeStamp: null,
            activeSpeakerUID: [],
            identityBio: '',
            identityProfileImgUrl: '',
            presenceIntent: 'unset',
            presenceObjPath: 'unset',
            navStackCache: {
                identityID: 'unset',
                presenceIntent: 'unset',
                presenceObjPath: 'unset',
            },
        };
    }

    setAudioManager = am => {
        this.setState({audioManager: am});
    };

    setRoomState = newState => {
        log('setRoomState', newState);
        this.setState(newState);
    };

    csetState = newState => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        this.setState(newState);
    };

    render() {
        /*console.log(
      '\n\n',
      '>>>>>>>>>>>>>>>>>>>>>>> RENDER ActivePersonaState identityID:',
      this.state.identityID,
      '\n\n',
    );*/
        return (
            <ActivePersonaStateContext.Provider
                value={{
                    sticky: this.state.sticky,
                    csetState: this.csetState,
                    pastRooms: this.state.pastRooms,
                    pastRoomsStack: this.state.pastRoomsStack,
                    audioManager: this.state.audioManager,
                    setAudioManager: this.setAudioManager,
                    setRoomState: this.setRoomState,
                    roomEngine: this.state.roomEngine,
                    appID: this.state.appID,
                    token: this.state.token,
                    channelName: this.state.channelName,
                    currentRoom: this.state.currentRoom,
                    activeSpeakerUID: this.state.activeSpeakerUID,
                    activeSpeakerTimeStamp: this.state.activeSpeakerTimeStamp,
                    joinSucceed: this.state.joinSucceed,
                    roomPersonaID: this.state.roomPersonaID,
                    roomPostID: this.state.roomPostID,
                    roomPersona: this.state.roomPersona,
                    roomPost: this.state.roomPost,
                    roomUsersPresent: this.state.roomUsersPresent,
                    roomTitle: this.state.roomTitle,
                    peerIds: this.state.peerIds,
                    showVideoCamera: this.state.showVideoCamera,
                    useMic: this.state.useMic,
                    micMuted: this.state.micMuted,
                    muted: this.state.muted,
                    busyConnecting: this.state.busyConnecting,
                    identityID: this.state.identityID,
                    identityName: this.state.identityName,
                    identityBio: this.state.identityBio,
                    identityProfileImgUrl: this.state.identityProfileImgUrl,
                    personaVoice: this.state.personaVoice,
                    presenceIntent: this.state.presenceIntent,
                    presenceObjPath: this.state.presenceObjPath,
                    navStackCache: this.state.navStackCache,
                    state: this.state,
                    rooms: this.state.rooms,
                    intents: this.state.intents,
                    following: this.state.following,
                }}>
                {this.props.children}
            </ActivePersonaStateContext.Provider>
        );
    }
}
