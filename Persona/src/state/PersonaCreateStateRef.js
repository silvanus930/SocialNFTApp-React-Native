import React from 'react';
import {PersonaCreateStateContext} from './PersonaCreateState';

export const PersonaCreateStateRefContext = React.createContext();

const PersonaCreateStateRef = React.memo(PersonaCreateStateRefMemo, () => true);
export default PersonaCreateStateRef;
function PersonaCreateStateRefMemo({children}) {
    const state = React.useContext(PersonaCreateStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <PersonaCreateStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </PersonaCreateStateRefContext.Provider>
    );
}
