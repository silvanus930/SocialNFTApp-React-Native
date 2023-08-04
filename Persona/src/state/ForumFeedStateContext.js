import React from 'react';
import produce from 'immer';
import {cerror} from 'utils/log';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {LayoutAnimation} from 'react-native';

const CUSTOM_LOG_WARN_HEADER = '!! HomeStateContext';
const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);

export const ForumFeedStateContext = React.createContext();
export const ForumFeedDispatchContext = React.createContext();

const initialState = {
    refreshing: false,
    feedData: undefined,
    nextQuery: undefined,
    swipeGesturesEnabled: true,
};

const feedReducer = (draft, action) => {
    switch (action.type) {
        case 'reset': {
            draft.refreshing = false;
            draft.feedData = undefined;
            draft.nextQuery = undefined;
            return;
        }
        case 'refreshFeed': {
            console.log('CALL forumRefreshFeed');
            draft.refreshing = true;
            draft.nextQuery = undefined;
            return;
        }
        case 'updateFeed': {
            console.log('CALL forumUpdateFeed');
            const {feedData, nextQuery} = action.payload;
            draft.refreshing = false;
            draft.feedData = feedData;
            draft.nextQuery = nextQuery;
            return;
        }
        default: {
            error(
                'feedReducer (ForumFeedStateContext) called with invalid action',
            );
        }
    }
};

const curriedForumFeedReducerFunction = produce(feedReducer);

const ForumFeedState = React.memo(ForumFeedStateMemo, () => true);
export default ForumFeedState;
function ForumFeedStateMemo({children}) {
    console.log('RENDER ForumFeedStateMemo');
    const [state, dispatch] = React.useReducer(
        curriedForumFeedReducerFunction,
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
        <ForumFeedStateContext.Provider value={stateValue}>
            <ForumFeedDispatchContext.Provider value={dispatchValue}>
                {children}
            </ForumFeedDispatchContext.Provider>
        </ForumFeedStateContext.Provider>
    );
}
