import React from 'react';
import {OptionsModalStateContext} from './OptionsModalState';

export const OptionsModalStateRefContext = React.createContext();

const OptionsModalStateRef = React.memo(OptionsModalStateRefMemo, () => true);
export default OptionsModalStateRef;
function OptionsModalStateRefMemo({children}) {
    const state = React.useContext(OptionsModalStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <OptionsModalStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </OptionsModalStateRefContext.Provider>
    );
}
