import React from 'react';
import {NavStateContext} from './NavState';

export const NavStateRefContext = React.createContext();

const NavStateRef = React.memo(NavStateRefMemo, () => true);
export default NavStateRef;
function NavStateRefMemo({children}) {
    const state = React.useContext(NavStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <NavStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </NavStateRefContext.Provider>
    );
}
