import React, {useState} from 'react';
import baseText from 'resources/text';
import isEqual from 'lodash.isequal';
import {Alert, View, Text, StyleSheet} from 'react-native';
import {updatePersonaAuthor} from 'actions/personas';
import colors from 'resources/colors';
import {TouchableOpacity} from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';
import {timestampToDateString} from 'utils/helpers';
import images from 'resources/images';
import useNavPushDebounce from 'hooks/navigationHooks';
import {TitleText} from 'components/shared/TitleText';
import {useNavToPersona} from 'hooks/navigationHooks';

import {clog, cwarn, iwarn} from 'utils/log';
import getResizedImageUrl from 'utils/media/resize';
const CUSTOM_LOG_WARN_HEADER = '!! components/ActivityEventApplication';
const log = (...args) =>
    global.LOG_DEBUG && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_DEBUG && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps).length;
}

export default React.memo(ActivityEventApplication, propsAreEqual);
function ActivityEventApplication({navigation, event, eventBody, icon}) {
    const navToUserProfile = useNavPushDebounce(
        'Profile',
        {userID: event.createdByUser.id},
        [event],
    );
    const navToPersona = useNavToPersona(navigation);
    const [collabAccepted, setCollabAccepted] = useState(event.accepted);

    async function inviteCollab() {
        Alert.alert(
            `Accept ${event.createdByUser.userName}'s application to become an author on ${event.persona.name}?`,
            'Are you sure?',
            [
                {text: 'no', onPress: () => log('Pressed no'), style: 'cancel'},
                {
                    text: 'yes',
                    onPress: async () => {
                        await updatePersonaAuthor(event);
                    },
                },
            ],
        );
    }

    return (
        <View style={Styles.eventSimpleContainer}>
            <View
                style={{
                    flexDirection: 'column',
                    width: '100%',
                    flex: 1,
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                        marginBottom: 20,
                        flex: 1,
                        justifyContent: 'space-between',
                    }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                            marginLeft={10}
                            style={{...baseText, color: colors.textFaded2}}>
                            {timestampToDateString(event.created_at.seconds)}
                        </Text>
                    </View>

                    <View style={Styles.eventItemTextContainer}>
                        <TitleText style={Styles.eventItemText}>
                            {eventBody()}
                            {'  '}
                        </TitleText>
                    </View>
                    <View style={{flexDirection: 'row'}}>
                        <TouchableOpacity onPress={navToUserProfile}>
                            <FastImage
                                source={{
                                    uri: getResizedImageUrl({
                                        origUrl:
                                            event.createdByUser.profileImgUrl ||
                                            images.userDefaultProfileUrl,
                                        width: Styles.profilePicture.width,
                                        height: Styles.profilePicture.height,
                                    }),
                                }}
                                style={Styles.profilePicture}
                            />
                        </TouchableOpacity>
                        <View
                            style={{
                                marginLeft: 10,
                                marginRight: 10,
                                marginTop: 7,
                            }}>
                            {icon}
                        </View>
                        <TouchableOpacity
                            onPress={() => navToPersona(event.persona_id)}>
                            <FastImage
                                source={{
                                    uri: getResizedImageUrl({
                                        origUrl:
                                            event.persona.profileImgUrl ||
                                            images.personaDefaultProfileUrl,
                                        height: Styles.profilePicture.height,
                                        width: Styles.profilePicture.width,
                                    }),
                                }}
                                style={Styles.profilePicture}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <View
                style={{
                    marginTop: -10,
                    justifyContent: 'flex-end',
                    flexDirection: 'row',
                }}>
                {!collabAccepted && (
                    <TouchableOpacity
                        style={{elevation: 9999, zIndex: 9999}}
                        onPress={inviteCollab}>
                        <Text style={{...baseText, ...Styles.collabInvite}}>
                            Accept
                        </Text>
                    </TouchableOpacity>
                )}
                {collabAccepted && (
                    <Text style={{...baseText, ...Styles.collabAccepted}}>
                        Accepted
                    </Text>
                )}
            </View>
        </View>
    );
}

const Styles = StyleSheet.create({
    eventSimpleContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    eventItemTextContainer: {
        borderColor: 'blue',
        borderWidth: 0,
        flex: 0.88,
    },
    eventItemText: {
        color: colors.text,
    },
    profilePicture: {
        height: 38,
        width: 38,
        borderRadius: 38,
    },
    collabInvite: {
        color: 'white',
        marginLeft: 15,
        marginRight: 20,
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 5,
        paddingBottom: 5,
        alignSelf: 'center',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    collabAccepted: {
        color: 'white',
        marginLeft: 15,
        marginRight: 10,
        paddingLeft: 10,
        paddingRight: 10,
        alignSelf: 'center',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
