import React from 'react';
import {RemixRenderStateContext} from './RemixRenderState';

export const RemixRenderStateRefContext = React.createContext();

const RemixRenderStateRef = React.memo(RemixRenderStateRefMemo, () => true);
export default RemixRenderStateRef;
function RemixRenderStateRefMemo({children}) {
    const state = React.useContext(RemixRenderStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <RemixRenderStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </RemixRenderStateRefContext.Provider>
    );
}
