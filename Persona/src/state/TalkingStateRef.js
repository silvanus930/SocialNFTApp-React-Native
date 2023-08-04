import React from 'react';
import {TalkingStateContext} from './TalkingState';

export const TalkingStateRefContext = React.createContext();

const TalkingStateRef = React.memo(TalkingStateRefMemo, () => true);
export default TalkingStateRef;
function TalkingStateRefMemo({children}) {
    const state = React.useContext(TalkingStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <TalkingStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </TalkingStateRefContext.Provider>
    );
}
