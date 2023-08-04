import React from 'react';
import {PersonaStateContext} from './PersonaState';

export const PersonaStateRefContext = React.createContext();

const PersonaStateRef = React.memo(PersonaStateRefMemo, () => true);
export default PersonaStateRef;
function PersonaStateRefMemo({children}) {
    const state = React.useContext(PersonaStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <PersonaStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </PersonaStateRefContext.Provider>
    );
}
