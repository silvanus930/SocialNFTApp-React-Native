import React from 'react';
import {ActivityModalStateContext} from './ActivityModalState';

export const ActivityModalStateRefContext = React.createContext();

const ActivityModalStateRef = React.memo(ActivityModalStateRefMemo, () => true);
export default ActivityModalStateRef;
function ActivityModalStateRefMemo({children}) {
    const state = React.useContext(ActivityModalStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <ActivityModalStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </ActivityModalStateRefContext.Provider>
    );
}
