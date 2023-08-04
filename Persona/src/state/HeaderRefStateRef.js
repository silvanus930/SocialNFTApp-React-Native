import React from 'react';
import {HeaderRefStateContext} from './HeaderRefState';

export const HeaderRefStateRefContext = React.createContext();

const HeaderRefStateRef = React.memo(HeaderRefStateRefMemo, () => true);
export default HeaderRefStateRef;
function HeaderRefStateRefMemo({children}) {
    const state = React.useContext(HeaderRefStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <HeaderRefStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </HeaderRefStateRefContext.Provider>
    );
}
