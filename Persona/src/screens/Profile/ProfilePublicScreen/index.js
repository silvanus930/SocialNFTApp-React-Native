import React, {useContext, useCallback, useState, useRef} from 'react';
import {
    Animated as RNAnimated,
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    SafeAreaView,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {GlobalStateContext} from 'state/GlobalState';
import Loading from 'components/Loading';
import NFTModal from 'components/NFTModal';
import ProfileHeader from 'screens/Profile/components/ProfileHeader';
import ProfileHeaderButton from 'screens/Profile/components/ProfileHeaderButton';

import ReportContentModal from './components/ProfileReportModal';
import ProfilePersonaList from './components/ProfilePersonaList';
import PublicProfileHeader from './components/PublicProfileHeader';

import {colors} from 'resources';

import styles from './styles';

const ProfilePublicScreen = ({
    transparentBackground = false,
    showHeader = true,
    navigation,
    userID = auth().currentUser.uid,
    personaVoice = false,
}) => {
    const {
        user: currentUser,
        userMap,
        personaMap,
    } = useContext(GlobalStateContext);
    const profileModalContextRef = useContext(ProfileModalStateRefContext);
    console.log(userID);

    const isCurrentUser = !userID || userID === currentUser.id;
    const user = personaVoice ? personaMap[userID] : userMap[userID];
    const personaVisible = personaVoice
        ? !personaMap[userID]?.private ||
          personaMap[userID]?.authors.includes(auth().currentUser.uid)
        : true;

    const onPressFollow = useCallback(() => {
        alert('Coming soon!');
    }, []);

    const onPressBookmarks = useCallback(() => {
        profileModalContextRef.current.csetState({showToggle: false});
        profileModalContextRef.current.closeRightDrawer &&
            profileModalContextRef.current.closeRightDrawer();
        navigation.navigate('Bookmarks');
    }, []);

    const [showReportModal, setShowReportModal] = useState(false);
    const onReport = useCallback(() => {
        setShowReportModal(true);
    }, []);

    const headerButtons = (
        <>
            {!isCurrentUser && (
                <ProfileHeaderButton title="Follow" onPress={onPressFollow} />
            )}
            {/* {isCurrentUser && (
                <ProfileHeaderButton
                    title="Bookmarks"
                    onPress={onPressBookmarks}
                />
            )} */}
            <TouchableOpacity
                onPress={() => setShowReportModal(true)}
                style={styles.reportButton}>
                <MaterialIcons name="report" size={24} color="white" />
            </TouchableOpacity>
        </>
    );

    const navLeftContent = (
        <TouchableOpacity
            onPress={navigation.goBack}
            style={styles.publicProfileGoBackButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
    );

    const headerComponent = useCallback(
        () => (
            <>
                <ProfileHeader
                    user={user}
                    headerButtons={headerButtons}
                    navLeftContent={isCurrentUser ? navLeftContent : null}
                />

                <PublicProfileHeader
                    user={user}
                    isCurrentUser={isCurrentUser}
                    personaVoice={personaVoice}
                    navigation={navigation}
                />
            </>
        ),
        [personaVoice, transparentBackground, user, isCurrentUser, navigation],
    );

    return user ? (
        <SafeAreaView style={styles.container}>
            <ProfilePersonaList
                personaVoice={personaVoice}
                transparentBackground={transparentBackground}
                profileMode={true}
                headerComponent={headerComponent}
                userID={personaVoice ? user?.pid : user.id}
                navigation={navigation}
            />
            <NFTModal navigation={navigation} />

            <ReportContentModal
                showReportModal={showReportModal}
                setShowReportModal={setShowReportModal}
            />
        </SafeAreaView>
    ) : (
        <Loading />
    );
};

export default ProfilePublicScreen;
