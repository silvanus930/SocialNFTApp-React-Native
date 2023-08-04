import {useEffect, useState, useCallback, useMemo, useContext} from 'react';
import database from '@react-native-firebase/database';
import {useFocusEffect} from '@react-navigation/native';
import {ConnectionContext} from 'state/ConnectionState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {CommunityStateRefContext} from 'state/CommunityStateRef';

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

export default function useRoomPresence({rootParentObjPath, room, myUserID}) {
    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);
    const {
        current: {communityMap},
    } = useContext(CommunityStateRefContext);
    const {connectionID} = useContext(ConnectionContext);
    const [roomPresence, setRoomPresence] = useState(null);

    // A room can be a post or a chat
    // A container can be either community or a project
    const roomID = rootParentObjPath ? rootParentObjPath.split('/')[3] : null;
    const containerID = rootParentObjPath
        ? rootParentObjPath.split('/')[1]
        : null;

    let container;
    let containerCollectionName;
    const isCommunity = rootParentObjPath?.includes('communities');
    const isPersona = rootParentObjPath?.includes('personas');

    if (isCommunity) {
        container = communityMap[containerID];
        containerCollectionName = 'communities';
    } else if (isPersona) {
        container = personaMap[containerID];
        containerCollectionName = 'personas';
    } else {
        throw new Error('Unable to detect container type for presence');
    }

    let roomCollectionName;
    const isPost = rootParentObjPath.includes('posts');
    const isChat = rootParentObjPath.includes('chat');

    if (isPost) {
        roomCollectionName = 'posts';
    } else if (isChat) {
        roomCollectionName = isCommunity ? 'chat' : 'chats';
    } else {
        throw new Error('Unable to detect room type for presence');
    }

    const {title: roomTitle, slug: roomSlug} = room;

    const roomPath = `/roomPresence/${rootParentObjPath}`;
    const myRoomPresencePath = `${roomPath}/${myUserID}`;
    const myRoomUserIDPresencePath = `${roomPath}/${myUserID}/${myUserID}`;
    const myRoomConnectionsPresencePath = `${roomPath}/${myUserID}/connections/${connectionID}`;
    const roomKey = `${containerCollectionName}:${containerID}:${roomCollectionName}:${roomID}`;
    const myUserPresencePath = `/usersPresence/${myUserID}/connections/${connectionID}`;
    const db = useMemo(() => database(), []);
    const roomRef = useMemo(() => db.ref(roomPath), [db, roomPath]);

    const addMyUserToRoom = useCallback(async () => {
        if (container) {
            //await delay(400);
            const updateObj = {
                [`${myUserPresencePath}/currentRoom/path`]: roomKey,
                [`${myUserPresencePath}/currentRoom/enteredRoomAt`]:
                    database.ServerValue.TIMESTAMP,
                [`${myUserPresencePath}/currentRoom/${containerCollectionName}/name`]:
                    container?.name,
                [`${myUserPresencePath}/currentRoom/${containerCollectionName}/id`]:
                    containerID,
                [`${myUserPresencePath}/currentRoom/${containerCollectionName}/slug`]:
                    container?.slug ?? null,
                [`${myUserPresencePath}/currentRoom/${roomCollectionName}/title`]:
                    roomTitle ?? null,
                [`${myUserPresencePath}/currentRoom/${roomCollectionName}/id`]:
                    roomID,
                [`${myUserPresencePath}/currentRoom/${roomCollectionName}/slug`]:
                    roomSlug,
            };

            // Clean up any previous data we have
            if (isCommunity) {
                updateObj[`${myUserPresencePath}/currentRoom/personas`] = null;
            }

            if (isPersona) {
                updateObj[`${myUserPresencePath}/currentRoom/communities`] =
                    null;
            }

            if (isChat) {
                updateObj[`${myUserPresencePath}/currentRoom/posts`] = null;
            }

            if (isPost) {
                updateObj[`${myUserPresencePath}/currentRoom/chats`] = null;
            }

            // Ensure we properly clear room data if we disconnect
            db.ref(myRoomConnectionsPresencePath)
                .onDisconnect()
                .remove()
                .then(() => {
                    db.ref(myRoomConnectionsPresencePath).set({
                        active: true,
                        micMuted: true,
                        client: 'mobile',
                        enteredRoomAt: database.ServerValue.TIMESTAMP,
                        identity: 'user',
                        ...(__DEV__ && {dev: true}),
                    });
                });

            db.ref(`${myRoomUserIDPresencePath}/${connectionID}`)
                .onDisconnect()
                .remove()
                .then(() => {
                    db.ref(`${myRoomUserIDPresencePath}/${connectionID}`).set(
                        true,
                    );
                });

            await db.ref().update(updateObj);
        }
    }, [
        container,
        myUserPresencePath,
        roomKey,
        containerCollectionName,
        containerID,
        roomCollectionName,
        roomTitle,
        roomID,
        roomSlug,
        isCommunity,
        isPersona,
        isChat,
        isPost,
        db,
        myRoomConnectionsPresencePath,
        myRoomUserIDPresencePath,
        connectionID,
    ]);

    const removeMyUserFromRoom = useCallback(async () => {
        if (container) {
            await db.ref().update({
                [myRoomPresencePath]: null,
            });
        }
    }, [container, db, myRoomPresencePath]);

    const resetUserPresence = useCallback(async () => {
        await db.ref().update({
            [`${myUserPresencePath}/currentRoom`]: null,
        });
    }, [db, myUserPresencePath]);

    useFocusEffect(
        useCallback(() => {
            if (
                container &&
                containerID &&
                roomID &&
                myUserID &&
                connectionID
            ) {
                addMyUserToRoom();
                return () => {
                    removeMyUserFromRoom();
                };
            }
        }, [
            container,
            containerID,
            roomID,
            myUserID,
            connectionID,
            addMyUserToRoom,
            removeMyUserFromRoom,
        ]),
    );

    useFocusEffect(
        useCallback(() => {
            if (container && containerID && roomID && myUserID) {
                // Realtime DB doesn't allow filtering data by inequality
                // so this is a trick to filter out the user's own presence
                // entry
                roomRef
                    .orderByChild(`${myUserID}`)
                    .equalTo(null)
                    .on('value', snapshot => {
                        const data = snapshot.val();
                        const presenceData = Object.assign({}, data ?? {});
                        // Add back in our local state
                        presenceData[myUserID] = {
                            active: true,
                            client: 'mobile',
                            identity: 'user',
                        };
                        setRoomPresence(presenceData);
                    });
                return () => roomRef.off();

                // roomRef.on('value', snapshot => {
                //     const data = snapshot.val();
                //     console.log('------------------snapshot', data);
                //     setRoomPresence(data);
                // });
                // return () => roomRef.off();
            }
        }, [container, containerID, myUserID, roomID, roomRef]),
    );

    useEffect(() => {
        return () => {
            resetUserPresence();
        };
    }, [resetUserPresence]);

    return {
        roomPresence,
        addMyUserToRoom,
        removeMyUserFromRoom,
    };
}
