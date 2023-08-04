export const handlePopulateApiList = ({
    communityMap,
    userMap,
    personaMap,
    currentUserId,
}) => {
    const communities = [];

    const membersId = [
        ...new Set(
            Object.values(communityMap).flatMap(
                community => community?.members || [],
            ),
        ),
    ];

    Object.keys(communityMap).map(communitykey => {
        if (communityMap[communitykey]?.projects) {
            communityMap[communitykey].projects.map(projectID => {
                const {authors, deleted, ...rest} = personaMap[projectID] || {};
                if (
                    (authors?.includes(currentUserId) || !rest.private) &&
                    !deleted
                ) {
                    communities.push({
                        ...personaMap[projectID],
                        personaId: projectID,
                    });
                }
            });
        }
    });

    const entireUsers = membersId.map(userId => {
        if (userMap[userId] && currentUserId !== userId) {
            return {...userMap[userId], id: userId};
        }
    });

    return {
        entireUsers,
        communities,
    };
};

export const filters = {
    filterCommunities: ({communityLists, searchVal}) => {
        const matchRegEx = new RegExp(searchVal, 'gi');
        return communityLists?.reduce((acc, draft) => {
            if (
                draft?.name?.match(matchRegEx) ||
                draft?.bio?.match(matchRegEx)
            ) {
                acc.push(draft);
            }
            return acc;
        }, []);
    },
    filterUsers: ({userLists, searchVal}) => {
        const matchRegEx = new RegExp(searchVal, 'gi');

        return userLists?.reduce((acc, draft) => {
            if (draft?.fullName?.match(matchRegEx)) {
                acc.push(draft);
            }
            return acc;
        }, []);
    },
};

export const isOwnChat = ({item, communityMap, personaMap, currentUserId}) => {
    const {
        objectID,
        created_at,
        message,
        chat,
        messageType,
        post,
        deleted,
        ...rest
    } = item;

    let isMember = false;

    let channelData = {};

    let persona_id = rest.persona_id;

    let communityID = rest.communityID;

    let personaData = personaMap[persona_id];

    if (messageType === 'post') {
        if (rest.isCommunityPost) {
            if (!communityID) {
                communityID = post?.data?.entityID;
            }
            channelData = communityMap[communityID];
            isMember = channelData?.members?.includes(currentUserId);
        } else if (rest.isProjectPost) {
            persona_id = post?.data?.entityID;
            personaData = personaMap[persona_id];
            communityID = personaData?.communityID;
            isMember =
                communityMap[communityID]?.members?.includes(currentUserId);
        }
    } else if (rest.event_type === 'chat_message') {
        if (rest.isProjectAllChat) {
            communityID = personaData?.communityID;
            isMember =
                communityMap[communityID]?.members?.includes(currentUserId);
        } else if (rest.isCommunityAllChat) {
            channelData = communityMap[communityID];
            isMember = channelData?.members?.includes(currentUserId);
        }
    }
    return isMember;
};

export const generateCommunityItemData = ({
    item,
    communityMap,
    getUserFromUserList,
    personaMap,
    currentUserId,
}) => {
    const {
        objectID,
        created_at,
        message,
        chat,
        messageType,
        post,
        deleted,
        ...rest
    } = item;

    let channelData = {};
    let createdBy = {};

    let persona_id = rest.persona_id;

    let communityID = rest.communityID;

    let navData = {};

    let personaData = personaMap[persona_id];

    if (messageType === 'post') {
        if (rest.isCommunityPost) {
            if (!communityID) {
                communityID = post?.data?.entityID;
            }
            channelData = communityMap[communityID];
            createdBy = getUserFromUserList(post?.data?.userID);
            navData = {
                communityID: communityID,
                postKey: post.id,
                highlightCommentKey: '',
                openToThreadID: post.id,
            };
        } else if (rest.isProjectPost) {
            persona_id = post?.data?.entityID;
            personaData = personaMap[persona_id];
            channelData = personaMap[persona_id];
            createdBy = getUserFromUserList(post?.data?.userID);
            communityID = personaData?.communityID;

            navData = {
                personaName: personaData?.name,
                personaKey: persona_id,
                postKey: post?.id,
                highlightCommentKey: post.id,
                personaProfileImgUrl: personaData?.profileImgUrl,
                openToThreadID: post.id,
            };
        }
    } else if (rest.event_type === 'chat_message') {
        if (rest.isProjectAllChat) {
            channelData = personaData;
            communityID = personaData?.communityID;

            createdBy = getUserFromUserList(message?.data?.userID);
            navData = {
                chatDocPath: `personas/${persona_id}/chats/all`,
                numAttendees: chat?.data?.attendees?.length,
                personaName: personaData.name,
                personaKey: persona_id,
                communityID: personaData?.communityID,
                personaProfileImgUrl: personaData.profileImgUrl,
                highlightCommentKey: '',
                openToThreadID: message.id,
                threadID: message.id,
            };
        } else if (rest.isCommunityAllChat) {
            channelData = communityMap[communityID];

            createdBy = getUserFromUserList(message?.data?.userID);
            navData = {
                chatDocPath: `communities/${communityID}/chat/all`,
                communityID,
                numAttendees: chat?.data?.attendees?.length,
                highlightCommentKey: '',
                openToThreadID: message.id,
            };
        }
    }

    return {
        navData,
        channelData,
        isMember: isOwnChat({item, communityMap, personaMap, currentUserId}),
        createdBy,
        persona: personaMap[persona_id],
    };
};
