import React from 'react';
import produce from 'immer';
import {cerror} from 'utils/log';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {LayoutAnimation} from 'react-native';

const CUSTOM_LOG_WARN_HEADER = '!! HomeStateContext';
const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);

export const FollowFeedStateContext = React.createContext();
export const FollowFeedDispatchContext = React.createContext();
export const FollowFeedMenuStateContext = React.createContext();
export const FollowFeedMenuDispatchContext = React.createContext();
export const FollowFeedPersistStateContext = React.createContext();
export const FollowFeedPersistDispatchContext = React.createContext();
export const FollowPersonaOptionsStateContext = React.createContext();
export const FollowPersonaOptionsDispatchContext = React.createContext();
export const FollowHomeNavStateContext = React.createContext();
export const FollowHomeNavDispatchContext = React.createContext();

const initialPersonaOptionsState = {
    personas: {},
};

const personaOptionsReducer = (draft, action) => {
    switch (action.type) {
        case 'openPersonaSettingsMenu': {
            console.log('CALL openPersonaSettingsMenu');
            const {personaId} = action.payload;
            const existingSettings = draft.personas[personaId] || {};
            draft.personas[personaId] = {
                ...existingSettings,
                settingsOpen: true,
            };
            return;
        }
        case 'closePersonaSettingsMenu': {
            console.log('CALL closePersonaSettingsMenu');
            const {personaId} = action.payload;
            const existingSettings = draft.personas[personaId] || {};
            draft.personas[personaId] = {
                ...existingSettings,
                settingsOpen: false,
            };
            return;
        }
        case 'leaveCommunity': {
            console.log('CALL leaveCommunity');
            const {personaId} = action.payload;
            delete draft.personas[personaId];
            return;
        }
        default: {
            error('personaOptionsReducer called with invalid action');
        }
    }
};

export const FollowPersonaOptionsState = React.memo(
    PersonaOptionsStateMemo,
    () => true,
);
function PersonaOptionsStateMemo({children}) {
    console.log('RENDER PersonaOptionsStateMemo');
    const myUserID = auth().currentUser.uid;

    const [state, setState] = React.useState(undefined);
    const stateValue = React.useMemo(
        () => ({
            state,
        }),
        [state],
    );
    let mutableState = React.useRef(undefined);
    const firestoreDoc = React.useMemo(
        () =>
            firestore()
                .collection('users')
                .doc(myUserID)
                .collection('live')
                .doc('personaOptionsState'),
        [myUserID],
    );

    /*React.useEffect(() => {
        return firestoreDoc.onSnapshot(homeStateDoc => {
            let stateUpdate = initialPersonaOptionsState;
            if (homeStateDoc.exists) {
                stateUpdate = homeStateDoc.data();
            }
            mutableState.current = stateUpdate;
            setState(stateUpdate);
        });
    }, [firestoreDoc, myUserID]);*/

    const dispatchValue = React.useMemo(
        () => ({
            dispatch: ({type, payload}) => {
                const mutableStateCopy = {...mutableState.current};
                if (mutableState.current === undefined) {
                    error(
                        'personaOptionsDispatch called before the state can be manipulated accurately',
                    );
                    return;
                }
                if (
                    payload?.personaId === undefined ||
                    payload?.personaId === null
                ) {
                    error('personaOptionsDispatch passed invalid personaId');
                    return;
                }
                const nextState = produce(mutableStateCopy, draftState =>
                    personaOptionsReducer(draftState, {type, payload}),
                );
                firestoreDoc.set(nextState);
            },
        }),
        [firestoreDoc],
    );

    return (
        <FollowPersonaOptionsStateContext.Provider value={stateValue}>
            <FollowPersonaOptionsDispatchContext.Provider value={dispatchValue}>
                {children}
            </FollowPersonaOptionsDispatchContext.Provider>
        </FollowPersonaOptionsStateContext.Provider>
    );
}

const initialPersistState = {
    init: true,
    personaIdsMuted: {},
    userIdsMuted: {},
};

const feedPersistReducer = (draft, action) => {
    switch (action.type) {
        case 'addMutedPersona': {
            console.log('CALL addMutedPersona');
            const {personaId} = action.payload;
            draft.personaIdsMuted[personaId] = true;
            return;
        }
        case 'addMutedUser': {
            console.log('CALL addMutedUser');
            const {userId} = action.payload;
            draft.userIdsMuted[userId] = true;
            return;
        }
        case 'removeMutedPersona': {
            console.log('CALL removeMutedPersona');
            const {personaId} = action.payload;
            delete draft.personaIdsMuted[personaId];
            return;
        }
        case 'removeMutedUser': {
            console.log('CALL removeMutedUser');
            const {userId} = action.payload;
            delete draft.userIdsMuted[userId];
            return;
        }
        default: {
            error('feedPersistReducer called with invalid action');
        }
    }
};

export const FollowFeedPersistState = React.memo(
    FollowFeedPersistStateMemo,
    () => true,
);
function FollowFeedPersistStateMemo({children}) {
    console.log('RENDER FollowFeedPersistStateMemo');
    const myUserID = auth().currentUser.uid;

    const [state, setState] = React.useState(undefined);
    const stateValue = React.useMemo(
        () => ({
            state,
        }),
        [state],
    );
    let mutableState = React.useRef(undefined);
    const firestoreDoc = React.useMemo(
        () =>
            firestore()
                .collection('users')
                .doc(myUserID)
                .collection('live')
                .doc('feedState'),
        [myUserID],
    );

    /*React.useEffect(() => {
        return firestoreDoc.onSnapshot(homeStateDoc => {
            let stateUpdate = initialPersistState;
            if (homeStateDoc.exists) {
                stateUpdate = homeStateDoc.data();
            }
            mutableState.current = stateUpdate;
            setState(stateUpdate);
        });
    }, [firestoreDoc, myUserID]);*/

    const dispatchValue = React.useMemo(
        () => ({
            dispatch: ({type, payload}) => {
                const mutableStateCopy = {...mutableState.current};
                if (mutableState.current === undefined) {
                    error(
                        'homeStateDispatch called before the state can be manipulated accurately',
                    );
                    return;
                }
                const nextState = produce(mutableStateCopy, draftState =>
                    feedPersistReducer(draftState, {type, payload}),
                );
                firestoreDoc.set(nextState);
            },
        }),
        [firestoreDoc],
    );

    return (
        <FollowFeedPersistStateContext.Provider value={stateValue}>
            <FollowFeedPersistDispatchContext.Provider value={dispatchValue}>
                {children}
            </FollowFeedPersistDispatchContext.Provider>
        </FollowFeedPersistStateContext.Provider>
    );
}

const initialMenuState = {
    endorsementsMenu: {
        open: false,
        touchY: undefined,
        postKey: undefined,
        personaKey: undefined,
    },
    endorsementUsersMenu: {
        open: false,
        touchY: undefined,
        postKey: undefined,
        personaKey: undefined,
        endorsement: undefined,
        endorsers: [],
    },
    communityMenu: {
        open: false,
        userId: undefined,
        userName: undefined,
        userProfileImgUrl: undefined,
        personaKey: undefined,
        personaName: undefined,
        personaProfileImgUrl: undefined,
    },
};

const feedMenuReducer = (draft, action) => {
    switch (action.type) {
        case 'openCommunityMenu': {
            console.log('CALL openCommunityMenu');
            draft.communityMenu = {...action.payload, open: true};
            return;
        }
        case 'closeCommunityMenu': {
            console.log('CALL closeCommunityMenu');
            draft.communityMenu.open = false;
            return;
        }
        case 'resetCommunityMenu': {
            console.log('CALL resetCommunityMenu');
            draft.communityMenu = initialMenuState.communityMenu;
            return;
        }
        case 'openEndorsementsMenu': {
            console.log('CALL openEndorsementsMenu');
            draft.endorsementsMenu = {...action.payload, open: true};
            return;
        }
        case 'closeEndorsementsMenu': {
            console.log('CALL closeEndorsementsMenu');
            draft.endorsementsMenu = initialMenuState.endorsementsMenu;
            return;
        }
        case 'openEndorsementUsersMenu': {
            console.log('CALL openEndorsementUsersMenu');
            draft.endorsementUsersMenu = {...action.payload, open: true};
            return;
        }
        case 'closeEndorsementUsersMenu': {
            console.log('CALL closeEndorsementUsersMenu');
            draft.endorsementUsersMenu = initialMenuState.endorsementsMenu;
            return;
        }
        default: {
            error('feedMenuReducer called with invalid action');
        }
    }
};

const curriedMenuFollowFeedReducerFunction = produce(feedMenuReducer);

export const FollowFeedMenuState = React.memo(
    FollowFeedMenuStateMemo,
    () => true,
);
function FollowFeedMenuStateMemo({children}) {
    console.log('RENDER FollowFeedMenuStateMemo');
    const [state, dispatch] = React.useReducer(
        curriedMenuFollowFeedReducerFunction,
        initialMenuState,
    );
    const stateValue = React.useMemo(
        () => ({
            state,
        }),
        [state],
    );
    const dispatchValue = React.useMemo(
        () => ({
            dispatch,
        }),
        [dispatch],
    );

    return (
        <FollowFeedMenuStateContext.Provider value={stateValue}>
            <FollowFeedMenuDispatchContext.Provider value={dispatchValue}>
                {children}
            </FollowFeedMenuDispatchContext.Provider>
        </FollowFeedMenuStateContext.Provider>
    );
}

const initialState = {
    refreshing: false,
    feedData: undefined,
    nextQuery: undefined,
    swipeGesturesEnabled: true,
};

const feedReducer = (draft, action) => {
    switch (action.type) {
        case 'refreshFeed': {
            console.log('CALL refreshFollowFeed');
            draft.refreshing = true;
            draft.nextQuery = undefined;
            return;
        }
        case 'updateFeed': {
            console.log('CALL updateFollowFeed');
            const {feedData, nextQuery} = action.payload;
            draft.refreshing = false;
            draft.feedData = feedData;
            draft.nextQuery = nextQuery;
            return;
        }
        case 'disableSwipeGestures': {
            draft.swipeGesturesEnabled = false;
            return;
        }
        case 'enableSwipeGestures': {
            draft.swipeGesturesEnabled = true;
            return;
        }
        default: {
            error('feedReducer called with invalid action');
        }
    }
};

const curriedFollowFeedReducerFunction = produce(feedReducer);

const FollowFeedState = React.memo(FollowFeedStateMemo, () => true);
export default FollowFeedState;
function FollowFeedStateMemo({children}) {
    console.log('RENDER FollowFeedStateMemo');
    const [state, dispatch] = React.useReducer(
        curriedFollowFeedReducerFunction,
        initialState,
    );
    const stateValue = React.useMemo(
        () => ({
            state,
        }),
        [state],
    );
    const dispatchValue = React.useMemo(
        () => ({
            dispatch,
        }),
        [dispatch],
    );

    return (
        <FollowFeedStateContext.Provider value={stateValue}>
            <FollowFeedDispatchContext.Provider value={dispatchValue}>
                {children}
            </FollowFeedDispatchContext.Provider>
        </FollowFeedStateContext.Provider>
    );
}

const initialHomeNavState = {
    feedFilter: 'home',
};

const homeNavReducer = (draft, action) => {
    switch (action.type) {
        case 'setFollowFeedHome': {
            console.log('CALL setFollowFeedHome');
            draft.feedFilter = 'home';
            return;
        }
        case 'setFollowFeedDrafts': {
            console.log('CALL setFollowFeedDrafts');
            draft.feedFilter = 'drafts';
            return;
        }
        case 'setFollowFeedActivity': {
            console.log('CALL setFollowFeedActivity');
            draft.feedFilter = 'activity';
            return;
        }
        default: {
            error('feedReducer called with invalid action');
        }
    }
};

const curriedHomeNavReducerFunction = produce(homeNavReducer);

export const FollowHomeNavState = React.memo(HomeNavStateMemo, () => true);
function HomeNavStateMemo({children}) {
    console.log('RENDER HomeNavStateMemo');
    const [state, dispatch] = React.useReducer(
        curriedHomeNavReducerFunction,
        initialHomeNavState,
    );
    const stateValue = React.useMemo(
        () => ({
            state,
        }),
        [state],
    );
    const dispatchValue = React.useMemo(
        () => ({
            dispatch,
        }),
        [dispatch],
    );

    return (
        <FollowHomeNavStateContext.Provider value={stateValue}>
            <FollowHomeNavDispatchContext.Provider value={dispatchValue}>
                {children}
            </FollowHomeNavDispatchContext.Provider>
        </FollowHomeNavStateContext.Provider>
    );
}
