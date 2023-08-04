import React from 'react';
import isEqual from 'lodash.isequal';
import some from 'lodash.some';
import firestore from '@react-native-firebase/firestore';
import {getServerTimestamp} from 'actions/constants';
import palette from 'resources/palette';
import {ActivityShellStateContext} from 'state/ActivityShellState';
import auth from '@react-native-firebase/auth';
import {ActivityModalStateContext} from 'state/ActivityModalState';
import {TouchableOpacity, Dimensions, View, StyleSheet} from 'react-native';
//import {RoomsSmallStatusMem} from 'components/RoomsSmallStatus';
import colors from 'resources/colors';
import {BaseText} from 'resources/text';

import BottomSheet from './BottomSheet';
import {ActivityShellStateRefContext} from 'state/ActivityShellStateRef';

let MODAL_FRACTION = 0.8;
function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default function ActivityProfiler(props) {
    return (
        <React.Profiler
            id={'ActivityModal'}
            onRender={(id, phase, actualDuration) => {
                if (actualDuration > 2) {
                    console.log(
                        '======> (Profiler)',
                        id,
                        phase,
                        actualDuration,
                    );
                }
            }}>
            <ActivityModalMemo {...props} />
        </React.Profiler>
    );
}

import ActivityScreen from 'components/ActivityScreen';
import UserInvitesScreen from './UserInvitesScreen';

function ActivityInviteNotifier({
    myUserID,
    renderActivityToggle,
    activitySnapshotRef,
    activityScreenFlatListRef,
    navigation,
    showOnlyInvites,
}) {
    return (
        <ActivityScreen
            renderActivityToggle={renderActivityToggle}
            activitySnapRef={activitySnapshotRef}
            activityScreenFlatListRef={activityScreenFlatListRef}
            navigation={navigation}
        />
    );
}

export const Activity = ({navigation}) => {
    const myUserID = auth().currentUser?.uid;

    React.useEffect(() => {
        firestore()
            .collection('users')
            .doc(myUserID)
            .collection('live')
            .doc('activity')
            .set(
                {
                    lastOpenedActivity: getServerTimestamp(),
                },
                {merge: true},
            );
    }, [myUserID]);
    /*const {dispatch: homeNavDispatch} = React.useContext(
            HomeNavDispatchContext,
        );*/
    //const navContextRef = useContext(NavStateRefContext);
    //navContextRef.current.csetState({screen:'home'});

    const activityShellContext = React.useContext(ActivityShellStateContext);

    const renderActivityToggle = activityShellContext.renderActivityContext;

    const activitySnapshotTempRef = React.useRef(null);
    const activityScreenFlatListTempRef = React.useRef(null);

    const activitySnapshotRef = activityShellContext.activitySnapshotRef;
    const activityScreenFlatListRef =
        activityShellContext.activityScreenFlatListRef;

    const activityEventsByIdRef = React.useRef({});
    const [renderActivityToggleTemp, setrenderActivityToggleTemp] =
        React.useState(true);
    const renderActivityToggleTempRef = React.useRef(renderActivityToggleTemp);

    const activityShellStateRefContext = React.useContext(
        ActivityShellStateRefContext,
    );

    const activitySnap = activitySnapshotRef
        ? activitySnapshotRef.current
        : null;
    React.useEffect(() => {
        setrenderActivityToggleTemp(!renderActivityToggleTemp);
    }, [activitySnap]);

    React.useEffect(() => {
        let notificationsLimit = 200;

        return firestore()
            .collection('users')
            .doc(myUserID)
            .collection('activity')
            .where('deleted', '==', false)
            .where('created_at', '!=', '')
            .orderBy('created_at', 'desc')
            .limit(notificationsLimit)
            .onSnapshot(activitySnapResult => {
                activitySnapshotTempRef.current = activitySnapResult;
                const hasChangedDocs = activitySnapResult
                    .docChanges()
                    .map(change => {
                        if (change.type === 'added') {
                            activityEventsByIdRef.current[change.doc.id] =
                                change.doc.data();
                            return true;
                        } else if (change.type === 'modified') {
                            const prevEvent =
                                activityEventsByIdRef.current[change.doc.id];
                            const modifiedEvent = change.doc.data();
                            activityEventsByIdRef.current[change.doc.id] =
                                modifiedEvent;
                            if (!prevEvent && modifiedEvent) {
                                //FIXME: We shouldn't be getting a modified event without a
                                // corresponding previous event but we are.
                                return true;
                            }
                            const didDeleteStatusChange =
                                (!prevEvent.deleted && modifiedEvent.deleted) ||
                                (prevEvent.deleted && !modifiedEvent.deleted);
                            const didEventUpdate =
                                (prevEvent?.updatedAt?.seconds ?? 0) <
                                (modifiedEvent?.updatedAt?.seconds ?? 0);
                            return didDeleteStatusChange || didEventUpdate;
                        } else if (change.type === 'removed') {
                            if (
                                {}.hasOwnProperty.call(
                                    activityEventsByIdRef.current,
                                    change.doc.id,
                                )
                            ) {
                                delete activityEventsByIdRef.current[
                                    change.doc.id
                                ];
                            }
                            return true;
                        }
                    });

                if (some(hasChangedDocs)) {
                    renderActivityToggleTempRef.current =
                        !renderActivityToggleTempRef.current;
                    activityShellStateRefContext.current.csetState({
                        renderActivityToggle:
                            renderActivityToggleTempRef.current,
                        activitySnapshotRef: activitySnapshotTempRef,
                        activityScreenFlatListRef:
                            activityScreenFlatListTempRef,
                    });
                } else {
                    activityShellStateRefContext.current.csetState({
                        activitySnapshotRef: activitySnapshotTempRef,
                        activityScreenFlatListRef:
                            activityScreenFlatListTempRef,
                    });
                }
            });
    }, [activityScreenFlatListRef, activityShellStateRefContext, myUserID]);

    return (
        <View
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                flex: 1,
            }}>
            <ActivityInviteNotifier
                myUserID={auth().currentUser.uid}
                showOnlyInvites={false}
                renderActivityToggle={renderActivityToggleTemp}
                activitySnapshotRef={activitySnapshotRef}
                activityScreenFlatListRef={activityScreenFlatListRef}
                navigation={navigation}
            />
            {/*<ActivePersonaOverlay />*/}
            {/*<DraftOverlay navigation={navigation}/>*/}
        </View>
    );
};
const ActivityModalMemo = React.memo(ActivityModal, propsAreEqual);
function ActivityModal({navigation, fraction = MODAL_FRACTION}) {
    const {toggleModalVisibility, chatID, showToggle} = React.useContext(
        ActivityModalStateContext,
    );
    const [showInvites, setShowInvites] = React.useState(false);

    return (
        <BottomSheet
            // windowScale={fraction}
            snapPoints={['80%']}
            toggleModalVisibility={toggleModalVisibility}
            showToggle={showToggle}>
            <View>
                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <TouchableOpacity
                        onPress={() => setShowInvites(false)}
                        style={{marginRight: 20}}>
                        <BaseText
                            style={{
                                fontSize: 18,
                                color: showInvites
                                    ? colors.textFaded
                                    : colors.actionText,
                                fontWeight: showInvites ? 'normal' : 'bold',
                            }}>
                            Notifications
                        </BaseText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowInvites(true)}>
                        <BaseText
                            style={{
                                fontSize: 18,
                                color: showInvites
                                    ? colors.actionText
                                    : colors.textFaded,
                                fontWeight: showInvites ? 'bold' : 'normal',
                            }}>
                            Invites
                        </BaseText>
                    </TouchableOpacity>
                </View>
                {showInvites ? (
                    <View style={{width: '100%', height: '100%'}}>
                        <UserInvitesScreen navigation={navigation} />
                    </View>
                ) : (
                    <View style={{width: '100%', height: '100%'}}>
                        <Activity navigation={navigation} />
                    </View>
                )}
            </View>
        </BottomSheet>
    );
}

export const Styles = StyleSheet.create({
    post: {
        ...palette.post,
        paddingTop: 13,
        paddingBottom: 8,
        width: Dimensions.get('window').width - 2.5,
        backgroundColor: colors.homeBackground,
    },
    endorsementsContainer: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    endorsementBtn: {
        marginLeft: 7,
        marginRight: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.topBackground,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        opacity: 1,
        shadowOpacity: 0.23,
        shadowRadius: 1,
        height: 42,
        width: 42,
        borderRadius: 40,
    },
    endorsementsMenuIos: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        height: 60,
        paddingLeft: 5,
        paddingRight: 6,
        borderRadius: 30,
    },
    upperTimeline: {
        ...palette.timeline.line,
        marginLeft:
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth,
        position: 'absolute',
        height: 100,
        backgroundColor: colors.timeline,
    },
    endorsementsMenuAndroid: {
        alignSelf: 'center',
        top: 200,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        elevation: 6,
        height: 60,
        paddingLeft: 5,
        paddingRight: 6,
        borderRadius: 30,
        backgroundColor: '#919191',
        opacity: 0.8,
    },
    commentEndorsements: {
        marginLeft: 3,
        marginRight: 3,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 25,
        paddingLeft: 5,
        paddingRight: 7,
        width: 50,
        borderRadius: 40,
        marginTop: 2,
        marginBottom: 4,
    },
    threadBreakoutStyle: {
        marginLeft: palette.timeline.line.marginLeft - 5,
        width: 30,
        height: 30,
        zIndex: 0,
        marginTop: 7,
        borderBottomLeftRadius: 15,
        borderLeftWidth: 2,
        borderBottomWidth: 1.5,
        borderLeftColor: colors.timeline,
        borderBottomColor: colors.timeline,
        position: 'absolute',
    },
    threadTextBox: {
        marginLeft: 46,
        marginRight: 20,
        fontSize: 14,
        borderRadius: 5,
        borderWidth: 0.5,
        borderColor: colors.darkSeperator,
        paddingLeft: 8,
        paddingRight: 9,
        paddingBottom: 7,
        paddingTop: 4,
        marginBottom: 0,
        marginTop: 3,
        backgroundColor: colors.homeBackground,
    },
    text: {
        color: colors.text,
        marginLeft: 10,
        marginRight: 10,
        fontSize: 14,
    },
    replyText: {
        color: colors.textFaded2,
        fontSize: 12,
        fontStyle: 'italic',
        paddingLeft: 17.5,
    },
    replyHeaderText: {
        color: colors.textFaded2,
        fontSize: 12,
    },
    replyTextHeader: {
        height: 13,
        marginTop: 3,
        marginBottom: 4,
        flexDirection: 'row',
    },
    infoContainer: {
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        flex: 1,
    },
    personName: {
        color: colors.text,
        fontSize: 14,
        marginStart: 10,
        fontWeight: 'bold',
    },
    tinyPersonImage: {
        width: 13,
        height: 13,
        borderRadius: 13,
        marginRight: 4,
        opacity: 0.75,
    },
    threadBoxInfo: {
        marginLeft: 0,
        fontSize: 12,
        color: colors.textFaded2,
        marginTop: 2,
        marginBottom: 0,
        height: 20,
    },
    centeredView: {
        marginBottom: Platform.OS === 'ios' ? -25 : 0,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    modalView: {
        margin: 0,
        borderRadius: 20,
        paddingTop: 15,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
        alignItems: 'flex-start',
        maxHeight: Dimensions.get('window').height * MODAL_FRACTION,
        width: Dimensions.get('window').width,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    profilePicture: {
        height: 50,
        width: 50,
        borderRadius: 45,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
    personImage: {
        width: 40,
        height: 40,
        borderRadius: 40,
    },
});
