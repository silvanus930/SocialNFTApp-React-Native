import React from 'react';
import produce from 'immer';

export const initialState = {
    matchingUsers: [],
    personaID: null,
    anonymous: null,
    showInviteDialog: false,
    pageY: 0,
};
export const UserAuthorCompleteDialogStateContext = React.createContext();
export const UserAuthorCompleteDialogDispatchContext = React.createContext();
export const UserCommunityCompleteDialogStateContext = React.createContext();
export const UserCommunityCompleteDialogDispatchContext = React.createContext();

function userAutoCompleteDialogReducer(draft, action) {
    switch (action.type) {
        case 'reset': {
            console.log('CALL userAutoCompleteDialogReducer.reset');
            draft.matchingUsers = [];
            draft.personaID = null;
            draft.anonymous = null;
            draft.showInviteDialog = false;
            draft.pageY = 0;
            draft.isAuthorInvite = null;
            return;
        }
        case 'showDialog': {
            console.log('CALL userAutoCompleteDialogReducer.showDialog');
            const {pageY, personaID, anonymous} = action.payload;
            draft.showInviteDialog = true;
            draft.pageY = pageY;
            draft.personaID = personaID;
            draft.anonymous = anonymous;
            return;
        }
        case 'setMatchingUsers': {
            console.log('CALL userAutoCompleteDialogReducer.setMatchingUsers');
            draft.matchingUsers = action.payload;
            return;
        }
        default: {
            throw new Error(`Unhandled action type: ${action.type}`);
        }
    }
}

const curriedUserAutoCompleteDialogReducer = produce(
    userAutoCompleteDialogReducer,
);
export const UserAutoCompleteDialogState = React.memo(
    UserAutoCompleteDialogStateMemo,
);
export function UserAutoCompleteDialogStateMemo({
    children,
    authorDialog = true,
}) {
    const [state, dispatch] = React.useReducer(
        curriedUserAutoCompleteDialogReducer,
        initialState,
    );
    const stateValue = React.useMemo(() => state, [state]);
    const dispatchValue = React.useMemo(() => dispatch, [dispatch]);

    if (authorDialog) {
        return (
            <UserAuthorCompleteDialogStateContext.Provider value={stateValue}>
                <UserAuthorCompleteDialogDispatchContext.Provider
                    value={dispatchValue}>
                    {children}
                </UserAuthorCompleteDialogDispatchContext.Provider>
            </UserAuthorCompleteDialogStateContext.Provider>
        );
    } else {
        return (
            <UserCommunityCompleteDialogStateContext.Provider
                value={stateValue}>
                <UserCommunityCompleteDialogDispatchContext.Provider
                    value={dispatchValue}>
                    {children}
                </UserCommunityCompleteDialogDispatchContext.Provider>
            </UserCommunityCompleteDialogStateContext.Provider>
        );
    }
}
