import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MarkDown from 'components/MarkDown';
import React, {useCallback, useContext} from 'react';
import {
    Clipboard,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import getResizedImageUrl from 'utils/media/resize';
import images from 'resources/images';
import palette from 'resources/palette';
import {GlobalStateContext} from 'state/GlobalState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PresenceStateContext} from 'state/PresenceState';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {FeedMenuDispatchContext} from 'state/FeedStateContext';
import {GeneralFollow} from './UserBio';

export function InvitedUsers({invitedUsers, disableNav = false}) {
    const {
        current: {userMap},
    } = React.useContext(GlobalStateRefContext);

    /*
  const navToProfile = useDebounce(

    userID => {
      navigation && navigation.push('Profile', {userID: userID});
    },
    [navigation],
  );*/

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const navToProfile = React.useCallback(
        userID => {
            profileModalContextRef.current.csetState({
                userID: userID,
                showToggle: true,
            });
        },
        [profileModalContextRef],
    );

    const bubbleSize = 30;

    const renderItem = ({item}) => {
        const user = userMap[item];
        const nav = () => navToProfile(user.id);
        return (
            <TouchableOpacity
                disabled={disableNav}
                onPress={nav}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 12,
                        marginBottom: 6,
                        opacity: item?.invited ? 0.6 : 1,
                    }}>
                    <FastImage
                        source={{
                            uri: getResizedImageUrl({
                                origUrl:
                                    user.profileImgUrl ||
                                    images.userDefaultProfileUrl,
                                width: bubbleSize,
                                height: bubbleSize,
                            }),
                        }}
                        style={{
                            width: bubbleSize,
                            height: bubbleSize,
                            borderRadius: bubbleSize,
                            borderWidth: 1,
                            borderColor: colors.seperatorLineColor,
                        }}
                    />
                    <Text
                        style={{
                            ...baseText,
                            fontSize: 14,
                            marginLeft: 8,
                            color: colors.textFaded,
                            fontStyle: 'italic',
                        }}>
                        {user?.userName}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const invitees = invitedUsers || [];
    return invitees.length > 0 ? (
        <View
            style={{
                marginTop: 1,
                marginLeft: 5,
                zIndex: 2,
                flexDirection: 'row',
                alignItems: 'center',
            }}>
            <FlatList
                bounces={false}
                scrollEnabled={false}
                indicatorStyle={'white'}
                horizontal={true}
                data={invitees}
                keyExtractor={item => item}
                renderItem={renderItem}
            />
        </View>
    ) : null;
}

export function PostEndorsements(props) {
    const myUserID = auth().currentUser?.uid;
    const presenceContext = React.useContext(PresenceStateContext);
    const identityID =
        presenceContext.identityID &&
        presenceContext.identityID.startsWith('PERSONA')
            ? presenceContext.identityID.split('::')[1]
            : myUserID;

    return React.useMemo(
        () => <PostEndorsementsMemo identityID={identityID} {...props} />,
        [props, identityID],
    );
}

function PostEndorsementsMemo({
    identityID,
    vertical = false,
    small = false,
    personaKey,
    postKey,
}) {
    const {dispatch} = React.useContext(FeedMenuDispatchContext);
    const [endorsements, setEndorsements] = React.useState();
    const renderEmojiList = ({item: endorsement}) => {
        const [emoji, userIDs] = endorsement;
        const isMyEndorsement = userIDs.includes(identityID);
        const bgcolor = isMyEndorsement ? '#324180' : '#292A40';
        const style = {
            ...Styles.commentEndorsements,
            width: small ? 50 : 50,
            height: small ? 25 : 25,
            marginTop: 2,
            backgroundColor: bgcolor,
            borderColor: isMyEndorsement
                ? colors.textFaded3
                : colors.paleBackground,
            // updated feb 2023: merging into existing style merges... sigh //
            borderRadius: 8,
            borderWidth: 0,
            padding: 0,
            width: 'auto',
            height: 24,
        };

        function toggleEndorsement(emoji, userMarked) {
            const docRef = firestore()
                .collection('personas')
                .doc(personaKey)
                .collection('posts')
                .doc(postKey)
                .collection('live')
                .doc('endorsements');
            const fieldValue = firestore.FieldValue;
            const fieldUpdate = userMarked
                ? fieldValue.arrayRemove(identityID)
                : fieldValue.arrayUnion(identityID);
            docRef.set(
                {
                    endorsements: {[`${emoji}`]: fieldUpdate},
                },
                {merge: true},
            );
        }

        const onPressEndorsement = () =>
            toggleEndorsement(
                emoji,
                (endorsements[emoji] || []).includes(identityID),
            );

        const onLongPressEndorsement = () =>
            dispatch({
                type: 'openEndorsementUsersMenu',
                payload: {
                    postKey,
                    personaKey,
                    endorsement: emoji,
                    endorsers: endorsements,
                },
            });

        return (
            <TouchableOpacity
                onPress={onPressEndorsement}
                onLongPress={onLongPressEndorsement}>
                <View style={style}>
                    <Text
                        style={{
                            ...baseText,
                            fontFamily: null,
                            fontSize: small ? 12 : 13,
                            color: colors.text,
                        }}>
                        {emoji} {userIDs.length}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    React.useEffect(() => {
        return firestore()
            .collection('personas')
            .doc(personaKey)
            .collection('posts')
            .doc(postKey)
            .collection('live')
            .doc('endorsements')
            .onSnapshot(snap => {
                const newEndorsements = snap.data()?.endorsements;
                setEndorsements(newEndorsements);
            });
    }, [postKey, personaKey]);
    const endorsementsList = Object.entries(endorsements || {})
        .filter(([, authors]) => authors.length > 0)
        .sort((a, b) => a[0].localeCompare(b[0], 'en'));
    const onPressDefault = ({nativeEvent: {pageY}}) => {
        dispatch({
            type: 'openEndorsementsMenu',
            payload: {
                touchY: pageY,
                postKey,
                personaKey,
            },
        });
    };
    //console.log('rendering PostEndorsemenst', vertical);
    return (
        <TouchableWithoutFeedback onPress={onPressDefault}>
            <View
                style={{
                    borderWidth: 0,
                    borderColor: 'pink',
                }}>
                <FlatList
                    bounces={false}
                    // numColumns={6}
                    horizontal
                    extraData={endorsementsList}
                    data={endorsementsList}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderEmojiList}
                />
            </View>
        </TouchableWithoutFeedback>
    );
}

export function FileList({fileUris}) {
    const renderItem = useCallback(({item}) => {
        return (
            <TouchableOpacity
                onPress={() => Clipboard.setString(item.uri)}
                style={{
                    borderColor: 'blue',
                    borderWidth: 0,
                    marginLeft: 5,
                    marginTop: -5,
                    width: 50,
                    zIndex: 100,
                    elevation: 100,
                    marginStart: 15,
                    marginEnd: 15,
                }}>
                <Icon
                    color={'white'}
                    style={{
                        zIndex: 0,
                        elevation: 0,
                        borderRadius: 5,
                        backgroundColor: colors.defaultImageBackground,
                        marginTop: 10,
                    }}
                    size={22}
                    name={'file'}
                />
                <View
                    style={{
                        alignSelf: 'center',
                        borderWidth: 0,
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            color: colors.weakEmphasisOrange,
                            fontSize: 14,
                        }}>
                        {item.name}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }, []);

    return (
        <FlatList
            bounces={false}
            showsHorizontalScrollIndicator={false}
            style={{
                borderColor: 'purple',
                borderWidth: 0,
                flexDirection: 'row-reverse',
            }}
            contentContainerStyle={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                alignSelf: 'center',
                justifyContent: 'center',
            }}
            horizontal={true}
            data={fileUris}
            keyExtractor={item => {
                return item.uri;
            }}
            renderItem={renderItem}
        />
    );
}

export function AutoSavePostText({hasMedia = true, fullText, displayText}) {
    return (
        <View style={{marginLeft: 20}}>
            {fullText !== '' ? (
                <MarkDown
                    fontFamily={fonts.regular}
                    text={displayText}
                    hasMedia={hasMedia}
                />
            ) : null}
        </View>
    );
}

export function FollowPersonaBigReal({personaID, showUnfollow = true}) {
    const {personaMap} = useContext(GlobalStateContext);

    const amInCommunity = personaMap
        ? personaMap[personaID]?.communityMembers?.includes(
              auth().currentUser.uid,
          )
        : false;
    //console.log('PostCommon FollowPersonaBig', amInCommunity);
    let isAuthor =
        personaMap &&
        personaMap[personaID].authors.includes(auth().currentUser.uid);

    const onPress = () => {
        if (amInCommunity) {
            console.log('not yet implemented leave');
        } else {
            // TODO implement me
            console.log('not yet implemented follow');
        }
    };
    return isAuthor ? null : (
        <GeneralFollow
            followOnPress={onPress}
            showUnfollow={showUnfollow}
            followed={amInCommunity}
        />
    );
}

const Styles = StyleSheet.create({
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
        padding: 0,
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
        fontSize: 16,
    },
    replyText: {
        color: colors.textFaded2,
        fontSize: 14,
        fontStyle: 'italic',
        paddingLeft: 17.5,
    },
    replyHeaderText: {
        color: colors.textFaded2,
        fontSize: 14,
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
        fontFamily: fonts.bold,
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
        fontSize: 14,
        color: colors.textFaded2,
        marginTop: 2,
        marginBottom: 0,
        height: 20,
    },
});
