import React from 'react';
import baseText from 'resources/text';
import FastImage from 'react-native-fast-image';
import colors from 'resources/colors';
import images from 'resources/images';
import {getUserIsLive, timestampToDateString} from 'utils/helpers';
import {Text, TouchableOpacity, StyleSheet, View} from 'react-native';
import getResizedImageUrl from 'utils/media/resize';

export default function UserBubble({
    margin = 5,
    marginLeft = undefined,
    showName = true,
    bubbleSize = 60,
    force = true,
    user,
    onPress = null,
    onLongPress = null,
    disabled = true,
    authors = [],
}) {
    if (!user) {
        return null;
    }
    const userIsLive = getUserIsLive({userHeartbeat: user.heartbeat});
    //bubbleSize === 40 && log('in userBubble', user);
    let smallMaxUserNameLength = 14; // depends on fontSize below
    let smallUserNameFontSize = 8;
    /*log(
    'in UserBubble with authors',
    authors.map((u) => u.uid),
  );*/
    let userOpac = true;

    return force || !authors.map(a => a.uid).includes(user?.uid) ? (
        <View style={{marginLeft: marginLeft || margin, marginRight: margin}}>
            {user?.heartbeat ? (
                <View
                    style={{
                        width: 15,
                        height: 15,
                        borderRadius: 15,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        top: 11,
                        left: 18.5,
                        zIndex: 99,
                    }}>
                    {false && (
                        <View
                            style={{
                                backgroundColor: userIsLive
                                    ? colors.fadedGreen
                                    : colors.textFaded2,
                                position: 'absolute',
                                borderRadius: 12.5,
                                width: 12.5,
                                height: 12.5,
                                marginTop: 3,
                                top: 0,
                                left: 0,
                                right: 0,
                                zIndex: 99,
                            }}
                        />
                    )}
                    <Text
                        style={{
                            ...baseText,
                            marginLeft: -2.2,
                            fontSize: 5.5,
                            marginTop: 2,
                            color: colors.textFaded,
                            fontWeight: 'bold',
                            elevation: 9000,
                            zIndex: 9000,
                        }}>
                        {!userIsLive && user?.heartbeat.seconds
                            ? timestampToDateString(user?.heartbeat?.seconds)
                            : ''}
                    </Text>
                </View>
            ) : null}
            <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                disabled={disabled}
                style={{
                    marginLeft: bubbleSize / 5,
                    marginRight: bubbleSize / 5,
                    marginTop: 2,
                    width: bubbleSize,
                    height: bubbleSize,
                    opacity: userOpac,
                }}>
                <View
                    style={{
                        position: 'absolute',
                        opacity: 0.25,
                        zIndex: 999,
                        width: bubbleSize,
                        height: bubbleSize,
                        borderRadius: bubbleSize,
                    }}
                />
                <FastImage
                    source={{
                        uri: user.profileImgUrl
                            ? getResizedImageUrl({
                                  origUrl:
                                      user.profileImgUrl ||
                                      images.userDefaultProfileUrl,
                                  height: Styles.profilePicture.height,
                                  width: Styles.profilePicture.width,
                              })
                            : images.userDefaultProfileUrl,
                    }}
                    style={{
                        ...Styles.profilePicture,
                        marginLeft: 0,
                        marginRight: 0,
                        width: bubbleSize,
                        height: bubbleSize,
                        marginBottom: 10,
                    }}
                />
                {showName && (
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            borderColor: 'purple',
                            borderWidth: 0,
                            marginTop: -6,
                            marginLeft: -13,
                        }}>
                        <Text
                            style={{
                                ...baseText,
                                lineHeight: null,
                                fontSize: smallUserNameFontSize,
                                color: colors.textFaded2,
                            }}>
                            {user?.userName?.substring(
                                0,
                                smallMaxUserNameLength,
                            ) +
                                (user?.userName?.length > smallMaxUserNameLength
                                    ? '...'
                                    : '')}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    ) : (
        <></>
    );
}

const Styles = StyleSheet.create({
    chatSpacer: {
        height: 12,
    },

    profilePicture: {
        zIndex: 103,
        marginTop: 0,
        height: 40,
        width: 40,
        borderRadius: 100,
        marginLeft: 20,
    },
    navTouchSurfaceRight: {
        opacity: 0,
        zIndex: 99,
        top: 0,
        left: -30,
        width: 80,
        height: 45,
        borderBottomLeftRadius: 25,
        position: 'absolute',
    },
});
