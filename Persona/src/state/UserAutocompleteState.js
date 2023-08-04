import React, {createContext, useState} from 'react';

export const UserAutocompleteContext = createContext({
    query: null,
    setQuery: () => {},
    selectedUser: null,
    setSelectedUser: () => {},
    dialogAllowed: false,
    setDialogAllowed: () => {},
});

const UserAutocompleteState = React.memo(
    UserAutocompleteStateWrapped,
    () => true,
);
export default UserAutocompleteState;
function UserAutocompleteStateWrapped({children}) {
    const [query, setQuery] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [dialogAllowed, setDialogAllowed] = useState(false);
    React.useEffect(() => {
        if (!dialogAllowed) {
            setQuery(null);
        }
    }, [dialogAllowed]);
    return (
        <UserAutocompleteContext.Provider
            value={{
                query,
                setQuery,
                selectedUser,
                setSelectedUser,
                dialogAllowed,
                setDialogAllowed,
            }}>
            {children}
        </UserAutocompleteContext.Provider>
    );
}
