import produce from 'immer';
import React from 'react';

const initalFullScreenMediaContext = {
    post: null,
    isFullScreen: false,
};
export const FullScreenMediaStateContext = React.createContext(
    initalFullScreenMediaContext,
);
export const FullScreenMediaDispatchContext = React.createContext();

const fullScreenMediaReducer = (draft, action) => {
    switch (action.type) {
        case 'setMediaPost': {
            console.log('CALL fullScreenMediaReducer.setMediaPost');
            draft.post = action.payload;
            draft.isFullScreen = true;
            return;
        }
        case 'clearMediaPost': {
            console.log('CALL fullScreenMediaReducer.clearMediaPost');
            draft.post = null;
            draft.isFullScreen = false;
            return;
        }
        default: {
            console.error('fullScreenMediaReducer called with invalid action');
        }
    }
};

const curriedFullScreenMediaReducer = produce(fullScreenMediaReducer);

const FullScreenMediaState = React.memo(FullScreenMediaStateMemo, () => true);
export default FullScreenMediaState;
function FullScreenMediaStateMemo({children}) {
    console.log('RENDER FeedStateMemo');
    const [state, dispatch] = React.useReducer(
        curriedFullScreenMediaReducer,
        initalFullScreenMediaContext,
    );
    const stateValue = React.useMemo(
        () => ({
            state,
        }),
        [state],
    );
    const dispatchValue = React.useMemo(
        () => ({
            dispatch,
        }),
        [dispatch],
    );

    return (
        <FullScreenMediaStateContext.Provider value={stateValue}>
            <FullScreenMediaDispatchContext.Provider value={dispatchValue}>
                {React.useMemo(() => children, [children])}
            </FullScreenMediaDispatchContext.Provider>
        </FullScreenMediaStateContext.Provider>
    );
}
