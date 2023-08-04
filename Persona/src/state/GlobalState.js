import React from 'react';
import _ from 'lodash';
import {LayoutAnimation} from 'react-native';

const GlobalStateContext = React.createContext({
    user: null,
    busyAuthStateChange: null,
    listeners: null,
    setUser: u => {},
    userMap: {},
    userList: null,
    activitySnap: null,
    setActivityList: () => {},
    csetState: () => {},
    personaList: null,
    userPersonaList: null,
    profilePersonaList: null,
    forceRefreshActivity: false,
    setForceRefreshActivity: () => {},
    quoteIndices: 0,
    audioManager: null,
    setRoomState: () => {},
    showRooms: false,
    showCommunityList: false,
    toggleStudio: undefined,
    setToggleStudio: () => {},
    setTogglePresence: () => {},
    connectionRef: null,
    setConnectionRef: () => {},
    useNativeModuleChat: false,
    // setUseNativeModuleChat: () => {},
});

export {GlobalStateContext};
export default class GlobalState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showRooms: false,
            showCommunityList: false,
            listeners: [],
            audioManager: null,
            user: null,
            busyAuthStateChange: false,
            userList: [],
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
            rerenderBit: true,
            roomPost: {},
            roomUsersPresent: [],
            toggleStudio: undefined,
            togglePresence: undefined,
            connectionRef: null,
            useNativeModuleChat: false,
        };
    }

    setToggleStudio = () => {
        this.setState({toggleStudio: !this.state.toggleStudio});
    };

    setTogglePresence = () => {
        this.setState({togglePresence: !this.state.togglePresence});
    };

    setUser = u => {
        this.setState({user: u});
    };

    setBusyAuthStateChange = ppl => {
        this.setState({busyAuthStateChange: ppl});
    };

    setActivityList = al => {
        this.setState({activitySnap: al});
    };

    getUserFromUserList = uid => {
        let user =
            this.state.userList[
                this.state.userList.findIndex(user => user?.id === uid)
            ];
        return user ? {...user, uid: user.id} : undefined;
    };

    getUserFromUserName = userName => {
        // this can be used to get user profile details for @mention

        if (typeof userName !== 'string') {
            return undefined;
        }

        const user = this.state.userList.find(
            data => data?.userName === userName,
        );

        return user ? {...user, uid: user?.id} : undefined;
    };

    pushIndexOfLastQuote = i => {
        //this.setState( user: {...this.state.user, lastQuote: i});
        this.state.user.lastQuote = i;
    };

    setInit = i => {
        this.setState({init: i});
    };

    setUserInit = i => {
        this.setState({userInit: i});
    };

    setPersonasInit = i => {
        this.setState({personasInit: i});
    };

    setActivityInit = i => {
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
        this.setState(newState);
    };

    csetState = state => {
        this.setState(state);
    };

    // setUseNativeModuleChat = value => {
    //     print('🎛️ About to use this setter');
    //     this.setState(value);
    // };

    toggleShowRooms = () => {
        this.setState({showRooms: !this.state.showRooms});
    };

    toggleCommunityList = () => {
        this.setState({
            showCommunityList: !this.state.showCommunityList,
        });
    };

    setConnectionRef = connectionRef => {
        this.setState({connectionRef});
    };

    render() {
        //console.log('RENDER GlobalState');
        return (
            <GlobalStateContext.Provider
                value={{
                    showRooms: this.state.showRooms,
                    showCommunityList: this.state.showCommunityList,
                    toggleShowRooms: this.toggleShowRooms,
                    toggleCommunityList: this.toggleCommunityList,
                    user: this.state.user,
                    userList: this.state.userList,
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
                    getUserFromUserName: this.getUserFromUserName,
                    init: this.state.init,
                    userListInit: this.state.init,
                    userInit: this.state.userInit,
                    activityInit: this.state.activityInit,
                    setActivityInit: this.setActivityInit,
                    personasInit: this.state.personasInit,
                    setInit: this.setInit,
                    setPersonaMap: this.setPersonaMap,
                    setUserInit: this.setUserInit,
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
                    togglePresence: this.state.togglePresence,
                    setToggleStudio: this.setToggleStudio,
                    setTogglePresence: this.setTogglePresence,
                    connectionRef: this.state.connectionRef,
                    setConnectionRef: this.setConnectionRef,
                    rerenderBit: this.state.rerenderBit,
                    useNativeModuleChat: this.state.useNativeModuleChat,
                    // setUseNativeModuleChat: this.state.setUseNativeModuleChat,
                }}>
                {this.props.children}
            </GlobalStateContext.Provider>
        );
    }
}
