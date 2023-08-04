import React from 'react';
import {PresenceStateContext} from './PresenceState';

export const PresenceStateRefContext = React.createContext();

const PresenceStateRef = React.memo(PresenceStateRefMemo, () => true);
export default PresenceStateRef;
function PresenceStateRefMemo({children}) {
    const state = React.useContext(PresenceStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <PresenceStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </PresenceStateRefContext.Provider>
    );
}
