import React, {useState, useMemo, useRef, useEffect} from 'react';
import auth from '@react-native-firebase/auth';
import baseText from 'resources/text';
import {
    Animated,
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import colors from 'resources/colors';
import palette from 'resources/palette';
import ParseText from 'components/ParseText';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineStateContext,
} from './DiscussionEngineContext';
import isEqual from 'lodash.isequal';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(DiscussionCommentReply, propsAreEqual);

function DiscussionCommentReply({
    transparentBackground = false,
    item,
    isSelf,
    parentObjPath,
    headerProps,
    THREAD_OFFSET,
    commentListRef,
    index,
}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const commentSelected = state.commentsSelected[item.commentKey];
    const invertedFlatlist = state.invertedFlatlist;

    return useMemo(
        () => (
            <DiscussionCommentReplyMemo
                item={item}
                commentSelected={commentSelected}
                headerProps={headerProps}
                parentObjPath={parentObjPath}
                isSelf={isSelf}
                transparentBackground={transparentBackground}
                THREAD_OFFSET={THREAD_OFFSET}
                commentListRef={commentListRef}
                index={index}
                invertedFlatlist={invertedFlatlist}
            />
        ),
        [
            item,
            commentSelected,
            parentObjPath,
            isSelf,
            headerProps,
            THREAD_OFFSET,
            commentListRef,
            index,
            invertedFlatlist,
        ],
    );
}

function DiscussionCommentReplyMemo({
    item,
    commentSelected,
    transparentBackground = false,
    isSelf,
    headerProps,
    parentObjPath,
    possibleReplyUser,
    possibleReplyIdentity,
    possibleThreadUser,
    possibleThreadIdentity,
    THREAD_OFFSET,
    commentListRef,
    index,
    invertedFlatlist,
}) {
    const {
        current: {personaMap},
    } = React.useContext(GlobalStateRefContext);
    let personaID = headerProps?.personaID;
    let canChat =
        personaID &&
        personaMap &&
        personaMap[personaID] &&
        personaMap[personaID].authors
            ? personaMap[personaID].authors?.includes(auth().currentUser.uid) ||
              personaMap[personaID].publicCanChat
            : true;
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const IMAGE_WIDTH = 300;
    const CHAT_MARGIN = 50;
    let isChat = parentObjPath.includes('chat');
    let backgroundColor = commentSelected
        ? colors.redHighlight
        : isSelf
        ? isChat
            ? colors.lightHighlight
            : colors.homeBackground
        : colors.homeBackground;
    const commentOpacity = React.useRef(new Animated.Value(1)).current;
    let opacity = commentOpacity;
    const replyInputRef = useRef();
    const onPressReply = React.useCallback(() => {
        dispatch({type: 'setThreadID', payload: item.comment.commentKey});
        // dispatch({type: 'setInvertedFlatlist', payload: true});
        dispatch({type: 'toggleKeyboard'});
        dispatch({
            type: 'setReplyUserName',
            payload: item.comment.replyUserName,
        });
        dispatch({type: 'toggleScrollToIndex', payload: index});
    }, [dispatch, item, canChat, invertedFlatlist]);
    return (
        <>
            <View
                style={{
                    ...Styles.infoContainer,
                    flex: 1,
                    marginLeft: THREAD_OFFSET,
                    marginBottom: 6,
                }}>
                <Animated.View style={Styles.textContainer}>
                    <Animated.View
                        style={{
                            backgroundColor,
                            opacity,
                            flex: 1,
                            ...Styles.textBlob,
                            borderColor: 'orange',
                            borderWidth: 0,
                            marginEnd: 10,
                            width:
                                Dimensions.get('window').width -
                                THREAD_OFFSET -
                                CHAT_MARGIN,
                        }}
                        ref={replyInputRef}>
                        <TouchableOpacity
                            activeOpacity={1}
                            delayLongPress={300}
                            onPress={onPressReply}>
                            <View
                                style={{
                                    marginLeft: 10,
                                    marginRight: 10,
                                    width: '100%',
                                }}>
                                <ParseText
                                    style={{
                                        padding: 0,
                                        color: colors.maxFaded,
                                        fontSize: 17,
                                    }}
                                    text={'Write a reply...'}
                                />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </View>
        </>
    );
}

const Styles = StyleSheet.create({
    textContainer: {
        flexDirection: 'row',
        borderColor: 'orange',
        borderWidth: 0,
        flex: 0,
        marginLeft: 6,
    },
    infoContainer: {
        marginTop: 2,
        borderColor: 'purple',
        borderWidth: 0,
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    textBlob: {
        justifyContent: 'flex-start',
        marginTop: 2,
        flex: 0,
        marginStart: 32,
        marginBottom: 0,
        borderRadius: 11,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 3.5,
        paddingRight: 3.5,
    },
});
