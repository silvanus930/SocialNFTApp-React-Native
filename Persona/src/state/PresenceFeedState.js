import React from 'react';

const PresenceFeedStateContext = React.createContext({
    audioManager: null,
    setRoomState: () => {},
    presenceObjPath: null,
});

export {PresenceFeedStateContext};

export default class PresenceFeedState extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            numLiveRooms: 0,
            activeRooms: {},
            roomTitle: '',
            following: {},
            intents: {},
            rooms: {},
            listeners: [],
            audioManager: null,
            appID: '79a336f985df4758b0ceeb26b80da86b',
            sticky: false,
            pastRooms: {},
            token: '',
            channelName: '',
            currentRoom: '',
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
            roomSlug: '',
            roomUsersPresent: [],
            roomUsersAudioConnected: [],
            roomUsersAudioSpeakers: [],
            post: {state: 'unset'},
            persona: {state: 'unset'},
            identityID: 'unset',
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
        //LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        this.setState(newState);
    };

    render() {
        //console.log('RENDER PresenceFeedState');
        return (
            <PresenceFeedStateContext.Provider
                value={{
                    sticky: this.state.sticky,
                    csetState: this.csetState,
                    pastRooms: this.state.pastRooms,
                    audioManager: this.state.audioManager,
                    setAudioManager: this.setAudioManager,
                    setRoomState: this.setRoomState,
                    roomEngine: this.state.roomEngine,
                    appID: this.state.appID,
                    token: this.state.token,
                    channelName: this.state.channelName,
                    currentRoom: this.state.currentRoom,
                    joinSucceed: this.state.joinSucceed,
                    roomPersonaID: this.state.roomPersonaID,
                    roomPostID: this.state.roomPostID,
                    roomPersona: this.state.roomPersona,
                    roomPost: this.state.roomPost,
                    roomUsersPresent: this.state.roomUsersPresent,
                    roomTitle: this.state.roomTitle,
                    roomSlug: this.state.roomSlug,
                    peerIds: this.state.peerIds,
                    showVideoCamera: this.state.showVideoCamera,
                    useMic: this.state.useMic,
                    micMuted: this.state.micMuted,
                    muted: this.state.muted,
                    busyConnecting: this.state.busyConnecting,
                    identityID: this.state.identityID,
                    presenceIntent: this.state.presenceIntent,
                    presenceObjPath: this.state.presenceObjPath,
                    navStackCache: this.state.navStackCache,
                    state: this.state,
                    rooms: this.state.rooms,
                    intents: this.state.intents,
                    following: this.state.following,
                    numLiveRooms: this.state.numLiveRooms,
                    activeRooms: this.state.activeRooms,
                }}>
                {this.props.children}
            </PresenceFeedStateContext.Provider>
        );
    }
}
