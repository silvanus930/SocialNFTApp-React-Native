import React from 'react';
import {clog, cwarn} from 'utils/log';
import DiscussionEngine from './DiscussionEngine';

const CUSTOM_LOG_WARN_HEADER = '!! components/ActivityChatScreen';
const log = (...args) =>
    global.LOG_DEBUG && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_DEBUG && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);

export default function ActivityChatScreen({
    navigation,
    chatDocPath,
    scrollToMessageID,
    showSeenIndicators = true,
    discussionTitle,
    openToThreadID = null,
}) {
    const headerProps = {
        chatDocPath,
    };

    console.log(Platform.OS, 'rendering ActivityChatScreen', chatDocPath);
    return (
        <DiscussionEngine
            renderFromTop={false}
            hideFirstTimelineSegment={true}
            parentObjPath={chatDocPath}
            collectionName={'messages'}
            discussionTitle={discussionTitle}
            headerType={'activityChat'}
            headerProps={headerProps}
            navigation={navigation}
            scrollToMessageID={scrollToMessageID}
            showSeenIndicators={showSeenIndicators}
            openToThreadID={openToThreadID}
        />
    );
}
