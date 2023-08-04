import React from 'react';
import {InviteModalStateContext} from './InviteModalState';

export const InviteModalStateRefContext = React.createContext();

const InviteModalStateRef = React.memo(InviteModalStateRefMemo, () => true);
export default InviteModalStateRef;
function InviteModalStateRefMemo({children}) {
    const state = React.useContext(InviteModalStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <InviteModalStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </InviteModalStateRefContext.Provider>
    );
}
