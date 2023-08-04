import React from 'react';
import DiscussionEngine from 'components/DiscussionEngine';
import {PersonaStateContext} from 'state/PersonaState';

export default function PostDiscussionScreen({
    renderFromTop = true,
    navigation,
    communityID,
    personaKey,
    postKey,
    // scrollToMessageID,
    // openToThreadID = null,
    threadView = false,
}) {
    console.log('_/|\\_ Loading DiscussionEngine via PostDiscussionScreen _/|\\_');
    const personaContext = React.useContext(PersonaStateContext);
    let openToThreadID = personaContext?.openToThreadID || null;
    let scrollToMessageID = personaContext?.scrollToMessageID || null;
    return (
        <>
            <DiscussionEngine
                renderFromTop={renderFromTop}
                personaID={personaKey}
                parentObjPath={
                    communityID === personaKey
                        ? `communities/${personaKey}/posts/${postKey}`
                        : `personas/${personaKey}/posts/${postKey}`
                }
                collectionName={'comments'}
                discussionTitle={''}
                navigation={navigation}
                renderGoUpArrow={false}
                scrollToMessageID={scrollToMessageID}
                headerType={'post'}
                headerProps={{
                    postID: postKey,
                    personaID: personaKey,
                    communityID: communityID,
                    chatDocPath:
                        communityID === personaKey
                            ? `communities/${personaKey}/posts/${postKey}`
                            : `personas/${personaKey}/posts/${postKey}`,
                }}
                openToThreadID={openToThreadID}
                initialThreadView={threadView}
            />

        </>
    );
}
