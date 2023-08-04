import React, {createContext, useState} from 'react';

export const ActivityIndicatorContext = createContext({
    numUnseenEvents: 0,
    setNumUnseenEvents: () => {},
});

export default function ActivityIndicatorState({children}) {
    const [numUnseenEvents, setNumUnseenEvents] = useState(null);
    return (
        <ActivityIndicatorContext.Provider
            value={{numUnseenEvents, setNumUnseenEvents}}>
            {children}
        </ActivityIndicatorContext.Provider>
    );
}
