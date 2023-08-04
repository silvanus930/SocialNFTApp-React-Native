import React, {useContext, useEffect, useState} from 'react';
import firestore from '@react-native-firebase/firestore';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

const useDirectMessagesForUser = ({userId}) => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [directMessages, setDirectMessages] = useState(null);
    const [unseenDirectMessages, setUnseenDirectMessages] = useState([]);
    const globalRefContext = useContext(GlobalStateRefContext);

    useEffect(() => {
        firestore()
            .collection('users')
            .doc(userId)
            .collection('blockedUsers')
            .onSnapshot(blockedUsersSnap => {
                if (blockedUsersSnap) {
                    setBlockedUsers(
                        blockedUsersSnap.docs.map(doc => doc.data().userID),
                    );
                }
            });
    }, []);

    useEffect(() => {
        firestore()
            .collection('draftchatCaching')
            .where('involved', 'array-contains', userId)
            .onSnapshot(chatsSnap => {
                if (chatsSnap) {
                    const dmList =
                        chatsSnap.docs
                            .map(doc => {
                                const otherUsersInvolved = doc
                                    .data()
                                    .involved.filter(id => id !== userId);
                                const userToDMid = otherUsersInvolved[0];
                                const userToDM =
                                    globalRefContext.current.userMap[
                                        userToDMid
                                    ];

                                const username = doc.data().involved;

                                let seen = false;
                                const lastSeen =
                                    doc?.data()?.latestMessage?.data?.seen;
                                if (lastSeen) {
                                    seen =
                                        Object.keys(lastSeen).includes(userId);
                                }

                                const directMessage = {
                                    type: doc.data().type,
                                    deleted: doc.data().deleted || false,
                                    data: doc.data(),
                                    ref: doc.ref,
                                    id: doc.id,
                                    userID: userToDM?.id,
                                    username: userToDM?.userName,
                                    seen: seen,
                                };

                                return directMessage;
                            })
                            .sort(
                                (docA, docB) =>
                                    (docA.type === 'chat'
                                        ? -docA.data.latestMessage.timestamp
                                              .seconds
                                        : -docA.data.editDate.seconds) +
                                    (docB.type === 'chat'
                                        ? docB.data.latestMessage.timestamp
                                              .seconds
                                        : docB.data.editDate.seconds),
                            ) || [];
                    const filtered = dmList
                        .filter(dm => !dm.deleted)
                        .filter(dm => !blockedUsers.includes(dm.userID));
                    setDirectMessages(filtered);

                    const unseen = [];
                    filtered.map(dm => {
                        if (!dm.seen) {
                            unseen.push(dm);
                        }
                    });
                    setUnseenDirectMessages(unseen);
                }
            });
    }, [blockedUsers]);

    return {directMessages, unseenDirectMessages, blockedUsers};
};

export default useDirectMessagesForUser;
