import React from 'react';
import {MessageModalStateContext} from './MessageModalState';

export const MessageModalStateRefContext = React.createContext();

const MessageModalStateRef = React.memo(MessageModalStateRefMemo, () => true);
export default MessageModalStateRef;
function MessageModalStateRefMemo({children}) {
    const state = React.useContext(MessageModalStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <MessageModalStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </MessageModalStateRefContext.Provider>
    );
}
