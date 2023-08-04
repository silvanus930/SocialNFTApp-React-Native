import React from 'react';
import {clog} from 'utils/log';
import _ from 'lodash';
const CUSTOM_LOG_WARN_HEADER = '!! state/GlobalState';
const log = (...args) =>
    global.LOG_STATE_GLOBAL && clog(CUSTOM_LOG_WARN_HEADER, ...args);

const GlobalStateContext = React.createContext({
    user: null,
    busyAuthStateChange: null,
    listeners: null,
    setUser: u => {},
    userMap: {},
    userList: null,
    activitySnap: null,
    setActivityList: () => {},
    chatList: null,
    csetState: () => {},
    setChatList: () => {},
    personaList: null,
    userPersonaList: null,
    profilePersonaList: null,
    forceRefreshActivity: false,
    setForceRefreshActivity: () => {},
    quoteIndices: 0,
    audioManager: null,
    setRoomState: () => {},
    showRooms: false,
    toggleStudio: undefined,
    setToggleStudio: () => {},
});

export {GlobalStateContext};
export default class GlobalState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showRooms: false,
            listeners: [],
            audioManager: null,
            user: null,
            busyAuthStateChange: false,
            userList: [],
            chatList: [],
            activitySnap: [],
            personaList: [],
            userPersonaList: [],
            profilePersonaList: [],
            userMap: {},
            personaMap: {},
            init: true,
            userListInit: true,
            userInit: true,
            activityInit: true,
            chatsInit: true,
            personasInit: true,
            forceRefreshActivity: false,
            appID: '79a336f985df4758b0ceeb26b80da86b',
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
            roomPersonaID: '',
            roomPostID: '',
            roomPersona: {},
            roomPost: {},
            roomUsersPresent: [],
            toggleStudio: undefined,
        };
    }

    setToggleStudio = () => {
        this.setState({toggleStudio: !this.state.toggleStudio});
    };

    setUser = u => {
        log('setUser', u);
        this.setState({user: u});
    };

    setChatList = cl => {
        log('setChatList', cl.length, 'chats');
        this.setState({chatList: [...cl]});
    };

    setBusyAuthStateChange = ppl => {
        log('setBusyAuthStateChange', ppl);
        this.setState({busyAuthStateChange: ppl});
    };

    setActivityList = al => {
        log('setActivityList', al.length, 'items');
        this.setState({activitySnap: al});
    };

    getUserFromUserList = uid => {
        let user =
            this.state.userList[
                this.state.userList.findIndex(user => user?.id === uid)
            ];
        return user ? {...user, uid: user.id} : undefined;
    };

    pushIndexOfLastQuote = i => {
        log('pushIndexOfLastQuote', i);
        //this.setState( user: {...this.state.user, lastQuote: i});
        this.state.user.lastQuote = i;
    };

    setInit = i => {
        log('setInit', i);
        this.setState({init: i});
    };

    setUserInit = i => {
        log('setUserInit', i);
        this.setState({userInit: i});
    };

    setChatsInit = i => {
        log('setChatsInit', i);
        this.setState({chatsInit: i});
    };

    setPersonasInit = i => {
        log('setPersonasInit', i);
        this.setState({personasInit: i});
    };

    setActivityInit = i => {
        log('setActivityInit', i);
        this.setState({activityInit: i});
    };

    setForceRefreshActivity = forceRefreshActivity => {
        this.setState({forceRefreshActivity: forceRefreshActivity});
    };

    setIsMessagingEnabled = im => {
        this.setState({isMessagingEnabled: im});
    };

    setAudioManager = am => {
        this.setState({audioManager: am});
    };

    setRoomState = newState => {
        log('setRoomState', newState);
        this.setState(newState);
    };

    csetState = state => {
        this.setState(state);
    };

    toggleShowRooms = () => {
        this.setState({showRooms: !this.state.showRooms});
    };

    render() {
        return (
            <GlobalStateContext.Provider
                value={{
                    showRooms: this.state.showRooms,
                    toggleShowRooms: this.toggleShowRooms,
                    user: this.state.user,
                    userList: this.state.userList,
                    chatList: this.state.chatList,
                    activitySnap: this.state.activitySnap,
                    feedSnap: this.state.feedSnap,
                    personaList: this.state.personaList,
                    userPersonaList: this.state.userPersonaList,
                    profilePersonaList: this.state.profilePersonaList,
                    userMap: this.state.userMap,
                    personaMap: this.state.personaMap,
                    csetState: this.csetState,
                    setUser: this.setUser,
                    isMessagingEnabled: this.state.isMessagingEnabled,
                    setIsMessagingEnabled: this.setIsMessagingEnabled,
                    getUserFromUserList: this.getUserFromUserList,
                    init: this.state.init,
                    userListInit: this.state.init,
                    userInit: this.state.userInit,
                    activityInit: this.state.activityInit,
                    setActivityInit: this.setActivityInit,
                    chatsInit: this.state.chatsInit,
                    personasInit: this.state.personasInit,
                    setInit: this.setInit,
                    setPersonaMap: this.setPersonaMap,
                    setUserInit: this.setUserInit,
                    setChatsInit: this.setChatsInit,
                    setChatList: this.setChatList,
                    setActivityList: this.setActivityList,
                    setFeedSnap: this.setFeedSnap,
                    setPersonasInit: this.setPersonasInit,
                    forceRefreshActivity: this.state.forceRefreshActivity,
                    setForceRefreshActivity: this.setForceRefreshActivity,
                    listeners: this.state.listeners,
                    quoteIndices: this.state.quoteIndices,
                    busyAuthStateChange: this.state.busyAuthStateChange,
                    setBusyAuthStateChange: this.setBusyAuthStateChange,
                    pushIndexOfLastQuote: this.pushIndexOfLastQuote,
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
                    peerIds: this.state.peerIds,
                    showVideoCamera: this.state.showVideoCamera,
                    useMic: this.state.useMic,
                    micMuted: this.state.micMuted,
                    busyConnecting: this.state.busyConnecting,
                    toggleStudio: this.state.toggleStudio,
                    setToggleStudio: this.setToggleStudio,
                }}>
                {this.props.children}
            </GlobalStateContext.Provider>
        );
    }
}
