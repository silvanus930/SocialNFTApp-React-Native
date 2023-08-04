import React from 'react';
import {IdentityModalStateContext} from './IdentityModalState';

export const IdentityModalStateRefContext = React.createContext();

const IdentityModalStateRef = React.memo(IdentityModalStateRefMemo, () => true);
export default IdentityModalStateRef;
function IdentityModalStateRefMemo({children}) {
    const state = React.useContext(IdentityModalStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <IdentityModalStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </IdentityModalStateRefContext.Provider>
    );
}
