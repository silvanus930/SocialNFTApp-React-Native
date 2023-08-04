import React, {useState} from 'react';

export const CommunityStateContext = React.createContext({
    audioManager: null,
    setRoomState: () => {},
    presenceObjPath: null,
});

export default function CommunityState({children}) {
    const [currentCommunity, setCurrentCommunity] = useState(null);
    const [communityMap, setCommunityMap] = useState({});

    // Ken: I added these variables for the scenario that we need to pass through for notifications
    // Consider refactoring these out of community state
    const [openToThreadID, setOpenToThreadID] = useState(null);
    const [scrollToMessageID, setScrollToMessageID] = useState(null);

    // For backwards compatibility - surely there's a better way to do this...
    const csetState = React.useCallback(
        ({
            communityMap: newCommunityMap,
            currentCommunity: newCurrentCommunity,
            openToThreadID: newOpenToThreadID,
            scrollToMessageID: newScrollToMessageID,
        }) => {
            if (newCommunityMap) {
                setCommunityMap(newCommunityMap);
            }

            if (newCurrentCommunity) {
                setCurrentCommunity(newCurrentCommunity);
            } else if (newCurrentCommunity === 'clear') {
                setCurrentCommunity(null);
            }

            if (newOpenToThreadID === 'clear') { // just copying logic above
                setOpenToThreadID(null);
            } else if(newOpenToThreadID) {
                setOpenToThreadID(newOpenToThreadID);
            }

            if(newScrollToMessageID === 'clear') { // just copying logic above
                setScrollToMessageID(null);
            } else if(newScrollToMessageID) {
                setScrollToMessageID(newScrollToMessageID);
            } 
        },
        [setCurrentCommunity, setCommunityMap],
    );

    return (
        <CommunityStateContext.Provider
            value={{
                currentCommunity,
                communityMap,
                csetState: csetState,
                setCommunityMap: setCommunityMap,
                openToThreadID,
                scrollToMessageID,
            }}>
            {children}
        </CommunityStateContext.Provider>
    );
}
