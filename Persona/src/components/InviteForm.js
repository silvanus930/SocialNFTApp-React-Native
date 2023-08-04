import auth from '@react-native-firebase/auth';
import {getServerTimestamp} from 'actions/constants';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import FloatingHeader from 'components/FloatingHeader';
import UserBubble from 'components/UserBubble';
import React, {useCallback, useContext, useRef} from 'react';
import {
    Alert,
    Animated as RNAnimated,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateContext} from 'state/GlobalState';
import {PersonaStateContext} from 'state/PersonaState';
import {InviteModalStateRefContext} from 'state/InviteModalStateRef';
import {clog, cwarn} from 'utils/log';

export default function InviteForm({authors, persona}) {
    // read props from navigation params
    const InviteStateContext = React.useContext(InviteModalStateRefContext);
    const communityContext = React.useContext(CommunityStateContext);
    let communityMap = communityContext?.communityMap;
    let currentCommunity = communityContext.currentCommunity;
    let communityID = communityContext.currentCommunity;
    let personaKey;
    let personaContext;
    if (!InviteStateContext.current.usePersona) {
        personaContext = React.useContext(PersonaStateContext);
        personaKey = personaContext?.persona?.pid;
    }

    console.log('InviteStateContext', InviteStateContext);
    const {userMap, personaMap} = useContext(GlobalStateContext);

    const [selectedUsers, setSelectedUsers] = React.useState([]);
    const [invitedUsers, setInvitedUsers] = React.useState(null);
    //let userList = communityMap[currentCommunity].members;
    let userList = Object.keys(userMap).filter(key => userMap[key].human);
    userList = userList.sort((a, b) =>
        userMap[a].userName.localeCompare(userMap[b].userName),
    );

    React.useEffect(() => {
        const entityID = personaKey || communityID;
        return firestore()
            .collection('invites')
            .where('destination.id', '==', entityID)
            .where('accepted', '==', false)
            .where('deleted', '==', false)
            .onSnapshot(querySnapshot => {
                if (querySnapshot.docs.length > 0) {
                    const _invitedUsers = querySnapshot.docs.map(invite =>
                        invite.get('invitedUserID'),
                    );
                    setInvitedUsers(_invitedUsers);
                }
            });
    }, [communityID, personaKey]);

    let navigation = useNavigation();

    const handleFindByPhone = () => {
        navigation.navigate('Find User');
    };

    const [searchText, setSearchText] = React.useState('');

    const renderSelectedUser = ({item}) => {
        console.log('renderSelectedUser', item);

        const toggleSelectUser = () => {
            if (selectedUsers.includes(item)) {
                setSelectedUsers(selectedUsers.filter(i => i !== item));
            } else {
                const newUsers = new Set([...selectedUsers, item]);
                setSelectedUsers([...newUsers]);
            }
        };
        return (
            <TouchableOpacity
                onPress={toggleSelectUser}
                style={{
                    borderRadius: 12,
                    backgroundColor: colors.lightHighlight,
                    padding: 8,
                    flexDirection: 'row',
                    flex: 0,
                    marginBottom: 10,
                    marginStart: 80,
                    marginEnd: 80,
                }}>
                <UserBubble
                    bubbleSize={15}
                    showName={false}
                    user={userMap[item]}
                />

                <Text style={{color: colors.textBright}}>
                    {userMap[item].userName}
                </Text>

                <Icon
                    name={'x'}
                    style={{top: 1.4, marginStart: 5}}
                    size={15}
                    color={colors.maxFaded}
                />
            </TouchableOpacity>
        );
    };
    const renderUser = React.useCallback(
        ({item}) => {
            let csize = 15;
            let isMember =
                personaMap &&
                personaKey &&
                personaMap[personaKey] &&
                personaMap[personaKey].authors
                    ? personaMap[personaKey].authors.includes(item)
                    : communityMap[currentCommunity].members.includes(item);

            const isAlreadyInvited = invitedUsers?.includes(item);

            const toggleSelectUser = () => {
                if (!isMember && !isAlreadyInvited) {
                    if (selectedUsers.includes(item)) {
                        setSelectedUsers(selectedUsers.filter(i => i !== item));
                    } else {
                        const newUsers = new Set([...selectedUsers, item]);
                        setSelectedUsers([...newUsers]);
                    }
                }
            };

            return (
                <TouchableOpacity
                    style={{
                        backgroundColor: isMember
                            ? colors.background
                            : colors.background,
                    }}
                    disabled={isMember}
                    onPress={toggleSelectUser}>
                    <View
                        style={{
                            borderColor: colors.seperatorLineColor,
                            borderBottomWidth: 0.4,
                            padding: 8,
                            marginStart: 10,
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            flexDirection: 'row',
                            flex: 1,
                        }}>
                        <UserBubble
                            bubbleSize={28}
                            showName={false}
                            user={userMap[item]}
                        />

                        <Text style={{color: colors.textBright}}>
                            {userMap[item].userName}
                        </Text>

                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row-reverse',
                                justifyContent: 'flex-start',
                            }}>
                            {!selectedUsers.includes(item) &&
                            !isMember &&
                            !isAlreadyInvited ? (
                                <View
                                    style={{
                                        borderRadius: csize,
                                        width: csize,
                                        height: csize,
                                        borderWidth: 0.6,
                                        borderColor: colors.maxFaded,
                                        marginStart: 20,
                                    }}
                                />
                            ) : (
                                <AntDesign
                                    name={'checkcircle'}
                                    color={
                                        isMember
                                            ? colors.green
                                            : isAlreadyInvited
                                            ? colors.textFaded
                                            : colors.actionText
                                    }
                                    size={csize}
                                />
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        },
        [
            personaMap,
            personaKey,
            communityMap,
            currentCommunity,
            invitedUsers,
            userMap,
            selectedUsers,
        ],
    );

    const onSubmit = useCallback(async () => {
        const batch = firestore().batch();
        selectedUsers.map(selectedUserID => {
            const inviteData = {
                createdAt: getServerTimestamp(),
                invitedByUserID: auth().currentUser.uid,
                invitedUserID: selectedUserID,
                accepted: false,
                deleted: false,
            };
            if (personaKey) {
                inviteData.destination = {
                    type: 'project',
                    name: personaContext?.persona?.name,
                    id: personaContext?.persona?.pid,
                    ref: firestore()
                        .collection('personas')
                        .doc(personaContext?.persona?.pid),
                };
            } else {
                inviteData.destination = {
                    type: 'community',
                    name: communityMap[currentCommunity]?.name,
                    id: currentCommunity,
                    ref: firestore()
                        .collection('communities')
                        .doc(currentCommunity),
                };
            }
            const inviteRef = firestore().collection('invites').doc();
            batch.set(inviteRef, inviteData);
        });

        await batch.commit();

        setSelectedUsers([]);
        Alert.alert('Success');
    }, [
        communityMap,
        currentCommunity,
        personaContext?.persona?.name,
        personaContext?.persona?.pid,
        personaKey,
        selectedUsers,
    ]);

    /*const headerRight = React.useCallback(
        () =>
            selectedUsers.length ? (
                <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity
                        hitSlop={{left: 20, right: 30, bottom: 25, top: 20}}
                        onPress={onSubmit}
                        style={{
                            flexDirection: 'row',
                            elevation: 999999,
                            paddingRight: 15,
                            zIndex: 99999,
                            marginLeft: 0,
                            marginRight: 5,
                            paddingLeft: 10,
                        }}>
                        <Text
                            style={{
                                color: colors.textBright,
                                fontFamily: fonts.bold,
                                fontSize: 16,
                            }}>
                            Update
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <></>
            ),
        [onSubmit, selectedUsers.length],
    );*/

    const animatedOffset = useRef(new RNAnimated.Value(0)).current;
    /*React.useEffect(() => {
        navigation.setOptions({
            headerRight: headerRight,
        });
    }, [headerRight, navigation, onSubmit, selectedUsers]);*/
    return (
        <View>
            <FloatingHeader back={true} animatedOffset={animatedOffset} />
            <View style={{height: 120}} />
            <TextInput
                multiline={false}
                style={{
                    fontFamily: fonts.regular,
                    borderRadius: 8,
                    backgroundColor: colors.background,
                    color: colors.text,
                    padding: 10,
                    marginStart: 40,
                    paddingLeft: 40,
                    alignItems: 'center',
                    marginEnd: 40,
                    fontSize: 18,
                    color: colors.brightText,
                    marginTop: 20,
                }}
                placeholder={'name, number or wallet address'}
                color={colors.textBright}
                placeholderTextColor={colors.maxFaded}
                value={searchText}
                onChangeText={setSearchText}
            />
            <FontAwesome
                style={{
                    zIndex: 99999999999,
                    elevation: 99999999999,
                    left: 52,
                    top: -33,
                    width: 50,
                    height: 50,
                }}
                name={'search'}
                size={22}
                color={colors.maxFaded}
            />
            <View style={{marginTop: -48}} />
            {selectedUsers.length ? (
                <View>
                    <View
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: 20,
                        }}>
                        <TouchableOpacity
                            onPress={onSubmit}
                            style={{
                                borderWidth: 1,
                                borderColor: colors.actionText,
                                paddingLeft: 8,
                                paddingRight: 8,
                                paddingTop: 5,
                                paddingBottom: 5,
                                borderRadius: 6,
                                backgroundColor: colors.actionText,
                            }}>
                            <Text
                                style={{
                                    ...baseText,
                                    fontSize: 18,
                                }}>
                                Invite ({selectedUsers?.length})
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            borderColor: 'orange',
                            borderWidth: 0,
                            paddingTop: 20,
                        }}>
                        <RNAnimated.FlatList
                            bounces={false}
                            style={{
                                display: 'flex',
                                borderColor: 'magenta',
                                borderWidth: 0,
                            }}
                            renderItem={renderSelectedUser}
                            data={selectedUsers}
                        />
                    </View>
                </View>
            ) : (
                <></>
            )}

            <TouchableOpacity
                onPress={handleFindByPhone}
                style={{
                    marginStart: 40,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginEnd: 40,
                    padding: 10,
                    borderRadius: 8,
                    marginTop: 20,
                    backgroundColor: colors.paleBackground,
                }}>
                <Text
                    style={{
                        fontSize: 28,
                        fontStyle: 'italic',
                        color: colors.postAction,
                        top: -2,
                    }}>
                    #
                </Text>
                <Text
                    style={{
                        fontSize: 16,
                        color: colors.postAction,
                        fontFamily: fonts.bold,
                        marginStart: 10,
                    }}>
                    Invite by phone number
                </Text>
                <View
                    style={{
                        borderColor: 'orange',
                        borderWidth: 0,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        width: '30%',
                    }}>
                    <Text style={{color: colors.maxFaded, fontSize: 20}}>
                        {'>'}
                    </Text>
                </View>
            </TouchableOpacity>

            <View
                style={{
                    borderWidth: 0,
                    borderColor: 'orange',
                    marginTop: 20,
                    marginBottom: 20,
                }}>
                <RNAnimated.FlatList
                    bounces={true}
                    ListFooterComponent={
                        <View
                            style={{
                                height: 600,
                                backgroundColor: colors.gridBackground,
                            }}
                        />
                    }
                    style={{
                        borderRadius: 8,
                        backgroundColor: colors.gridBackground,
                        marginStart: 40,
                        marginEnd: 40,
                    }}
                    data={userList.filter(uid =>
                        !searchText
                            ? true
                            : userMap[uid].userName
                                  .toLowerCase()
                                  .includes(searchText.toLowerCase()) ||
                              userMap[uid].number
                                  ?.toLowerCase()
                                  .includes(searchText.toLowerCase()) ||
                              userMap[uid].wallet
                                  ?.toLowerCase()
                                  .includes(searchText.toLowerCase()),
                    )}
                    renderItem={renderUser}
                />
            </View>
        </View>
    );
}
