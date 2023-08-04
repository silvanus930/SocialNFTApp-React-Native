import React, {createContext, useEffect, useState} from 'react';
import database from '@react-native-firebase/database';
export const ConnectionContext = createContext({});
import {AppState} from 'react-native';

export const ConnectionProvider = ({user, children}) => {
    const [connectionRef, setConnectionRef] = useState(null);
    const [connectionID, setConnectionID] = useState(null);
    const [lastRoomRef, setLastRoomRef] = useState(null);
    const [lastRoomConnectionRef, setLastRoomConnectionRef] = useState(null);
    const userID = user?.id;

    const cleanupPresence = async () => {
        const db = database();
        await connectionRef.onDisconnect().cancel();
        await connectionRef.remove();
        await db
            .ref(`usersPresence/${userID}/connections/${connectionID}`)
            .onDisconnect()
            .cancel();
        await db
            .ref(`usersPresence/${userID}/connections/${connectionID}`)
            .remove();
        const lastOnlineAtRef = db.ref(`/usersPresence/${userID}/lastOnlineAt`);
        await lastOnlineAtRef.onDisconnect().cancel();
        await lastOnlineAtRef.set(database.ServerValue.TIMESTAMP);

        if (lastRoomRef) {
            await lastRoomRef.onDisconnect().cancel();
            await lastRoomRef.remove();
        }

        if (lastRoomConnectionRef) {
            await lastRoomConnectionRef.onDisconnect().cancel();
            await lastRoomConnectionRef.remove();
        }
    };

    useEffect(() => {
        const db = database();
        const lastOnlineAtRef = db.ref(`/usersPresence/${userID}/lastOnlineAt`);
        const subscription = AppState.addEventListener(
            'change',
            nextAppState => {
                if (connectionRef) {
                    if (nextAppState === 'active') {
                        connectionRef.update({
                            active: true,
                        });
                    } else if (
                        nextAppState === 'inactive' ||
                        nextAppState === 'background'
                    ) {
                        connectionRef.update({
                            active: false,
                        });
                        lastOnlineAtRef.set(database.ServerValue.TIMESTAMP);
                    }
                }
            },
        );
        return () => {
            subscription.remove();
        };
    }, [userID, connectionRef]);

    useEffect(() => {
        if (userID) {
            const db = database();
            const myConnectionsRef = db.ref(
                `usersOnlineStatus/${userID}/connections`,
            );
            const lastOnlineAtRef = db.ref(
                `usersOnlineStatus/${userID}/lastOnlineAt`,
            );
            const connectedRef = db.ref('.info/connected');

            connectedRef.on('value', snap => {
                // User is connected
                if (snap.val() && !connectionRef) {
                    db.ref().update({
                        [`usersPresence/${userID}/user`]: {
                            userName: user?.userName,
                            profileImgUrl: user?.profileImgUrl,
                        },
                    });
                    const connection = myConnectionsRef.push();
                    setConnectionRef(connection);
                    setConnectionID(connection.key);
                    connection
                        .onDisconnect()
                        .remove()
                        .then(() => {
                            connection.set({
                                active: true,
                                client: 'mobile',
                                createdAt: database.ServerValue.TIMESTAMP,
                                ...(__DEV__ && {dev: true}),
                            });
                        });
                    db.ref(
                        `usersPresence/${userID}/connections/${connection.key}`,
                    )
                        .onDisconnect()
                        .remove();
                    lastOnlineAtRef
                        .onDisconnect()
                        .set(database.ServerValue.TIMESTAMP);
                }
            });

            return () => {
                connectedRef.off('value');
            };
        }
    }, [connectionRef, user?.profileImgUrl, user?.userName, userID]);

    // Guard against a case where we can end up disconnected but with a stale
    // connection ref
    useEffect(() => {
        if (connectionRef) {
            const db = database();
            const connectedRef = db.ref('.info/connected');
            connectedRef.on('value', snap => {
                if (!snap.val()) {
                    setConnectionRef(null);
                    setConnectionID(null);
                }
            });
            return () => {
                connectedRef.off('value');
            };
        }
    }, [connectionRef]);

    useEffect(() => {
        if (connectionID) {
            const db = database();
            const pathRef = db.ref(
                `usersPresence/${userID}/connections/${connectionID}/currentRoom/path`,
            );
            pathRef.on('value', snap => {
                const val = snap.val();
                if (val) {
                    const [
                        containerCollectionName,
                        containerID,
                        roomCollectionName,
                        roomID,
                    ] = val.split(':');
                    const lastRoomRef = db.ref(
                        `roomPresence/${containerCollectionName}/${containerID}/${roomCollectionName}/${roomID}/${userID}/connections/${connectionID}`,
                    );
                    setLastRoomRef(lastRoomRef);
                    lastRoomRef.onDisconnect().remove();

                    const lastRoomConnectionRef = db.ref(
                        `roomPresence/${containerCollectionName}/${containerID}/${roomCollectionName}/${roomID}/${userID}/${userID}/${connectionID}`,
                    );
                    setLastRoomConnectionRef(lastRoomConnectionRef);
                    lastRoomConnectionRef.onDisconnect().remove();
                }
            });
        }
    }, [connectionID, connectionRef, userID]);

    return (
        <ConnectionContext.Provider
            value={{connectionRef, connectionID, cleanupPresence}}>
            {children}
        </ConnectionContext.Provider>
    );
};
