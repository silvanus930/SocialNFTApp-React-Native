import React from 'react';
import {NFTModalStateContext} from './NFTModalState';

export const NFTModalStateRefContext = React.createContext();

const NFTModalStateRef = React.memo(NFTModalStateRefMemo, () => true);
export default NFTModalStateRef;
function NFTModalStateRefMemo({children}) {
    const state = React.useContext(NFTModalStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <NFTModalStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </NFTModalStateRefContext.Provider>
    );
}
