const getLatestChildPostTimestamp = (
    personaList,
    parentID,
    checkAccess,
    userID,
    personaMap,
    lastTouchedMap = null,
) => {
    /*parentID === 'ff3cdKnVhpdRelDkxr38' &&
      console.log('getLatestChildPostTimestamp', parentID, lastTouchedMap);*/
    let children = personaList.filter(
        child => child?.parentPersonaID === parentID,
    );
    /*parentID === 'ff3cdKnVhpdRelDkxr38' &&
      console.log('checkAccess', checkAccess, children.length);*/
    if (checkAccess) {
        children.filter(
            child =>
                personaMap[child?.pid]?.authors?.includes(userID) ||
                personaMap[child?.pid]?.communityMembers?.includes(userID) ||
                !personaMap[child?.pid]?.private,
        );
    }
    /*parentID === 'ff3cdKnVhpdRelDkxr38' &&
      console.log('checkAccess', checkAccess, children.length);*/

    const lastPublishTime =
        personaMap[parentID]?.latestPostPublishDate?.seconds || 0;
    const lastEditTime = personaMap[parentID]?.latestPostEditDate?.seconds || 0;
    const parentPublishTime =
        lastPublishTime > lastEditTime ? lastPublishTime : lastEditTime;

    let lastTouchedChat = lastTouchedMap[parentID]
        ? lastTouchedMap[parentID].seconds
            ? lastTouchedMap[parentID].seconds
            : lastTouchedMap[parentID]
        : 0;

    if (children.length === 0) {
        return Math.max(parentPublishTime, lastTouchedChat);
        //return parentPublishTime;
    }

    const childrenTimestamps = children.map(child =>
        getLatestChildPostTimestamp(
            personaList,
            child.pid,
            checkAccess,
            userID,
            personaMap,
            lastTouchedMap,
        ),
    );
    return Math.max(...childrenTimestamps, lastTouchedChat, parentPublishTime);
};

export default getLatestChildPostTimestamp;
