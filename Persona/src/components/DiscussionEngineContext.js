import React from 'react';
import {uniqueArray} from 'utils/helpers';

export const DiscussionEngineStateContext = React.createContext();
export const DiscussionEngineDispatchContext = React.createContext();
export const DiscussionEngineFrameStateContext = React.createContext();
export const DiscussionEngineFrameDispatchContext = React.createContext();

export function anySelected(selected) {
    return (
        Object.values({...selected, initialValue: 0}).reduce((a, b) => a + b) >
        0
    );
}

export function listSelected(selected) {
    return Object.entries(selected)
        .filter(([key, show]) => show)
        .map(([key, show]) => key);
}

function commentPress(state, key) {
    let newState = {...state};
    if (state.editComment) {
        newState.editComment = null;
        return newState;
    }
    let anyCommentsSelected = anySelected(state.commentsSelected);
    if (anyCommentsSelected) {
        const newCommentSelected = {
            ...state.commentsSelected,
            [key]: !state.commentsSelected[key],
        };
        newState.commentsSelected = newCommentSelected;
        anyCommentsSelected = anySelected(newCommentSelected);
        newState.showEditMenuKey = anyCommentsSelected ? key : null;
        return newState;
    } else {
        newState.showCommentEndorsementOptions = {
            [key]: state.showCommentEndorsementOptions[key]
                ? !state.showCommentEndorsementOptions[key]
                : true,
        };
        newState.showEditMenuKey = key;
        return newState;
    }
}

function commentLongPress(state, key) {
    let newState = {...state};
    newState.showCommentEndorsementOptions = {
        [key]: true,
    };
    newState.commentsSelected = {
        [key]: true,
    };
    newState.showEditMenuKey = key;
    return newState;
}

function discussionEngineReducer(state, action) {
    switch (action.type) {
        case 'receivedNewComments': {
            const {
                numberUnseenCommentsOnlyAtEnd,
                numberThreads,
                numberUnseenThreadsAtEnd,
                numberUnseenCommentsAtEnd,
                numberUnseenCommentsAtEndAbsolute,
                numberSeenPerCommentGroup,
                commentsMap,
                firstThreadID,
            } = action.payload;
            let newState = {
                ...state,
                numberThreads,
                numberUnseenCommentsOnlyAtEnd,
                numberSeenPerCommentGroup: {
                    ...state.numberSeenPerCommentGroup,
                    ...numberSeenPerCommentGroup,
                },
                commentsMap: {...state.commentsMap, ...commentsMap},
                numberUnseenCommentsAtEndAbsolute,
                numberUnseenThreadsAtEnd,
            };
            if (firstThreadID !== undefined) {
                newState.firstThreadID = firstThreadID;
            }
            if (numberUnseenCommentsAtEnd !== undefined) {
                newState.numberUnseenCommentsAtEnd = numberUnseenCommentsAtEnd;
            }
            return newState;
        }
        case 'commentPress': {
            return commentPress(state, action.payload);
        }
        case 'commentLongPress': {
            return commentLongPress(state, action.payload);
        }
        case 'clearEndorsementMenu': {
            return {...state, showCommentEndorsementOptions: {}};
        }
        case 'setInvertedFlatlist': {
            const invertedFlatlist = action.payload;
            return {
                ...state,
                invertedFlatlist,
            };
        }
        case 'setHeaderHeight': {
            const headerHeight = action.payload;
            return {...state, headerHeight};
        }
        case 'toggleShowEndorsementsMenu': {
            const showEndorsements = action.payload;
            return {...state, showEndorsements};
        }
        case 'exitShowEndorsementsMenu': {
            return {
                ...state,
                showEndorsements: {
                    key: null,
                    endorsers: [],
                    emoji: null,
                    pressY: null,
                },
            };
        }
        case 'setIdentityID': {
            const identityID = action.payload;
            return {...state, identityID};
        }
        case 'clearShowEditMenu': {
            return {...state, showEditMenuKey: null};
        }
        case 'setEditComment': {
            const editComment = action.payload;
            return {...state, editComment};
        }
        case 'clearEditComment': {
            return {...state, editComment: null};
        }
        case 'setReplyComment': {
            const replyComment = action.payload;
            return {...state, replyComment};
        }
        case 'clearReplyComment': {
            return {...state, replyComment: null};
        }
        case 'clearSelectedComments': {
            return {...state, commentsSelected: {}};
        }
        case 'addCommentsDeleted': {
            const newCommentsDeleted = action.payload;
            return {
                ...state,
                commentsDeleted: {
                    ...state.commentsDeleted,
                    ...newCommentsDeleted,
                },
            };
        }
        case 'toggleKeyboard': {
            return {...state, toggleKeyboard: !state.toggleKeyboard};
        }
    case 'toggleKeyboardOff': {
            return {...state, toggleKeyboard: false};
        }
        case 'toggleScrollToStart': {
            return {...state, toggleScrollToStart: !state.toggleScrollToStart};
        }
        case 'toggleScrollWhenCancelingThreadReply': {
            return {
                ...state,
                toggleScrollWhenCancelingThreadReply:
                    !state.toggleScrollWhenCancelingThreadReply,
            };
        }
        case 'toggleScrollToIndex': {
            return {
                ...state,
                toggleScrollToIndex: action.payload,
            };
        }
        case 'setThreadID': {
            const threadID = action.payload;
            return {...state, threadID};
        }
        case 'clearThread': {
            return {...state, threadID: null};
        }
        case 'setPersonaID': {
            const personaID = action.payload;
            return {...state, personaID};
        }
        case 'setThreadView': {
            const threadView = action.payload;
            return {...state, threadView};
        }
        case 'hideDiscussion': {
            return {...state, renderDiscussionPreview: true};
        }
        case 'showDiscussion': {
            return {...state, renderDiscussionPreview: false};
        }
        case 'setEditingPost': {
            const editingPost = action.payload;
            return {...state, editingPost};
        }
        case 'setCreateDiscussionHeight': {
            const createDiscussionHeight = action.payload;
            return {...state, createDiscussionHeight};
        }
        case 'setOpenThreadIDs': {
            const threadID = action.payload;
            const openThreadIDs = [...state.openThreadIDs, threadID];
            const uniq = uniqueArray(openThreadIDs);

            return {...state, openThreadIDs: uniq};
        }
        case 'setReplyUserName': {
            const replyUserName = action.payload;
            return {...state, replyUserName};
        }
        case 'setCommentViewHeight': {
            const height = action.payload;
            const commentViewHeight = {...state.commentViewHeight, ...height};

            return {...state, commentViewHeight};
        }
        case 'setCommentsLoaded': {
            const commentsLoaded = action.payload;
            return {...state, commentsLoaded};
        }        
        case 'setEndorsementsModalProps': {
            const endorsementsModalProps = action.payload;
            return {...state, endorsementsModalProps};
        }
        case 'setCommentSelect': {
            const commentsSelected = action.payload;
            return {...state, commentsSelected};
        }
        case 'updateCommentsData': {
            const {commentsData} = action.payload;
            return {...state, commentsData};
        }
        case 'prependLiveCommentsData': {
            const {liveComments} = action.payload;
            let commentsData = state.commentsData || [];
            if (
                liveComments &&
                commentsData.length > 0 &&
                liveComments?.commentKey !== commentsData[0]?.commentKey
            ) {
                commentsData = [liveComments, ...state.commentsData];
            }

            if(liveComments && commentsData.length === 0) {
                commentsData = [liveComments];
            }
            return {...state, commentsData};
        }
        case 'prependNewerCommentsData': {
            const {newData} = action.payload;
            let commentsData = state.commentsData || [];
            if(newData && commentsData.length > 0) {
                commentsData = [...newData, ...state.commentsData];
            }
            if(newData && commentsData.length === 0) {
                commentsData=[...newData];
            }
            return {...state, commentsData};
        }
        case 'updateNextQuery': {
            const {nextQuery} = action.payload;
            return {...state, nextQuery};
        }
        case 'triggerUpdateList': {
            const updateList = !state.updateList;
            return {...state, updateList};
        }
        case 'updateDoc': {
            const {newCommentData} = action.payload;
            let commentsData = state.commentsData;
            if(commentsData && newCommentData) {
                
                commentsData = state.commentsData.map(
                    comment => {
                        const match = newCommentData.find(c => c.commentKey === comment.commentKey);
                        return Boolean(match)
                            ? match
                            : comment
                    }
                );
            }
            
            return {...state, commentsData};
        }
        case 'setFlashlistLoaded': {
            const flashListLoaded = action.payload;
            return {...state, flashListLoaded}
        }
        case 'triggerNoMoreDocs': {
            const noMoreDocs = action.payload;
            return {...state, noMoreDocs}
        }
        case 'setDidScroll': {
            const didScroll = action.payload;
            return {...state, didScroll}
        }
        case 'setNowTimestamp': {
            const nowTimestamp = action.payload;
            return {...state, nowTimestamp}
        }
        case 'setLoadedNewerMessages': {
            const loadedNewerMessages = action.payload;
            return {...state, loadedNewerMessages}
        }
        case 'expandComment': {
            const key = action.payload;

            let newState = {...state};

            newState.expandItemReplyComment = {
                ...state.expandItemReplyComment,
                [key]: true,
            }

            return newState;
        }
        default: {
            throw new Error(`Unhandled action type: ${action.type}`);
        }
    }
}

function discussionEngineFrameReducer(state, action) {
    switch (action.type) {
        case 'setPostHeight': {
            const postHeight = action.payload;
            return {...state, postHeight};
        }
        case 'setContentVisibleHeight': {
            const contentVisibleHeight = action.payload;
            return {...state, contentVisibleHeight};
        }
        case 'setContentLength': {
            const contentLength = action.payload;
            return {...state, contentLength};
        }
        case 'setListOffset': {
            const offsetY = action.payload;
            return {...state, offsetY};
        }
        default: {
            throw new Error(`Unhandled action type: ${action.type}`);
        }
    }
}

export const DiscussionEngineFrameModalState = React.memo(
    DiscussionEngineFrameModalStateMemo,
    () => true,
);

export const DiscussionEngineFrameState = React.memo(
    DiscussionEngineFrameStateMemo,
    () => true,
);

export function DiscussionEngineFrameModalStateMemo({children}) {
    const [state, dispatch] = React.useReducer(discussionEngineFrameReducer, {
        listFrames: {},
        contentBeyondScreen: false,
        contentLength: 1000,
        contentVisibleHeight: 0,
        postHeight: 0,
        offsetY: 0,
    });
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
        <DiscussionEngineFrameStateContext.Provider value={stateValue}>
            <DiscussionEngineFrameDispatchContext.Provider
                value={dispatchValue}>
                {children}
            </DiscussionEngineFrameDispatchContext.Provider>
        </DiscussionEngineFrameStateContext.Provider>
    );
}
export function DiscussionEngineFrameStateMemo({children}) {
    const [state, dispatch] = React.useReducer(discussionEngineFrameReducer, {
        listFrames: {},
        contentBeyondScreen: false,
        contentLength: 1000,
        contentVisibleHeight: 0,
        postHeight: 0,
        offsetY: 0,
    });
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

    //console.log('RENDERING DEFRAMESTATECONTEXT');

    return (
        <DiscussionEngineFrameStateContext.Provider value={stateValue}>
            <DiscussionEngineFrameDispatchContext.Provider
                value={dispatchValue}>
                {children}
            </DiscussionEngineFrameDispatchContext.Provider>
        </DiscussionEngineFrameStateContext.Provider>
    );
}

export const DiscussionEngineModalState = React.memo(
    DiscussionEngineModalStateMemo,
    () => true,
);
const DiscussionEngineState = React.memo(DiscussionEngineStateMemo, () => true);
export default DiscussionEngineState;
function DiscussionEngineStateMemo({children}) {
    const [state, dispatch] = React.useReducer(discussionEngineReducer, {
        editingPost: false,
        createDiscussionHeight: 70,
        personaID: null,
        identityID: null,
        numberSeenPerCommentGroup: {},
        itemHeights: {},
        editComment: null,
        remixComment: null,
        replyComment: null,
        commentsDeleted: {},
        commentsSelected: {},
        showEditMenuKey: null,
        showCommentEndorsementOptions: {},
        commentsMap: {},
        invertedFlatlist: true,
        headerHeight: 0,
        showEndorsements: {
            key: null,
            endorsers: [],
            emoji: null,
            pressY: null,
        },
        threadID: null,
        firstThreadID: null,
        toggleKeyboard: undefined,
        toggleScrollToStart: undefined,
        toggleScrollWhenCancelingThreadReply: undefined,
        toggleScrollToIndex: undefined,
        numHiddenComments: undefined,
        numberUnseenCommentsAtEnd: 0,
        numberUnseenCommentsAtEndAbsolute: 0,
        numberUnseenThreadsAtEnd: 0,
        numberUnseenCommentsOnlyAtEnd: 0,
        threadView: false,
        numberThreads: 0,
        openThreadIDs: [],
        replyUserName: '',
        commentViewHeight: {},
        commentsLoaded: false,
        endorsementsModalProps: {},
        fullHeaderVisible: true,
        commentsData: undefined,
        nextQuery: undefined,
        updateList: false,        
        flashListLoaded: false,
        noMoreDocs: false,
        didScroll: false,
        nowTimestamp: null,
        loadedNewerMessages: false,
        expandItemReplyComment: {},
    });
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

    //console.log('RENDERING DESTATECONTEXT');

    return (
        <DiscussionEngineStateContext.Provider value={stateValue}>
            <DiscussionEngineDispatchContext.Provider value={dispatchValue}>
                {children}
            </DiscussionEngineDispatchContext.Provider>
        </DiscussionEngineStateContext.Provider>
    );
}

function DiscussionEngineModalStateMemo({children}) {
    const [state, dispatch] = React.useReducer(discussionEngineReducer, {
        editingPost: false,
        createDiscussionHeight: 70,
        personaID: null,
        identityID: null,
        numberSeenPerCommentGroup: {},
        itemHeights: {},
        editComment: null,
        remixComment: null,
        replyComment: null,
        commentsDeleted: {},
        commentsSelected: {},
        showEditMenuKey: null,
        showCommentEndorsementOptions: {},
        commentsMap: {},
        invertedFlatlist: true,
        headerHeight: 0,
        showEndorsements: {
            key: null,
            endorsers: [],
            emoji: null,
            pressY: null,
        },
        threadID: null,
        firstThreadID: null,
        toggleKeyboard: undefined,
        toggleScrollToStart: undefined,
        toggleScrollWhenCancelingThreadReply: undefined,
        toggleScrollToIndex: undefined,
        numHiddenComments: undefined,
        numberUnseenCommentsAtEnd: 0,
        numberUnseenCommentsAtEndAbsolute: 0,
        numberUnseenThreadsAtEnd: 0,
        numberUnseenCommentsOnlyAtEnd: 0,
        threadView: false,
        numberThreads: 0,
        openThreadIDs: [],
        replyUserName: '',
        commentViewHeight: {},
        commentsLoaded: false,
        endorsementsModalProps: {},
        fullHeaderVisible: true,
        commentsData: undefined,
        nextQuery: undefined,
        updateList: false,        
        flashListLoaded: false,
        noMoreDocs: false,
        didScroll: false,
        nowTimestamp: null,
        loadedNewerMessages: false,
        expandItemReplyComment: {},
    });
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
        <DiscussionEngineStateContext.Provider value={stateValue}>
            <DiscussionEngineDispatchContext.Provider value={dispatchValue}>
                {children}
            </DiscussionEngineDispatchContext.Provider>
        </DiscussionEngineStateContext.Provider>
    );
}
