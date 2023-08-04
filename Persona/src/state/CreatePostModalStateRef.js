import React from 'react';
import {CreatePostModalStateContext} from './CreatePostModalState';

export const CreatePostModalStateRefContext = React.createContext();

const CreatePostModalStateRef = React.memo(
    CreatePostModalStateRefMemo,
    () => true,
);
export default CreatePostModalStateRef;
function CreatePostModalStateRefMemo({children}) {
    const state = React.useContext(CreatePostModalStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <CreatePostModalStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </CreatePostModalStateRefContext.Provider>
    );
}
