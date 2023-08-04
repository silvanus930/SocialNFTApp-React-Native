import React from 'react';
import {RoomsRenderStateContext} from './RoomsRenderState';

export const RoomsRenderStateRefContext = React.createContext();

const RoomsRenderStateRef = React.memo(RoomsRenderStateRefMemo, () => true);
export default RoomsRenderStateRef;
function RoomsRenderStateRefMemo({children}) {
    const state = React.useContext(RoomsRenderStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <RoomsRenderStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </RoomsRenderStateRefContext.Provider>
    );
}
