import React from 'react';
import {CommunityStateContext} from './CommunityState';

export const CommunityStateRefContext = React.createContext();

const CommunityStateRef = React.memo(CommunityStateRefMemo, () => true);
export default CommunityStateRef;
function CommunityStateRefMemo({children}) {
    const state = React.useContext(CommunityStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <CommunityStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </CommunityStateRefContext.Provider>
    );
}
