import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Keyboard} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import flatten from 'lodash.flatten';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {DrawerOpenStateContext} from 'state/DrawerState';

import {vanillaPersona} from 'state/PersonaState';

const usePersonaList = () => {
    // TODO: timestamps doc (personaTouchedMap) will be deprecated
    const [personaTouchedMap, setPersonaTouchedMap] = React.useState({});
    const [communityActivity, setCommunityActivity] = useState();
    const [userSeen, setUserSeen] = useState();

    const communityContext = React.useContext(CommunityStateContext);
    const globalContext = React.useContext(GlobalStateRefContext);

    const currentCommunity = communityContext?.currentCommunity;
    const communityMap = communityContext?.communityMap;
    const personaMap = globalContext?.current?.personaMap;

    const {
        state: {open},
    } = React.useContext(DrawerOpenStateContext);

    // TODO: timestamps doc (personaTouchedMap) will be deprecated
    const fetchTimestamps = React.useCallback(async () => {
        const streamsRef = await firestore()
            .collection('communities')
            .doc(currentCommunity)
            .collection('live')
            .doc('timestamps')
            .get();

        if (streamsRef && streamsRef.exists && streamsRef.data()) {
            setPersonaTouchedMap(streamsRef?.data()?.streams);
        }
    }, [currentCommunity]);

    // NOTE: communityActivity and userSeen can be pulled instead of subscribed
    const unsubscribeCommunityActivity = useRef();
    useEffect(() => {
        unsubscribeCommunityActivity.current?.();
        if (open && currentCommunity) {
            unsubscribeCommunityActivity.current = firestore()
                .collection('communities')
                .doc(currentCommunity)
                .collection('live')
                .doc('activity')
                .onSnapshot(snapshot => {
                    if (snapshot?.exists) {
                        setCommunityActivity(snapshot.data());
                    }
                });
        }
    }, [open, currentCommunity]);

    const unsubscribeUserSeen = useRef();
    useEffect(() => {
        unsubscribeUserSeen.current?.();
        if (open) {
            unsubscribeUserSeen.current = firestore()
                .collection('users')
                .doc(auth().currentUser.uid)
                .collection('live')
                .doc('seen')
                .onSnapshot(snapshot => {
                    if (snapshot?.exists) {
                        setUserSeen(snapshot.data());
                    }
                });
        }
    }, [open]);

    React.useEffect(() => {
        fetchTimestamps();
    }, [fetchTimestamps, currentCommunity]);

    const communityPersonaIds = communityMap[currentCommunity]?.projects;
    const currentUserId = auth().currentUser.uid;

    const personaList = useMemo(() => {
        const withChatActivityProps = p => {
            let messagesPath = `personas/${p.pid}/chats/all/messages`;
            if (p.pid === 'communitychat') {
                messagesPath = `communities/${currentCommunity}/chat/all/messages`;
            }
            const chatActivity = communityActivity?.chats[messagesPath];
            const a = chatActivity?.lastActive;
            const b = personaTouchedMap[p.pid] ?? p.editDate;
            const lastActive = a > b ? a : b;

            const unreadCount =
                chatActivity?.messageCount -
                userSeen?.[messagesPath]?.messageCount;
            return {...p, lastActive, unreadCount: unreadCount || undefined};
        };
        const personaList = communityPersonaIds
            ?.map(pid => personaMap[pid])
            .filter(
                p =>
                    (p?.authors?.includes(currentUserId) || !p?.private) &&
                    !p?.deleted &&
                    !!p,
            )
            .map(withChatActivityProps)
            .sort(
                (a, b) => b.lastActive?.toMillis() - a.lastActive?.toMillis(),
            );
        let personaListWithExtras = [
            {...vanillaPersona, pid: 'gettingstarted'},
            withChatActivityProps({...vanillaPersona, pid: 'communitychat'}),
        ];
        if (personaList) {
            personaListWithExtras.push(...personaList);
        }
        return personaListWithExtras;
    }, [
        communityPersonaIds,
        personaMap,
        personaTouchedMap,
        communityActivity,
        userSeen,
    ]);

    useEffect(() => {
        if (open) {
            fetchTimestamps();
        }
        if (!open) {
            Keyboard.dismiss();
        }
    }, [open]);

    return {
        personaList,
        personaTouchedMap,
    };
};

export default usePersonaList;
