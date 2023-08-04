import React, {useMemo, useState, useEffect} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';

import images from 'resources/images';
import UserBubble from 'components/UserBubble';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {useNavToPersona} from 'hooks/navigationHooks';
import {propsAreEqual} from 'utils/propsAreEqual';

import {
    DiscussionEngineDispatchContext,
    DiscussionEngineFrameStateContext,
    DiscussionEngineStateContext,
} from 'components/DiscussionEngineContext';
import BottomSheet from 'components/BottomSheet';
import styles from './styles';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @                               WARNING                                   @
// @                                                                         @
// @ BE VERY CAREFUL EDITING TO NOT INTRODUCE EXTRA RENDERS                  @
// @                                                                         @                                                                        @
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

export default React.memo(DiscussionEndorsementUsers, propsAreEqual);
function DiscussionEndorsementUsers({commentListRef}) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const {state: frameState} = React.useContext(
        DiscussionEngineFrameStateContext,
    );
    const {
        key: showEndorsementsKey,
        endorsers: showEndorsers,
        emoji: showEndorsement,
        pressY: showEndorsementY,
    } = state.showEndorsements;

    return useMemo(
        () => (
            <>
                <DiscussionEndorsementUsersMemo
                    showEndorsementsKey={showEndorsementsKey}
                    showEndorsement={showEndorsement}
                    showEndorsers={showEndorsers}
                    commentListRef={commentListRef}
                    showEndorsementY={showEndorsementY}
                />
            </>
        ),
        [
            showEndorsementsKey,
            showEndorsement,
            showEndorsers,
            showEndorsementY,
            commentListRef,
        ],
    );
}

function DiscussionEndorsementUsersMemo({
    showEndorsementsKey,
    showEndorsement,
    showEndorsers,
    showEndorsementY,
    commentListRef,
}) {
    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const {
        current: {userMap, personaMap},
    } = React.useContext(GlobalStateRefContext);

    const navigation = useNavigation();
    const navToPersona = useNavToPersona(navigation);

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );

    const [emoji, setEmoji] = useState(showEndorsement);
    const [emojiUsers, setEmojiUsers] = useState(
        showEndorsers[showEndorsement],
    );

    const navToProfile = React.useCallback(
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
        [profileModalContextRef],
    );

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
                <>
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
                </>
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
                    extraData={showEndorsers}
                    keyExtractor={keyExtractor}
                    renderItem={renderUser}
                />
            </View>
        );
    }

    const onPressLeaveEndorsementsMenu = () => {
        console.log('toggle');
        setEmojiUsers([]);
        setEmoji(null);
        dispatch({type: 'exitShowEndorsementsMenu'});
    };

    const pressEmojiButton = (users, e) => {
        setEmojiUsers(users);
        setEmoji(e);
    };

    useEffect(() => {
        pressEmojiButton(showEndorsers[showEndorsement], showEndorsement);
    }, [showEndorsement]);

    const renderItem = ({item}) => {
        const onPress = () => {
            pressEmojiButton(showEndorsers[item], item);
        };
        if (showEndorsers[item].length > 0) {
            return (
                <TouchableOpacity onPress={onPress}>
                    <View
                        style={styles.renderEmojiButtonContainer(emoji, item)}>
                        <Text style={styles.renderEmojiButtonTextItem}>
                            {item}
                        </Text>
                        <Text
                            style={styles.renderEmojiButtonTextEndorsersLength}>
                            {showEndorsers[item].length}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        }
        return null;
    };

    return (
        <BottomSheet
            toggleModalVisibility={onPressLeaveEndorsementsMenu}
            showToggle={showEndorsementsKey}>
            <View style={[styles.flex1, styles.m10]}>
                {/* Emoji buttons at top */}
                <FlatList
                    // keyboardShouldPersistTaps="always"
                    bounces={false}
                    style={styles.emojiButtonsFlatlist}
                    horizontal
                    data={Object.keys(showEndorsers)}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                />
                <View style={styles.endorsementUsersRootContainer}>
                    {renderEndorsementUsers()}
                </View>
            </View>
        </BottomSheet>
    );
}
