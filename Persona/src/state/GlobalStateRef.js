import React from 'react';
import {GlobalStateContext} from 'state/GlobalState';

export const GlobalStateRefContext = React.createContext();

const GlobalStateRef = React.memo(GlobalStateRefMemo, () => true);
export default GlobalStateRef;
function GlobalStateRefMemo({children}) {
    const state = React.useContext(GlobalStateContext);
    const stateRef = React.useRef(state);
    const [personaCacheMap, setPersonaCacheMap] = React.useState({});
    React.useEffect(() => {
        stateRef.current = {...state, personaCacheMap: {...personaCacheMap}};
    }, [state, personaCacheMap]);

    return (
        <GlobalStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </GlobalStateRefContext.Provider>
    );
}
