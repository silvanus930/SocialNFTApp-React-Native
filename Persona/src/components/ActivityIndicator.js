import React, {useEffect, useContext, useState, useRef} from 'react';
import {ActivityShellStateContext} from 'state/ActivityShellState';
import {View, StyleSheet} from 'react-native';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import colors from 'resources/colors';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';

/*function propsAreEqual(prevProps, nextProps) {
    return prevProps.renderActivityToggle === nextProps.renderActivityToggle;
}
export default React.memo(ActivityIndicator, propsAreEqual);*/
export default function ActivityIndicator({
    defaultColor = colors.navSubProminent,
    focused,
    invites = false,
    style,
    renderIcon = true,
}) {
    const {activitySnapshotRef, activityScreenFlatListRef} = React.useContext(
        ActivityShellStateContext,
    );
    let activitySnap = activitySnapshotRef ? activitySnapshotRef.current : null;
    const {
        current: {user},
    } = useContext(GlobalStateRefContext);
    const [numUnseenEvents, setNumUnseenEvents] = useState(0);
    const [latestInvite, setLatestInvite] = useState(null);
    const [lastOpenedInvitesAt, setLastOpenedInvitesAt] = useState(-1);
    const [shouldShowInviteIndicator, setShouldShowInviteIndicator] =
        useState(false);
    const numUnseenEventsRef = useRef(numUnseenEvents);

    useEffect(() => {
        return firestore()
            .collection('invites')
            .where('invitedUserID', '==', user.id)
            .where('deleted', '==', false)
            .where('accepted', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .onSnapshot(querySnapshot => {
                if (querySnapshot?.docs?.length > 0) {
                    setLatestInvite(querySnapshot.docs[0]);
                }
            });
    }, [user.id]);

    useEffect(() => {
        return firestore()
            .collection('users')
            .doc(user.id)
            .collection('live')
            .doc('invites')
            .onSnapshot(inviteDocSnapshot => {
                if (inviteDocSnapshot.exists) {
                    setLastOpenedInvitesAt(
                        inviteDocSnapshot.get('lastOpenedAt'),
                    );
                } else {
                    setLastOpenedInvitesAt(-1);
                }
            });
    }, [user.id]);

    useEffect(() => {
        if (latestInvite && lastOpenedInvitesAt) {
            const latestInviteCreatedAtSeconds =
                latestInvite.get('createdAt')?.seconds ?? 0;
            setShouldShowInviteIndicator(
                (lastOpenedInvitesAt?.seconds ?? 0) <
                    latestInviteCreatedAtSeconds,
            );
        }
    }, [lastOpenedInvitesAt, latestInvite]);

    const calculateNumUnseenEvents = React.useCallback(
        (_activitySnap, lastOpenedActivitySeconds) => {
            return (
                _activitySnap?.docs?.filter(
                    doc =>
                        doc.get('event_type') !== 'room_users_present' &&
                        doc.get('event_type') !== 'room_audio_discussion' &&
                        doc.get('created_at').seconds >
                            (lastOpenedActivitySeconds ?? 0),
                )?.length ?? 0
            );
        },
        [],
    );

    useEffect(() => {
        return firestore()
            .collection('users')
            .doc(user.uid)
            .collection('live')
            .doc('activity')
            .onSnapshot(liveActivitySnapshot => {
                if (!liveActivitySnapshot.exists) {
                    setNumUnseenEvents(calculateNumUnseenEvents(activitySnap));
                } else {
                    const lastOpenedActivity =
                        liveActivitySnapshot.get('lastOpenedActivity');
                    if (activitySnap !== null && lastOpenedActivity !== null) {
                        const newNumUnseenEvents = calculateNumUnseenEvents(
                            activitySnap,
                            lastOpenedActivity?.seconds,
                        );

                        if (newNumUnseenEvents !== numUnseenEventsRef.current) {
                            setNumUnseenEvents(newNumUnseenEvents);
                            numUnseenEventsRef.current = newNumUnseenEvents;
                        }
                    }
                }
            });
    }, [user.uid, activitySnap, calculateNumUnseenEvents]);

    return (
        <View style={{top: 0.5}}>
            {renderIcon && (
                <FontAwesome
                    name={'bell'}
                    color={focused ? colors.postAction : defaultColor}
                    size={21}
                />
            )}
            {invites && shouldShowInviteIndicator ? (
                <View style={Styles.unSeenInvites} />
            ) : !invites && numUnseenEvents > 0 ? (
                <View style={Styles.unSeenActivity} />
            ) : null}
        </View>
    );
}

const Styles = StyleSheet.create({
    unSeenActivity: {
        width: 9,
        height: 9,
        borderRadius: 100,
        backgroundColor: colors.emphasisRed,
        position: 'absolute',
        top: 0,
        left: 19,
        bottom: 25,
    },

    unSeenInvites: {
        width: 9,
        height: 9,
        borderRadius: 100,
        backgroundColor: colors.actionBlue,
        position: 'absolute',
        top: 0,
        left: 19,
        bottom: 25,
    },
});
