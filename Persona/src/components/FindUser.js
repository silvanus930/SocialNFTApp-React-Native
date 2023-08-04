import functions from '@react-native-firebase/functions';
import FloatingHeader from 'components/FloatingHeader';
import getResizedImageUrl from 'utils/media/resize';
import React, {useContext, useRef} from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated as RNAnimated,
    PermissionsAndroid,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Contacts from 'react-native-contacts';
import FastImage from 'react-native-fast-image';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import images from 'resources/images';
import baseText from 'resources/text';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateContext} from 'state/GlobalState';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import PhoneNumberInput from './PhoneNumberInput';

export default function FindUser({
    showHeader = true,
    authors,
    transparentBackground = false,
    navigation,
    userID,
    HeaderComponent = null,
    personaVoice = false,
}) {
    const onPressAddMembers = () => {
        Alert.alert(
            "No blockchain connected. Set ['solana', 'ethereum','polygon'] in persona-srv.config.js",
        );
    };
    console.log('rendering FindUser', authors, persona);
    const {
        user: currentUser,
        userMap,
        personaMap,
    } = useContext(GlobalStateContext);
    const {
        current: {communityMap, currentCommunity},
    } = useContext(CommunityStateRefContext);
    const {
        current: {persona},
    } = useContext(PersonaStateRefContext);

    const entityType = persona?.pid ? 'project' : 'community';
    const entityID = persona?.pid || currentCommunity;
    const entityName = persona?.name || communityMap[currentCommunity]?.name;

    const renderItem = React.useCallback(
        ({item}) => {
            console.log(`InviteScreen List renderItem ${item}`);
            const personaProfileSize = 30;
            const imageUrl = userMap[item].profileImgUrl;

            return (
                <>
                    <View
                        style={{
                            borderBottomWidth: 0.4,
                            borderBottomColor: colors.seperatorLineColor,
                            marginStart: 110,
                            marginEnd: 40,
                            marginTop: 0,
                            marginBottom: 0,
                        }}
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            borderColor: 'orange',
                            borderWidth: 0,
                            backgroundColor: colors.paleBackground,
                            marginStart: 40,
                            marginEnd: 40,
                        }}>
                        <FastImage
                            source={{
                                uri: getResizedImageUrl({
                                    origUrl: imageUrl
                                        ? imageUrl
                                        : images.personaDefaultProfileUrl,
                                    height: personaProfileSize,
                                    width: personaProfileSize,
                                }),
                            }}
                            style={{
                                marginLeft: 30,
                                height: personaProfileSize,
                                width: personaProfileSize,
                                borderRadius: personaProfileSize,
                                borderColor: 'yellow',
                                borderWidth: 0,
                                marginTop: 10,
                                marginBottom: 10,
                            }}
                        />
                        <View
                            style={{
                                borderColor: 'orange',
                                borderWidth: 0,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <Text
                                style={{
                                    marginLeft: 8,
                                    fontSize: 16,
                                    color: colors.text,
                                }}>
                                {userMap[item]?.userName}
                            </Text>
                        </View>
                    </View>
                </>
            );
        },
        [userMap],
    );

    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [userList, setUserList] = React.useState([]);
    const [pending, setPending] = React.useState(false);

    const handleInvite = async () => {
        if (!phoneNumber) {
            Alert.alert('A phone number is required.');
            return;
        }

        if (/[^$,\.\d]/.test(phoneNumber.replace('+', ''))) {
            Alert.alert('Invalid phone number');
            return;
        }

        try {
            setPending(true);
            const inviteNewUserByPhone = functions().httpsCallable(
                'inviteNewUserByPhone',
            );
            const response = await inviteNewUserByPhone({
                invitedByUserID: currentUser?.id,
                phoneNumber,
                destination: {
                    type: entityType,
                    name: entityName,
                    id: entityID,
                },
            });

            const {result, code} = response.data;
            switch (result) {
                case 'success':
                    Alert.alert(`Successfully invited ${phoneNumber}`);
                    break;
                case 'error':
                    switch (code) {
                        case 'invalid-phone-number':
                            Alert.alert(
                                'The phone number you entered is invalid. Please try again.',
                            );
                            break;
                        case 'user-already-exists':
                            Alert.alert(
                                'This phone number is already in use by an existing user.',
                            );
                            break;
                        case 'user-already-invited':
                            Alert.alert('This user has already been invited.');
                            break;
                        default:
                            Alert.alert(`Something went wrong: ${code}`);
                            break;
                    }
                    break;
            }
        } catch (err) {
            Alert.alert('Something went wrong - please try again');
        }
        setPending(false);
    };

    React.useEffect(() => {
        const fetchContacts = async () => {
            console.log('calling Contacts.getAll');
            const contacts = await Contacts.getAll();
            setUserList(contacts);
        }

        const requestContactsPermission = async () => {

            let status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
            if (status === 'denied' || status === 'never_ask_again') {
                throw Error('Permissions not granted to access Contacts')
            }
            fetchContacts();

        }   
        requestContactsPermission();
    }, []);

    const renderUser = ({item}) => {
        // console.log('Find user list renderUser', item);
        return <></>;
    };

    const animatedOffset = useRef(new RNAnimated.Value(0)).current;
    const onScroll = RNAnimated.event(
        [{nativeEvent: {contentOffset: {y: animatedOffset}}}],
        {
            useNativeDriver: true,
        },
    );
    return (
        <View>
            <View style={{height: 80}} />
            <FloatingHeader back={true} animatedOffset={animatedOffset} />
            <View
                style={{
                    padding: 10,
                    marginStart: 40,
                    marginEnd: 40,
                    marginTop: 90,
                    marginBottom: 20,
                }}>
                <Text style={{...baseText}}>
                    Invite a new user to Persona and add them to{' '}
                    <Text style={{fontFamily: fonts.semibold}}>
                        {entityName}
                    </Text>
                </Text>
            </View>
            <View style={{marginStart: 40, marginEnd: 40}}>
                <PhoneNumberInput
                    onChangePhoneNumberCallback={setPhoneNumber}
                />
            </View>
            {!pending && (
                <TouchableOpacity
                    onPress={handleInvite}
                    style={{
                        marginStart: 40,
                        flexDirection: 'row',
                        marginEnd: 40,
                        padding: 10,
                        borderRadius: 8,
                        marginTop: 20,
                        backgroundColor: colors.actionText,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            fontSize: 18,
                            color: colors.textBright,
                            fontFamily: fonts.bold,
                        }}>
                        Invite
                    </Text>
                </TouchableOpacity>
            )}
            {pending && (
                <View style={{marginStart: 40, marginEnd: 40, marginTop: 30}}>
                    <ActivityIndicator size="small" />
                </View>
            )}
            <RNAnimated.FlatList
                onScroll={onScroll}
                data={userList}
                renderItem={renderUser}
            />
        </View>
    );
}
