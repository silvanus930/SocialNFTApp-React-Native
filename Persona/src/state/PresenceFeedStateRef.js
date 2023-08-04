import React from 'react';
import {PresenceFeedStateContext} from './PresenceFeedState';

export const PresenceFeedStateRefContext = React.createContext();

const PresenceFeedStateRef = React.memo(PresenceFeedStateRefMemo, () => true);
export default PresenceFeedStateRef;
function PresenceFeedStateRefMemo({children}) {
    const state = React.useContext(PresenceFeedStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <PresenceFeedStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </PresenceFeedStateRefContext.Provider>
    );
}
