import React, {
    useEffect,
    useState,
    useContext,
    useCallback,
    useMemo,
} from 'react';

import {View, Text, TouchableOpacity} from 'react-native';

import _ from 'lodash';
import {FlatList} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';

import images from 'resources/images';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {useNavToPersona} from 'hooks/navigationHooks';

import BottomSheet from 'components/BottomSheet';
import {
    FeedMenuDispatchContext,
    FeedMenuStateContext,
} from 'state/FeedStateContext';
import UserBubble from 'components/UserBubble';
import styles from './styles';

const FeedEndorsementUsersMenu = () => {
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);
    const navigation = useNavigation();

    const {state} = useContext(FeedMenuStateContext);
    const {dispatch} = useContext(FeedMenuDispatchContext);

    const endorsers = useMemo(
        () => state?.endorsementUsersMenu?.endorsers || [],
        [state],
    );
    const endorsement = useMemo(
        () => state?.endorsementUsersMenu?.endorsement || 0,
        [state],
    );

    const [emoji, setEmoji] = useState(endorsement);
    const [emojiUsers, setEmojiUsers] = useState(
        endorsers?.length > 0 ? endorsers[endorsement] : [],
    );

    const navToPersona = useNavToPersona(navigation);
    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );

    const navToProfile = useCallback(
        comment => {
            if (comment.anonymous) {
                if (comment?.identityID && comment.identityID !== '') {
                    navToPersona(comment.identityID);
                } else {
                    alert('something went wrong!');
                }
            } else {
                profileModalContextRef.current.csetState({
                    showToggle: true,
                    userID: comment.userID,
                });
            }
        },
        [profileModalContextRef, navToPersona],
    );

    const onPressLeaveEndorsementsMenu = () => {
        setEmojiUsers([]);
        setEmoji(null);
        dispatch({type: 'closeEndorsementUsersMenu'});
    };

    const pressEmojiButton = (users, e) => {
        setEmojiUsers(users);
        setEmoji(e);
    };

    useEffect(() => {
        pressEmojiButton(endorsers[endorsement], endorsement);
    }, [endorsers, endorsement]);

    function renderEndorsementUsers() {
        const keyExtractor = item => item;
        const renderUser = ({item}) => {
            const onPress = () => navToProfile(commentStub);
            const anonymous = Boolean(personaMap[item]);
            const userOrPersona = anonymous
                ? {
                      uid: personaMap[item]?.name,
                      profileImgUrl:
                          personaMap[item]?.profileImgUrl ||
                          images.personaDefaultProfileUrl,
                  }
                : userMap[item];
            const commentStub = {
                identityID: item,
                anonymous,
                userID: anonymous ? undefined : item,
            };
            return (
                <View style={styles.renderUserContainer}>
                    <UserBubble
                        disabled={false}
                        margin={0}
                        authors={[]}
                        showName={false}
                        bubbleSize={45}
                        user={userOrPersona}
                        onPress={onPress}
                    />
                    <Text style={styles.renderUserText}>
                        {userOrPersona.userName}
                    </Text>
                </View>
            );
        };

        return (
            <View style={[styles.flex1, styles.mt10]}>
                <FlatList
                    bounces={false}
                    showsHorizontalScrollIndicator={true}
                    indicatorStyle={'white'}
                    horizontal={false}
                    style={styles.flex1}
                    ListFooterComponent={<View style={styles.h24} />}
                    data={emojiUsers}
                    extraData={endorsers}
                    keyExtractor={keyExtractor}
                    renderItem={renderUser}
                />
            </View>
        );
    }

    const renderEmojiButton = ({item}) => {
        const onPress = () => {
            pressEmojiButton(endorsers[item], item);
        };
        if (endorsers[item].length > 0) {
            return (
                <TouchableOpacity onPress={onPress}>
                    <View
                        style={styles.renderEmojiButtonContainer(emoji, item)}>
                        <Text style={styles.renderEmojiButtonTextItem}>
                            {item}
                        </Text>
                        <Text
                            style={styles.renderEmojiButtonTextEndorsersLength}>
                            {endorsers[item].length}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        }
        return <></>;
    };

    return (
        <BottomSheet
            toggleModalVisibility={onPressLeaveEndorsementsMenu}
            showToggle={state.endorsementUsersMenu.open}>
            <View style={[styles.flex1, styles.m10]}>
                {/* Emoji buttons at top */}
                <FlatList
                    // keyboardShouldPersistTaps="always"
                    bounces={false}
                    style={styles.emojiButtonsFlatlist}
                    horizontal
                    data={Object.keys(endorsers)}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderEmojiButton}
                />
                <View style={styles.endorsementUsersRootContainer}>
                    {renderEndorsementUsers()}
                </View>
            </View>
        </BottomSheet>
    );
};

export default FeedEndorsementUsersMenu;
