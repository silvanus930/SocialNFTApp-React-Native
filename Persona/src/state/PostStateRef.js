import React from 'react';
import {PostStateContext} from './PostState';

export const PostStateRefContext = React.createContext();

const PostStateRef = React.memo(PostStateRefMemo, () => true);
export default PostStateRef;
function PostStateRefMemo({children}) {
    const state = React.useContext(PostStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <PostStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </PostStateRefContext.Provider>
    );
}
