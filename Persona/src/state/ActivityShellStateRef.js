import React from 'react';
import {ActivityShellStateContext} from './ActivityShellState';

export const ActivityShellStateRefContext = React.createContext();

const ActivityShellStateRef = React.memo(ActivityShellStateRefMemo, () => true);
export default ActivityShellStateRef;
function ActivityShellStateRefMemo({children}) {
    const state = React.useContext(ActivityShellStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <ActivityShellStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </ActivityShellStateRefContext.Provider>
    );
}
