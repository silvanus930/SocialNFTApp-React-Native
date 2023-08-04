import React from 'react';
import {ActivePersonaStateContext} from './ActivePersonaState';

export const ActivePersonaStateRefContext = React.createContext();

const ActivePersonaStateRef = React.memo(ActivePersonaStateRefMemo, () => true);
export default ActivePersonaStateRef;
function ActivePersonaStateRefMemo({children}) {
    const state = React.useContext(ActivePersonaStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <ActivePersonaStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </ActivePersonaStateRefContext.Provider>
    );
}
