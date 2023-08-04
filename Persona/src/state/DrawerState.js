import React from 'react';

import produce from 'immer';

export const DrawerOpenStateContext = React.createContext();
export const DrawerOpenDispatchContext = React.createContext();

const initialState = {
    open: false,
    openRH: false,
};

const drawerReducer = (draft, action) => {
    switch (action.type) {
        case 'nowOpen': {
            //console.log('CALL drawerReducer.nowOpen');
            draft.open = true;
            return;
        }
        case 'nowOpenRH': {
            //console.log('CALL drawerReducer.nowOpenRH');
            draft.openRH = true;
            return;
        }
        case 'nowClosed': {
            //console.log('CALL drawerReducer.nowClosed');
            draft.open = false;
            return;
        }
        case 'nowClosedRH': {
            //console.log('CALL drawerReducer.nowClosed');
            draft.openRH = false;
            return;
        }
        default: {
            console.error('drawerReducer called with invalid action');
        }
    }
};

const curriedDrawerReducerFunction = produce(drawerReducer);

export const DrawerState = React.memo(DrawerStateMemo, () => true);
function DrawerStateMemo({children}) {
    //console.log('RENDER DrawerStateMemo');
    const [state, dispatch] = React.useReducer(
        curriedDrawerReducerFunction,
        initialState,
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
        <DrawerOpenStateContext.Provider value={stateValue}>
            <DrawerOpenDispatchContext.Provider value={dispatchValue}>
                {children}
            </DrawerOpenDispatchContext.Provider>
        </DrawerOpenStateContext.Provider>
    );
}
