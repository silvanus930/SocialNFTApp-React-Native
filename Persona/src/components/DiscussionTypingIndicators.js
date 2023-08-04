import React, {useCallback, useEffect, useState, useRef, useMemo} from 'react';
import baseText from 'resources/text';
import fonts from 'resources/fonts';
import {FlatList, View, Text} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';
import colors from 'resources/colors';
import images from 'resources/images';
import {GlobalStateContext} from 'state/GlobalState';
import getResizedImageUrl from 'utils/media/resize';

export default function DiscussionTypingIndicators({
    offset = 0,
    parentObjPath,
    threadID = null,
    tiny = false,
    replyComment,
    isDM,
}) {
    const myUserID = auth().currentUser.uid;
    const [typingUsers, setTypingUsers] = useState([]);
    const [typingThreadUsers, setTypingThreadUsers] = useState([]);
    const [typingIdentityObjs, setTypingIdentityObjs] = useState([]);
    const {userMap, personaMap} = React.useContext(GlobalStateContext);

    useEffect(() => {
        return parentObjPath
            ? firestore()
                  .doc(parentObjPath)
                  .collection('presence')
                  .doc('typing')
                  .onSnapshot(snap => {
                      if (threadID === null) {
                          setTypingIdentityObjs(snap.get('typing') || {});
                      } else {
                          setTypingIdentityObjs(
                              snap.get(`threadTyping.${threadID}`) || {},
                          );
                      }
                  })
            : null;
    }, [myUserID]);

    useEffect(() => {
        const interval = setInterval(() => {
            let newTypingUserObj = Object.entries(typingIdentityObjs);
            newTypingUserObj = newTypingUserObj.filter(
                ([user, item]) =>
                    item.hasOwnProperty('heartbeat') &&
                    item.heartbeat?.seconds + 5 > Date.now() / 1000,
            ); // for backwards compatibility
            const typingIdentities = newTypingUserObj.filter(
                ([user, item]) => user !== myUserID,
            );
            setTypingUsers(
                typingIdentities
                    .filter(([user, item]) => !item?.inThread)
                    .map(([user, item]) => item.identity),
            );
            setTypingThreadUsers(
                typingIdentities
                    .filter(([user, item]) => item?.inThread)
                    .map(([user, item]) => item.identity),
            );
        }, 1000);
        return () => clearInterval(interval);
    }, [myUserID, typingIdentityObjs]);

    let names;
    if (typingUsers.length < 3 > 0) {
        names = typingUsers
            .map(id =>
                personaMap[id] ? personaMap[id]?.name : userMap[id]?.userName,
            )
            .join(', ');
    } else {
        names = typingUsers.length.toString() + ' people';
    }

    let replyCommentShift = replyComment ? -110 : -56;
    
    if(isDM) {
        replyCommentShift = replyComment ? -155 : -90;
    }    

    const keyExtractor = item => item;
    const renderWhosTyping = useCallback(
        ({item}) => {
            const anonymous = Boolean(personaMap[item]);
            const profileUri = anonymous
                ? personaMap[item]?.profileImgUrl ||
                  images.personaDefaultProfileUrl
                : userMap[item].profileImgUrl || images.userDefaultProfileUrl;
            return (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 4,
                    }}>
                    <FastImage
                        source={{
                            uri: getResizedImageUrl({
                                origUrl: profileUri,
                                width: 15,
                                height: 15,
                            }),
                        }}
                        style={{
                            width: 15,
                            height: 15,
                            borderRadius: 15,
                        }}
                    />
                </View>
            );
        },
        [personaMap, userMap],
    );

    if (tiny) {
        return (
            typingUsers.length > 0 && (
                <View
                    style={{
                        left: 59,
                        top: 16,
                        width: 5,
                        height: 5,
                        borderRadius: 10,
                        backgroundColor: colors.fadedGreen,
                        position: 'absolute',
                    }}
                />
            )
        );
    } else {
        return (
            <>
                {true ||
                    (typingThreadUsers.length > 0 && (
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                                paddingLeft: 10 + offset,
                                top: typingUsers.length > 0 ? -41 : -21,
                                zIndex: 2,
                                position: 'absolute',
                                backgroundColor: 'transparent',
                                opacity: 0.9,
                                height: 20,
                                width: '100%',
                                borderColor: 'red',
                                borderWidth: 0.4,
                            }}>
                            <View>
                                <FlatList
                                    bounces={false}
                                    showsHorizontalScrollIndicator={false}
                                    horizontal={true}
                                    data={typingThreadUsers}
                                    extraData={typingThreadUsers}
                                    keyExtractor={keyExtractor}
                                    renderItem={renderWhosTyping}
                                />
                            </View>
                            <View>
                                <Text
                                    style={{
                                        ...baseText,
                                        color: colors.textFaded2,
                                        fontSize: 12,
                                        marginTop: 2.5,
                                        marginRight: -1,
                                    }}>
                                    <Text
                                        style={{
                                            ...baseText,
                                            fontSize: 11,
                                            fontFamily: fonts.medium,
                                        }}>
                                        {names}
                                    </Text>
                                </Text>
                            </View>
                            <View style={{marginTop: 2.5}}>
                                <Text
                                    style={{
                                        ...baseText,
                                        color: colors.textFaded2,
                                        fontSize: 12,
                                    }}>
                                    {' '}
                                    {typingThreadUsers.length === 1
                                        ? 'is threading...'
                                        : 'are threading...'}
                                </Text>
                            </View>
                        </View>
                    ))}
                {typingUsers.length > 0 && (
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            paddingLeft: 10 + offset,
                            top: replyCommentShift,
                            position: 'absolute',
                            backgroundColor: 'transparent',
                            opacity: 0.9,
                            height: 22,
                            left: -3,
                            width: '105%',
                            borderColor: 'red',
                            borderWidth: 0,
                            zIndex: 9999999,
                            elevation: 9999999,
                        }}>
                        <View>
                            <FlatList
                                bounces={false}
                                showsHorizontalScrollIndicator={false}
                                horizontal={true}
                                data={typingUsers}
                                extraData={typingUsers}
                                keyExtractor={keyExtractor}
                                renderItem={renderWhosTyping}
                            />
                        </View>
                        <View>
                            <Text
                                style={{
                                    ...baseText,
                                    color: colors.textFaded2,
                                    fontSize: 12,
                                    marginTop: 2.5,
                                    marginRight: -1,
                                }}>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        ...baseText,
                                        fontFamily: fonts.semibold,
                                    }}>
                                    {names}
                                </Text>
                            </Text>
                        </View>
                        <View style={{marginTop: 2.5}}>
                            <Text
                                style={{
                                    ...baseText,
                                    color: colors.textFaded2,
                                    fontSize: 12,
                                }}>
                                {' '}
                                {typingUsers.length === 1
                                    ? 'is typing...'
                                    : 'are typing...'}
                            </Text>
                        </View>
                    </View>
                )}
            </>
        );
    }
}
