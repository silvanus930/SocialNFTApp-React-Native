import React, {
    useRef,
    useContext,
    useCallback,
    useState,
    useEffect,
} from 'react';
import _ from 'lodash';
import FloatingHeader from 'components/FloatingHeader';
import fonts from 'resources/fonts';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';
import getResizedImageUrl from 'utils/media/resize';
import colors from 'resources/colors';
import {GlobalStateContext} from 'state/GlobalState';
import {CommunityStateContext} from 'state/CommunityState';
import {
    Text,
    View,
    TouchableOpacity,
    Animated as RNAnimated,
    ScrollView,
    TextInput,
    FlatList,
    Alert,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import {clog, cwarn} from 'utils/log';
import images from 'resources/images';
import {InviteModalStateRefContext} from 'state/InviteModalStateRef';
import {PersonaStateContext} from 'state/PersonaState';
import Accordion from 'react-native-collapsible/Accordion';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import UserBubble from 'components/UserBubble';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import {determineUserRights, determineLowestTier} from 'utils/helpers';

import {getServerTimestamp} from 'actions/constants';
import {DiscussionEngineDispatchContext} from './DiscussionEngineContext';

import {
    buildLink,
    addWeeks,
    shareLink,
    copyLinkToClipboard,
    revokeInviteCode,
    updateUserInviteCode,
    createUserInviteCode,
    checkForUserInviteCode,
} from 'actions/invite';

const INVITE_PUBLIC_LINK_BUTTON_LABEL = 'Invite via link';
const INVITE_VIA_LINK_SHARE_LINK_INVITE_MESSAGE =
    'Anyone who has the link can join this channel';
const CHANGE_ROLE_LABEL = 'Change role';
const INVITE_LINK_COPY_ITEM_LABEL = 'Copy link';
const LINK_COPIED_MESSAGE = 'Link copied';
const INVITE_LINK_RESET_ITEM_LABEL = 'Reset invitations';
const FAILED_TO_GENARATE_CODE_MESSAGE = 'Failed to genarate invitation code';
const FAILED_TO_GENARATE_LINK_MESSAGE =
    'Failed to genarate the invitation link';
const FAILED_TO_REVOKE_CODE_MESSAGE =
    'Failed to reset codes and links, please try again!';
const FAILED_TO_SHARE_LINK_ERROR_MESSAGE = 'Failed to open share model';
const NUMBER_OF_WEEKS_FOR_EXPIRATION = 2;

export default function InviteScreen({
    // renderFloatingHeader = false,
    showHeader = true,
    authors,
    persona,
    navigation,
    HeaderComponent = null,
}) {
    // console.log('rendering InviteScreen');

    const dispatch = useContext(DiscussionEngineDispatchContext);

    const profileModalStateRefContext = React.useContext(
        ProfileModalStateRefContext,
    );

    const inviteModalStateRefContext = React.useContext(
        InviteModalStateRefContext,
    );

    const communityContext = React.useContext(CommunityStateContext);
    const currentCommunity = communityContext.currentCommunity;
    let communityMap = communityContext?.communityMap;
    let communityID = communityContext.currentCommunity;
    let personaKey;
    let personaContext;
    personaContext = React.useContext(PersonaStateContext);
    personaKey = personaContext?.persona?.pid;

    const usePersona = inviteModalStateRefContext?.current?.usePersona;

    const personaCommunity =
        usePersona && personaContext?.persona?.pid
            ? personaContext?.persona
            : persona; // persona value coming through is catchall for communities & personas

    let isAuthor = authors?.includes(auth().currentUser.uid);
    const animatedOffset = useRef(new RNAnimated.Value(0)).current;
    const {userMap, personaMap, user} = useContext(GlobalStateContext);

    const [rolesData, setRolesData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [rolesDescriptions, setRolesDescriptions] = useState({});

    let hasInviteAuth;
    let lowestUserTier;

    // Get roles data
    useEffect(async () => {
        hasInviteAuth = determineUserRights(
            communityID,
            personaKey,
            user,
            'invite',
        );
        lowestUserTier = determineLowestTier(communityID, personaKey, user);

        // roles
        const rolePath = firestore()
            .collection('communities')
            .doc(currentCommunity)
            .collection('roles')
            .doc('each')
            .collection('role');

        await rolePath
            .orderBy('price', 'desc')
            .get()
            .then(docSnap => {
                let roles = [];
                docSnap.forEach(doc => {
                    if (hasInviteAuth && doc.data().tier >= lowestUserTier) {
                        roles.push({
                            ...doc.data(),
                        });
                    }
                });
                roles.sort((a, b) => a.tier - b.tier);
                setRolesData(roles);
            });

        // description of roles
        await firestore()
            .collection('roles')
            .doc('rights')
            .get()
            .then(doc => {
                setRolesDescriptions(doc.data().description);
            });
    }, []);

    const InviteSteps = {
        Role: 'role',
        SelectContacts: 'selectContacts',
        PhoneEmail: 'phoneEmail',
        InviteViaLink: 'inviteViaLink',
    };
    const [currentStep, setCurrentStep] = useState(InviteSteps.Role);
    const [inviteLink, setInviteLink] = useState('');
    const [inviteLinkCodeId, setInviteLinkCodeId] = useState('');

    const [activeSections, setActiveSections] = useState([]);
    const updateSections = as => {
        setActiveSections(as);
        // reset the link and code in case role changed
        setInviteLink('');
        setInviteLinkCodeId('');
    };

    const onPressChangeRole = () => {
        setCurrentStep(InviteSteps.Role);
    };

    const onPressProceed = () => {
        switch (currentStep) {
            case InviteSteps.Role:
                setCurrentStep(InviteSteps.SelectContacts);
                break;
            case InviteSteps.SelectContacts:
                setCurrentStep(InviteSteps.PhoneEmail);
                break;
            case InviteSteps.PhoneEmail:
                setCurrentStep(InviteSteps.SelectContacts);
                break;
        }
    };

    const onPressInviteViaLink = async selectedRole => {
        // show loading indicator while genarating the code & link
        setIsLoading(true);
        if (!inviteLink) {
            const link = await generateInviteLink(selectedRole);
            if (link) {
                setInviteLink(link);
            } else {
                setIsLoading(false);
                return;
            }
        }
        setIsLoading(false);
        setCurrentStep(InviteSteps.InviteViaLink);
    };

    const generateInviteLink = async selectedRole => {
        try {
            // Destination array logic should be centralized for all invitation methods
            let inviteDestination = {};
            if (personaKey) {
                inviteDestination = {
                    type: 'project',
                    name: personaContext?.persona?.name,
                    id: personaContext?.persona?.pid,
                    ref: firestore()
                        .collection('personas')
                        .doc(personaContext?.persona?.pid).path,
                };
            } else {
                inviteDestination = {
                    type: 'community',
                    name: communityMap[currentCommunity]?.name,
                    id: currentCommunity,
                    ref: firestore()
                        .collection('communities')
                        .doc(currentCommunity).path,
                };
            }
            inviteDestination.role = selectedRole;
            let linkCodeObject = {
                destinations: [inviteDestination],
                usedBy: [],
                createdBy: auth().currentUser.uid,
                isValid: true,
                expiryDate: addWeeks(new Date(), NUMBER_OF_WEEKS_FOR_EXPIRATION)
                    .toISOString()
                    .split('T')[0],
                personaId: personaKey ? personaKey : '',
                communityId: currentCommunity,
            };

            let code = '';
            //Check if the user has invite code that is valid for use
            let userCode = await checkForUserInviteCode(
                linkCodeObject.createdBy,
                linkCodeObject.personaId,
                linkCodeObject.communityId,
            );
            // in case user does not have valid code genarate new code and add the full info
            if (!userCode) {
                //genarate new code for the user
                code = await createUserInviteCode(linkCodeObject);
                console.log(`code:${code}`);
                setInviteLinkCodeId(code);
            } else {
                // in case the user has valid one that match the required info
                // then update the expiration date
                code = userCode.id;
                updateUserInviteCode(userCode.id, {
                    expiryDate: addWeeks(
                        new Date(),
                        NUMBER_OF_WEEKS_FOR_EXPIRATION,
                    )
                        .toISOString()
                        .split('T')[0],
                });
                setInviteLinkCodeId(code);
            }
            // pass the code for url genaration
            if (code) {
                const link = await buildLink(code);
                return link;
            } // In case code couldn't be genarated
            else {
                Alert.alert(FAILED_TO_GENARATE_CODE_MESSAGE);
                return null;
            }
        } catch (error) {
            console.log(error);
            Alert.alert(FAILED_TO_GENARATE_LINK_MESSAGE);
            return null;
        }
    };

    const revokeInviteLinkAndCode = async selectedRole => {
        console.log('revokeInviteLinkAndCode');
        try {
            // revoke the old code so it will not be useable for regitartion and login
            // revoke will set valid field to false
            // reset link & code
            if (inviteLinkCodeId) {
                await revokeInviteCode(inviteLinkCodeId);
                setInviteLink('');
                setInviteLinkCodeId('');
            }
            //create new code and Link
            const newLink = await generateInviteLink(selectedRole);
            if (newLink) {
                console.log(newLink);
                setInviteLink(newLink);
            }
        } catch (error) {
            console.log(error);
            Alert.alert(FAILED_TO_REVOKE_CODE_MESSAGE);
        }
    };

    let inviteMessage;
    if (personaContext?.persona?.name) {
        inviteMessage =
            "Hi 👋, join the '" +
            personaContext.persona.name +
            "' channel of '" +
            communityMap[currentCommunity]?.name +
            "' on Persona.";
    } else {
        inviteMessage =
            "Hi 👋, join the '" +
            communityMap[currentCommunity]?.name +
            "' community on Persona.";
    }

    return React.useMemo(
        () => (
            <>
                {currentStep === InviteSteps.Role && (
                    <SelectRole
                        data={rolesData}
                        isLoading={isLoading}
                        rolesDescriptions={rolesDescriptions}
                        activeSections={activeSections}
                        updateSections={updateSections}
                        onPressProceed={onPressProceed}
                        onPressInviteViaLink={onPressInviteViaLink}
                        persona={personaCommunity}
                        userMap={userMap}
                    />
                )}
                {currentStep === InviteSteps.SelectContacts && (
                    <InviteExistingUsers
                        data={rolesData}
                        activeSections={activeSections}
                        onPressChangeRole={onPressChangeRole}
                        userMap={userMap}
                        persona={persona}
                        personaMap={personaMap}
                        onPressProceed={onPressProceed}
                        inviteMessage={inviteMessage}
                    />
                )}
                {currentStep === InviteSteps.PhoneEmail && (
                    <InvitePhoneEmail
                        data={rolesData}
                        activeSections={activeSections}
                        onPressChangeRole={onPressChangeRole}
                        userMap={userMap}
                        persona={persona}
                        personaMap={personaMap}
                        onPressProceed={onPressProceed}
                        inviteMessage={inviteMessage}
                        dispatch={dispatch}
                    />
                )}
                {currentStep === InviteSteps.InviteViaLink && (
                    <InviteViaLink
                        data={rolesData}
                        activeSections={activeSections}
                        onPressChangeRole={onPressChangeRole}
                        revokeInviteLinkAndCode={revokeInviteLinkAndCode}
                        userMap={userMap}
                        persona={persona}
                        inviteLink={inviteLink}
                        personaMap={personaMap}
                        onPressProceed={onPressProceed}
                        inviteMessage={inviteMessage}
                        dispatch={dispatch}
                    />
                )}
            </>
        ),
        [
            currentStep,
            activeSections,
            updateSections,
            onPressProceed,
            rolesData,
            rolesDescriptions,
            dispatch,
        ],
    );
}

const SelectRole = ({
    data,
    activeSections,
    updateSections,
    persona,
    onPressProceed,
    onPressInviteViaLink,
    isLoading,
    userMap,
    rolesDescriptions,
}) => {
    const [isLoadingIndicator, setIsLoadingIndicator] = useState(isLoading);
    useEffect(() => {
        setIsLoadingIndicator(isLoading);
    }, [isLoading]);

    const selectedRole = data[activeSections[0]];
    const proceedBtnText =
        activeSections.length > 0
            ? 'Proceed to invite ' + selectedRole.title + 's'
            : 'Select a role to proceed';

    const renderSectionTitle = section => {
        return (
            <View style={{}}>
                <Text style={{fontSize: 24, color: '#ccc'}}>
                    {section?.title[0]?.toUpperCase() +
                        section?.title?.slice(1)}
                </Text>
            </View>
        );
    };

    const renderHeader = (section, index) => {
        let priceText =
            section?.price === 0 ? 'Free!' : '$' + section?.price + '/user';
        return (
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: 4,
                    marginBottom: activeSections.includes(index) ? 0 : 10,
                }}>
                <View style={{padding: 5}}>
                    {activeSections.includes(index) ? (
                        <MaterialCommunityIcons
                            name="circle-slice-8"
                            size={20}
                            color={colors.navSubProminent}
                            style={{marginLeft: 0}}
                        />
                    ) : (
                        <MaterialCommunityIcons
                            name="circle-outline"
                            size={20}
                            color={colors.navSubProminent}
                            style={{marginLeft: 0}}
                        />
                    )}
                </View>
                <View
                    style={{
                        marginLeft: 5,
                        padding: 3,
                        paddingLeft: 20,
                        paddingRight: 20,
                        borderRadius: 30,
                        backgroundColor: '#BFE0D4',
                    }}>
                    <Text style={{fontSize: 18, color: '#193A30'}}>
                        {section?.title[0].toUpperCase() +
                            section?.title.slice(1)}
                    </Text>
                </View>
                <View style={{padding: 4, marginLeft: 8}}>
                    <Text style={{fontSize: 16, color: '#fff'}}>
                        {priceText}
                    </Text>
                </View>
                <View style={{marginLeft: 'auto', paddingRight: 15}}>
                    {activeSections.includes(index) ? (
                        <MaterialCommunityIcons
                            name="chevron-up"
                            size={26}
                            color={colors.navSubProminent}
                            style={{marginLeft: 0}}
                        />
                    ) : (
                        <MaterialCommunityIcons
                            name="chevron-down"
                            size={26}
                            color={colors.navSubProminent}
                            style={{marginLeft: 0}}
                        />
                    )}
                </View>
            </View>
        );
    };

    const renderContent = section => {
        let description = [];
        // first true values
        Object.keys(section.rights).forEach(key => {
            if (section.rights[key]) {
                description.push(
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            padding: 2,
                        }}>
                        <MaterialCommunityIcons
                            name="check"
                            size={18}
                            color={colors.success}
                            style={{marginRight: 5}}
                        />
                        <Text style={{fontSize: 14, color: '#AAAEB2'}}>
                            {rolesDescriptions[key]}
                        </Text>
                    </View>,
                );
            }
        });

        // next false values
        Object.keys(section.rights).forEach(key => {
            // first true values
            if (!section.rights[key]) {
                description.push(
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            padding: 2,
                        }}>
                        <MaterialCommunityIcons
                            name="close"
                            size={18}
                            color={colors.fadedRed}
                            style={{marginRight: 5}}
                        />
                        <Text style={{fontSize: 14, color: '#AAAEB2'}}>
                            {rolesDescriptions[key]}
                        </Text>
                    </View>,
                );
            }
        });

        return (
            <>
                <View style={{padding: 10}}>{description}</View>
            </>
        );
    };

    return (
        <>
            <Header userMap={userMap} showHeader={true} persona={persona} />
            <ScrollView
                style={{borderWidth: 0, borderColor: 'red'}}
                contentContainerStyle={{paddingBottom: 54}}>
                <View style={{padding: 10, marginTop: -10, marginBottom: 10}}>
                    <Text
                        style={{
                            fontSize: 18,
                            color: '#D0D3D6',
                            fontWeight: 500,
                        }}>
                        Choose a user role to invite
                    </Text>
                </View>
                <Accordion
                    sections={data}
                    // renderSectionTitle={renderSectionTitle}
                    renderHeader={renderHeader}
                    renderContent={renderContent}
                    activeSections={activeSections}
                    onChange={updateSections}
                />
                <View
                    style={{
                        padding: 20,
                        marginTop: 10,
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    <Text style={{color: '#AAAEB2', fontSize: 16}}>
                        Want to add a new/custom role?
                    </Text>
                    <View
                        style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 7,
                            borderRadius: 6,
                            borderWidth: 0.5,
                            borderColor: '#868B8F',
                            marginLeft: 'auto',
                        }}>
                        <Text style={{color: '#fff', fontSize: 12}}>
                            Coming Soon
                        </Text>
                    </View>
                </View>
                <View
                    style={{
                        alignItems: 'center',
                    }}>
                    <View
                        style={{
                            padding: 8,
                            borderRadius: 4,
                            backgroundColor: '#231C14',
                            width: '90%',
                            borderColor: '#3A2D1A',
                            borderWidth: 0.5,
                            display: 'flex',
                            flexDirection: 'row',
                            marginTop: 10,
                            marginBottom: 90,
                        }}>
                        <MaterialCommunityIcons
                            name="information-outline"
                            size={20}
                            color={'#D0BD9F'}
                            style={{marginRight: 5}}
                        />
                        <Text
                            style={{
                                color: '#D0BD9F',
                                fontSize: 14,
                                width: '90%',
                            }}>
                            Please ensure that you select the right invite type
                            before inviting users to a commmunity
                        </Text>
                    </View>
                </View>
            </ScrollView>
            <View
                style={{
                    position: 'absolute',
                    bottom: 60,
                    alignItems: 'center',
                    width: '100%',
                }}>
                <TouchableOpacity
                    onPress={activeSections.length > 0 ? onPressProceed : null}>
                    <View
                        style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor:
                                activeSections.length > 0
                                    ? colors.personaBlue
                                    : colors.personaDarkBlue,
                            width: 335,
                            height: 44,
                            marginTop: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Text
                            style={{
                                textAlign: 'center',
                                color:
                                    activeSections.length > 0
                                        ? '#fff'
                                        : colors.personaBlue,
                                fontSize: 16,
                                fontWeight: 500,
                                width: '90%',
                            }}>
                            {proceedBtnText}
                        </Text>
                    </View>
                </TouchableOpacity>

                {activeSections.length > 0 && (
                    <TouchableOpacity
                        onPress={() => {
                            onPressInviteViaLink(selectedRole);
                        }}>
                        <View
                            style={{
                                padding: 8,
                                borderRadius: 8,
                                backgroundColor: colors.personaBlue,
                                width: 335,
                                height: 44,
                                marginTop: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flex: 1,
                                    width: '90%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                {isLoadingIndicator && (
                                    <ActivityIndicator
                                        animating={isLoadingIndicator}
                                        size="small"
                                        color="white"
                                    />
                                )}
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#fff',
                                        fontSize: 16,
                                        marginLeft: 10,
                                        fontWeight: 500,
                                    }}>
                                    {INVITE_PUBLIC_LINK_BUTTON_LABEL}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
};

const InviteExistingUsers = ({
    data,
    activeSections,
    onPressChangeRole,
    userMap,
    persona,
    personaMap,
    onPressProceed,
    inviteMessage,
}) => {
    const personaProfileSize = 40;
    const imageUrl = persona?.profileImgUrl;
    let numMembers = persona?.members?.filter(
        key => userMap[key]?.human,
    ).length;

    const InviteStateContext = React.useContext(InviteModalStateRefContext);
    const communityContext = React.useContext(CommunityStateContext);
    const currentCommunity = communityContext.currentCommunity;
    let communityMap = communityContext?.communityMap;
    let communityID = communityContext.currentCommunity;
    let personaKey;
    let personaContext;
    personaContext = React.useContext(PersonaStateContext);
    personaKey = personaContext?.persona?.pid;

    const [selectedUsers, setSelectedUsers] = React.useState([]);
    const [invitedUsers, setInvitedUsers] = React.useState(null);

    let userList = Object.keys(userMap).filter(key => userMap[key].human);
    userList = userList.sort((a, b) =>
        userMap[a].userName.localeCompare(userMap[b].userName),
    );

    const selectedRole = data[activeSections[0]];

    React.useEffect(() => {
        const entityID = personaKey || communityID;

        return firestore()
            .collection('invites')
            .where('destination.id', '==', entityID)
            .where('accepted', '==', false)
            .where('deleted', '==', false)
            .onSnapshot(querySnapshot => {
                let _invitedUsers = [];
                if (querySnapshot.docs.length > 0) {

                    querySnapshot.forEach((doc) => {
                        if(doc.data().declined != true) {
                            _invitedUsers.push(doc.data().invitedUserID);
                        }
                    })

                    setInvitedUsers(_invitedUsers);
                }
            });
    }, [communityID, personaKey]);

    const [searchText, setSearchText] = React.useState('');

    const renderUser = React.useCallback(
        ({item}) => {
            let csize = 24;
            let isMember =
                personaMap &&
                personaKey &&
                personaMap[personaKey] &&
                personaMap[personaKey]?.authors
                    ? personaMap[personaKey]?.userRoles?.[
                          selectedRole.title
                      ]?.includes(item)
                    : communityMap[currentCommunity]?.userRoles?.[
                          selectedRole.title
                      ]?.includes(item);

            const isAlreadyInvited = invitedUsers?.includes(item);

            const toggleSelectUser = async () => {
                if (!isMember && !isAlreadyInvited) {
                    // trigger invite send
                    const inviteData = {
                        createdAt: getServerTimestamp(),
                        invitedByUserID: auth().currentUser.uid,
                        invitedUserID: item,
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

                    inviteData.destination.role = selectedRole;
                    await firestore().collection('invites').add(inviteData);
                }
            };

            return (
                <TouchableOpacity
                    style={
                        {
                            // backgroundColor: '#111314'
                        }
                    }
                    disabled={isMember}
                    onPress={toggleSelectUser}>
                    <View
                        style={{
                            borderColor: colors.seperatorLineColor,
                            borderBottomWidth: 0.5,
                            padding: 8,
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            flexDirection: 'row',
                            flex: 1,
                        }}>
                        <UserBubble
                            bubbleSize={40}
                            showName={false}
                            user={userMap[item]}
                        />

                        <Text style={{color: '#AAAEB2', fontSize: 16}}>
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
                                        borderRadius: 6,
                                        width: 80,
                                        height: 38,
                                        borderWidth: 0.5,
                                        borderColor: '#868B8F',
                                        backgroundColor:
                                            'rgb(255,255,255,0.06)',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: 5,
                                    }}>
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 500,
                                            color: '#fff',
                                        }}>
                                        + Invite
                                    </Text>
                                </View>
                            ) : (
                                <View
                                    style={{
                                        borderRadius: 6,
                                        width: 80,
                                        height: 38,
                                        backgroundColor: '#12231E',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: 5,
                                        display: 'flex',
                                        flexDirection: 'row',
                                    }}>
                                    <MaterialCommunityIcons
                                        name="check"
                                        size={20}
                                        color={colors.navSubProminent}
                                        style={{marginRight: 3}}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 500,
                                            color: '#9FD0BF',
                                        }}>
                                        Sent
                                    </Text>
                                </View>
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

    return (
        <>
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10,
                }}>
                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        backgroundColor: '#E0D3BF',
                        borderRadius: 100,
                        height: 44,
                        width: 260,
                        padding: 10,
                        paddingLeft: 15,
                    }}>
                    <Text
                        style={{
                            fontSize: 20,
                            marginTop: -1,
                        }}>
                        {selectedRole.title[0].toUpperCase() +
                            selectedRole.title.slice(1)}
                    </Text>
                    <TouchableOpacity onPress={onPressChangeRole}>
                        <Text
                            style={{
                                fontSize: 18,
                                textDecorationLine: 'underline',
                                marginLeft: 10,
                            }}>
                            Change role
                        </Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                        backgroundColor: '#1B1D1F',
                        borderRadius: 10,
                        width: 360,
                        marginTop: 5,
                    }}>
                    <Text
                        style={{
                            color: '#AAAEB2',
                            fontSize: 16,
                        }}>
                        {inviteMessage}
                    </Text>
                </View>

                <TextInput
                    multiline={false}
                    style={{
                        borderRadius: 8,
                        backgroundColor: '#292C2E',
                        color: '#D0D3D6',
                        padding: 10,
                        paddingLeft: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        marginTop: 10,
                        borderWidth: 0.5,
                        borderColor: '#5F6266',
                        width: '90%',
                    }}
                    placeholder={'Search all users by name'}
                    color={colors.textBright}
                    placeholderTextColor="#D0D3D6"
                    value={searchText}
                    onChangeText={setSearchText}
                />

                <View
                    style={{
                        borderWidth: 0,
                        borderColor: 'orange',
                        marginTop: 20,
                        marginBottom: 20,
                        height: 350,
                        width: '100%',
                    }}>
                    <FlatList
                        bounces={true}
                        ListFooterComponent={
                            <View
                                style={{
                                    height: 50,
                                }}
                            />
                        }
                        style={{
                            padding: 10,
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
            <View
                style={{
                    position: 'absolute',
                    bottom: 60,
                    alignItems: 'center',
                    width: '100%',
                }}>
                <TouchableOpacity onPress={onPressProceed}>
                    <View
                        style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: colors.personaBlue,
                            width: 335,
                            height: 44,
                            marginTop: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Text
                            style={{
                                textAlign: 'center',
                                color: '#fff',
                                fontSize: 16,
                                fontWeight: 500,
                                width: '90%',
                            }}>
                            Invite by phone number/email
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </>
    );
};

const InvitePhoneEmail = ({
    data,
    activeSections,
    onPressChangeRole,
    userMap,
    persona,
    personaMap,
    onPressProceed,
    inviteMessage,
    dispatch,
}) => {
    const [emailPhoneToInvite, setEmailPhoneToInvite] = React.useState('');
    const [countryCode, setCountryCode] = React.useState('1');
    const [showPhoneInput, setShowPhoneInput] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    const [invitedUsers, setInvitedUsers] = React.useState(null);

    const InviteStateContext = React.useContext(InviteModalStateRefContext);
    const communityContext = React.useContext(CommunityStateContext);
    const currentCommunity = communityContext.currentCommunity;
    let communityMap = communityContext?.communityMap;
    let communityID = communityContext.currentCommunity;
    let personaKey;
    let personaContext;
    personaContext = React.useContext(PersonaStateContext);
    personaKey = personaContext?.persona?.pid;

    let selectedRole = data[activeSections[0]];

    const inviteBtnText = pending ? (
        <ActivityIndicator size="small" color={'#fff'} />
    ) : emailPhoneToInvite ? (
        'Send Invite'
    ) : (
        'Add phone/email to invite'
    );

    const updateInputs = val => {
        let value = val.trim().replace(/\s/g, '');
        setEmailPhoneToInvite(value);

        if (/^\d{3}/.test(val)) {
            setEmailPhoneToInvite(value.replace(/\D/g, ''));
            setShowPhoneInput(true);
        } else if (value[0] === '+' && value?.length === 1) {
            setEmailPhoneToInvite('');
            countryCodeRef.current.focus();
            setShowPhoneInput(true);
        } else if (value[0] === '+' && value?.length > 1) {
            // assume that user likely pasted a phone number from contacts
            const pastedPhone = val.split(' '); //use val here not value
            const strippedCountryCode = pastedPhone[0].replace(/\+/g, '');
            setCountryCode(strippedCountryCode);
            setEmailPhoneToInvite(
                value.replace(pastedPhone[0], '').replace(/\D/g, ''),
            );
            setShowPhoneInput(true);
        } else if (value[0] === '(') {
            setEmailPhoneToInvite('');
            setShowPhoneInput(true);
        } else if (
            /\(\d{3}\)\d{3}-\d{4}/.test(value) ||
            /\d{3}-\d{3}-\d{4}/.test(value)
        ) {
            setEmailPhoneToInvite(value.replace(/\D/g, ''));
            setShowPhoneInput(true);
        } else if (showPhoneInput && value.length > 0 && !/\d/.test(value[0])) {
            setShowPhoneInput(false);
        }

        if (value.includes('@')) {
            setShowPhoneInput(false);
        }
    };

    const handleInvite = async () => {
        if (!emailPhoneToInvite) {
            Alert.alert('An email address or phone number is required.');
            return;
        }

        if (invitedUsers?.includes(emailPhoneToInvite.toLowerCase())) {
            Alert.alert('This user has already been invited.');
            return;
        }

        // Phone flow
        if (showPhoneInput) {
            let phoneNumber = '+' + countryCode + emailPhoneToInvite;

            if (/[^$,\.\d]/.test(phoneNumber.replace('+', ''))) {
                Alert.alert('Invalid phone number');
                return;
            }

            try {
                setPending(true);
                let inviteNewUserByPhone = functions().httpsCallable(
                    'inviteNewUserByPhone',
                );

                let inviteDestination = {};

                if (personaKey) {
                    inviteDestination = {
                        type: 'project',
                        name: personaContext?.persona?.name,
                        id: personaContext?.persona?.pid,
                        ref: firestore()
                            .collection('personas')
                            .doc(personaContext?.persona?.pid).path, // trouble sending ref as a value here
                    };
                } else {
                    inviteDestination = {
                        type: 'community',
                        name: communityMap[currentCommunity]?.name,
                        id: currentCommunity,
                        ref: firestore()
                            .collection('communities')
                            .doc(currentCommunity).path, // trouble sending ref as a value here
                    };
                }

                inviteDestination.role = selectedRole;

                const response = await inviteNewUserByPhone({
                    invitedByUserID: auth().currentUser.uid,
                    phoneNumber: phoneNumber,
                    destination: {...inviteDestination},
                });

                const {result, code} = response.data;

                switch (result) {
                    case 'success':
                        // add user to invited list
                        let newInvited;
                        if (invitedUsers) {
                            newInvited = new Set([
                                ...invitedUsers,
                                phoneNumber,
                            ]);
                        } else {
                            newInvited = [phoneNumber];
                        }
                        setInvitedUsers([...newInvited]);
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
                                Alert.alert(
                                    'This user has already been invited.',
                                );
                                break;
                            default:
                                Alert.alert(`Something went wrong: ${code}`);
                                break;
                        }
                        break;
                }
            } catch (err) {
                Alert.alert('Something went wrong - please try again');
                // console.log('catch', err);
            }

            setPending(false);
        }

        // Email flow
        else {
            setPending(true);

            // Regular expression pattern to match an email address
            let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // Test the email address against the pattern
            if (!emailRegex.test(emailPhoneToInvite.toLowerCase())) {
                Alert.alert(
                    'Please enter a valid email address or phone number.',
                );
                setPending(false);
                dispatch({type: 'toggleKeyboardOff'});
                return;
            }

            // Invite user now via email
            try {
                let inviteNewUserByEmail = functions().httpsCallable(
                    'inviteNewUserByEmail',
                );

                let inviteDestination = {};

                if (personaKey) {
                    inviteDestination = {
                        type: 'project',
                        name: personaContext?.persona?.name,
                        id: personaContext?.persona?.pid,
                        ref: firestore()
                            .collection('personas')
                            .doc(personaContext?.persona?.pid).path, // trouble sending ref as a value here...
                    };
                } else {
                    inviteDestination = {
                        type: 'community',
                        name: communityMap[currentCommunity]?.name, // trouble sending ref as a value here...
                        id: currentCommunity,
                        ref: firestore()
                            .collection('communities')
                            .doc(currentCommunity).path,
                    };
                }

                inviteDestination.role = selectedRole;

                const response = await inviteNewUserByEmail({
                    email: emailPhoneToInvite.toLowerCase(),
                    invitedByUserID: auth().currentUser.uid,
                    destination: {...inviteDestination},
                    message: inviteMessage,
                });

                const {result, code} = response.data;

                switch (result) {
                    case 'success':
                        // add user to invited list
                        let newInvited;
                        if (invitedUsers) {
                            newInvited = new Set([
                                ...invitedUsers,
                                emailPhoneToInvite.toLowerCase(),
                            ]);
                        } else {
                            newInvited = [emailPhoneToInvite.toLowerCase()];
                        }

                        Alert.alert(
                            `An email invitation has been sent to ${emailPhoneToInvite.toLowerCase()}!`,
                        );

                        setInvitedUsers([...newInvited]);
                        break;
                    case 'error':
                        switch (code) {
                            case 'account-exists':
                                Alert.alert(
                                    'This email already has an account!',
                                );
                                break;
                            default:
                                Alert.alert(`Something went wrong: ${code}`);
                                break;
                        }
                        break;
                }

                setPending(false);
            } catch (e) {
                Alert.alert('error: ' + e);
                setPending(false);
                return;
            } finally {
                dispatch({type: 'toggleKeyboardOff'});
                setPending(false);
                return;
            }
        }
    };

    const renderUser = React.useCallback(
        ({item}) => {
            return (
                <View
                    style={{
                        borderColor: colors.seperatorLineColor,
                        borderBottomWidth: 0.5,
                        padding: 8,
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        flexDirection: 'row',
                        flex: 1,
                    }}>
                    <Text style={{color: '#AAAEB2', fontSize: 16}}>{item}</Text>
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row-reverse',
                            justifyContent: 'flex-start',
                        }}>
                        <View
                            style={{
                                borderRadius: 6,
                                width: 80,
                                height: 38,
                                backgroundColor: '#12231E',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 5,
                                display: 'flex',
                                flexDirection: 'row',
                            }}>
                            <MaterialCommunityIcons
                                name="check"
                                size={20}
                                color={colors.navSubProminent}
                                style={{marginRight: 3}}
                            />
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: 500,
                                    color: '#9FD0BF',
                                }}>
                                Sent
                            </Text>
                        </View>
                    </View>
                </View>
            );
        },
        [personaMap, personaKey, communityMap, invitedUsers],
    );

    const countryCodeRef = useRef();

    return (
        <>
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10,
                }}>
                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        backgroundColor: '#E0D3BF',
                        borderRadius: 100,
                        height: 44,
                        width: 260,
                        padding: 10,
                        paddingLeft: 15,
                    }}>
                    <Text
                        style={{
                            fontSize: 20,
                            marginTop: -1,
                        }}>
                        {selectedRole.title[0].toUpperCase() +
                            selectedRole.title.slice(1)}
                    </Text>
                    <TouchableOpacity onPress={onPressChangeRole}>
                        <Text
                            style={{
                                fontSize: 18,
                                textDecorationLine: 'underline',
                                marginLeft: 10,
                            }}>
                            Change role
                        </Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                        backgroundColor: '#1B1D1F',
                        borderRadius: 10,
                        width: 360,
                        marginTop: 5,
                    }}>
                    <Text
                        style={{
                            color: '#AAAEB2',
                            fontSize: 16,
                        }}>
                        {inviteMessage}
                    </Text>
                </View>

                <View
                    style={{
                        width: '90%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginTop: 20,
                    }}>
                    <Text
                        style={{
                            textAlign: 'left',
                            fontSize: 16,
                            color: '#D0D3D6',
                        }}>
                        Email/phone
                    </Text>
                </View>
                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '90%',
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 75,
                            display: showPhoneInput ? 'flex' : 'none',
                        }}>
                        <Text
                            style={{
                                fontSize: 20,
                                marginRight: -27,
                                width: 27,
                                paddingLeft: 5,
                                zIndex: 10,
                                elevation: 10,
                                color: '#D0D3D6',
                                marginTop: 6,
                                borderWidth: 0,
                                borderColor: 'white',
                            }}>
                            +
                        </Text>
                        <TextInput
                            textContentType="telephoneNumber"
                            keyboardType="phone-pad"
                            defaultValue={countryCode.toString()}
                            maxLength={3}
                            value={countryCode.toString()}
                            ref={countryCodeRef}
                            style={{
                                borderRadius: 8,
                                backgroundColor: '#292C2E',
                                color: '#D0D3D6',
                                padding: 10,
                                paddingLeft: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 18,
                                marginTop: 10,
                                borderWidth: 0.5,
                                borderColor: '#5F6266',
                                marginRight: 5,
                                flex: 1,
                            }}
                            onChangeText={setCountryCode}
                        />
                    </View>
                    <TextInput
                        multiline={false}
                        style={{
                            flex: 1,
                            borderRadius: 8,
                            backgroundColor: '#292C2E',
                            color: '#D0D3D6',
                            padding: 10,
                            paddingLeft: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 17,
                            marginTop: 10,
                            borderWidth: 0.5,
                            borderColor: '#5F6266',
                        }}
                        placeholder={'Enter an email or phone number'}
                        color={colors.textBright}
                        placeholderTextColor="#AAAEB2"
                        value={emailPhoneToInvite}
                        onChangeText={updateInputs}
                    />
                </View>
            </View>

            <View
                style={{
                    marginTop: 5,
                    alignItems: 'center',
                    width: '100%',
                }}>
                <TouchableOpacity
                    onPress={emailPhoneToInvite ? handleInvite : null}>
                    <View
                        style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: emailPhoneToInvite
                                ? colors.personaBlue
                                : colors.personaDarkBlue,
                            width: 350,
                            height: 44,
                            marginTop: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Text
                            style={{
                                textAlign: 'center',
                                color: emailPhoneToInvite
                                    ? '#fff'
                                    : colors.personaBlue,
                                fontSize: 16,
                                fontWeight: 500,
                                // width: '90%'
                            }}>
                            {inviteBtnText}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
            <View
                style={{
                    alignItems: 'center',
                }}>
                <View
                    style={{
                        padding: 8,
                        borderRadius: 4,
                        backgroundColor: '#231C14',
                        width: '90%',
                        borderColor: '#3A2D1A',
                        borderWidth: 0.5,
                        display: 'flex',
                        flexDirection: 'row',
                        marginTop: 20,
                    }}>
                    <MaterialCommunityIcons
                        name="information-outline"
                        size={20}
                        color={'#D0BD9F'}
                        style={{marginRight: 5}}
                    />
                    <Text
                        style={{color: '#D0BD9F', fontSize: 14, width: '90%'}}>
                        This email/phone number will be used to share an
                        invitation link with the invitee
                    </Text>
                </View>

                {invitedUsers && (
                    <>
                        <View
                            style={{
                                width: '90%',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                                marginTop: 20,
                            }}>
                            <Text
                                style={{
                                    textAlign: 'left',
                                    fontSize: 20,
                                    color: '#D0D3D6',
                                }}>
                                Invited via phone/email
                            </Text>
                        </View>
                        <View
                            style={{
                                borderWidth: 0,
                                borderColor: 'orange',
                                marginTop: 20,
                                marginBottom: 20,
                                height: 350,
                                width: '100%',
                            }}>
                            <FlatList
                                bounces={true}
                                ListFooterComponent={
                                    <View
                                        style={{
                                            height: 280,
                                        }}
                                    />
                                }
                                style={{
                                    padding: 10,
                                }}
                                data={invitedUsers}
                                renderItem={renderUser}
                            />
                        </View>
                    </>
                )}
            </View>
            <View
                style={{
                    position: 'absolute',
                    bottom: 60,
                    alignItems: 'center',
                    width: '100%',
                }}>
                <TouchableOpacity onPress={onPressProceed}>
                    <View
                        style={{
                            padding: 8,
                            borderRadius: 8,
                            // backgroundColor: 'rgb(17,19,20,0.06)',
                            backgroundColor: '#111314',
                            width: 335,
                            height: 44,
                            marginTop: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 0.5,
                            borderColor: '#AAAEB2',
                        }}>
                        <Text
                            style={{
                                textAlign: 'center',
                                color: '#fff',
                                fontSize: 16,
                                fontWeight: 500,
                                width: '90%',
                            }}>
                            Back to all friends
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </>
    );
};

const InviteViaLink = ({
    data,
    inviteLink,
    activeSections,
    onPressChangeRole,
    revokeInviteLinkAndCode,
    userMap,
    persona,
    personaMap,
    onPressProceed,
    inviteMessage,
    dispatch,
}) => {
    const selectedRole = data[activeSections[0]];

    const onLinkClick = useCallback(async () => {
        try {
            await shareLink(inviteLink);
        } catch (error) {
            console.log(error);
            Alert.alert(FAILED_TO_SHARE_LINK_ERROR_MESSAGE);
        }
    }, [inviteLink]);

    const onCopyClick = useCallback(() => {
        copyLinkToClipboard(inviteLink);
        Alert.alert(LINK_COPIED_MESSAGE);
    }, [inviteLink]);

    const onResetClick = () => {
        const selectedRole = data[activeSections[0]];
        revokeInviteLinkAndCode(selectedRole);
    };

    return (
        <>
            <View style={InviteViaLinkStyle.container}>
                <View style={InviteViaLinkStyle.role_view}>
                    <Text style={InviteViaLinkStyle.role_text}>
                        {selectedRole.title[0].toUpperCase() +
                            selectedRole.title.slice(1)}
                    </Text>
                    <TouchableOpacity onPress={onPressChangeRole}>
                        <Text style={InviteViaLinkStyle.change_role_label}>
                            {CHANGE_ROLE_LABEL}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={InviteViaLinkStyle.invite_title_message}>
                    <Text style={InviteViaLinkStyle.invite_title_message_text}>
                        {INVITE_VIA_LINK_SHARE_LINK_INVITE_MESSAGE}
                    </Text>
                </View>
                <ScrollView
                    style={InviteViaLinkStyle.scrollView}
                    contentContainerStyle={
                        InviteViaLinkStyle.scrollViewContentContainer
                    }>
                    <InviteLinkItem
                        label={inviteLink}
                        iconName={'link'}
                        iconColor={'#0000EE'}
                        iconSize={24}
                        textColor={'#0000EE'}
                        textSize={20}
                        isHeader={true}
                        onPress={onLinkClick}
                    />

                    <InviteLinkItem
                        label={INVITE_LINK_COPY_ITEM_LABEL}
                        iconName={'content-copy'}
                        onPress={onCopyClick}
                    />
                    <InviteLinkItem
                        label={INVITE_LINK_RESET_ITEM_LABEL}
                        iconName={'minus'}
                        onPress={onResetClick}
                    />
                </ScrollView>
            </View>
        </>
    );
};

const InviteLinkItem = ({
    isHeader,
    label,
    iconName,
    iconColor,
    iconSize,
    textColor,
    textSize,
    onPress,
}) => {
    return (
        <TouchableOpacity
            style={InviteViaLinkStyle.link_container}
            onPress={onPress ? onPress : () => {}}>
            <View
                style={[
                    InviteViaLinkStyle.item_common_view,
                    isHeader
                        ? InviteViaLinkStyle.link_item_view
                        : InviteViaLinkStyle.item_view,
                ]}>
                <MaterialCommunityIcons
                    name={iconName}
                    size={iconSize ? iconSize : 16}
                    color={iconColor ? iconColor : 'black'}
                />
            </View>
            <Text
                style={{
                    color: textColor ? textColor : 'white',
                    fontSize: textSize ? textSize : 18,
                }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

function Header({
    showHeader,
    persona,
    HeaderComponent,
    userMap,
    isAuthor,
    onPressAddMembers,
}) {
    const imageUrl = persona?.profileImgUrl;
    const personaProfileSize = 40;
    return (
        <>
            <View
                style={{
                    justifyContent: 'flex-start',
                    borderColor: 'orange',
                    borderWidth: 0,
                }}>
                {HeaderComponent}
                {Boolean(showHeader) && (
                    <>
                        <View
                            style={{
                                width: '100%',
                                zIndex: 9999999,
                                elevation: 9999998,
                            }}>
                            <FastImage
                                source={{
                                    uri: getResizedImageUrl({
                                        origUrl: imageUrl
                                            ? imageUrl
                                            : images.personaDefaultProfileUrl,
                                        height: 100,
                                        width: 100,
                                    }),
                                }}
                                style={{
                                    width: '100%',
                                    height: 110,
                                    borderColor: colors.seperatorLineColor,
                                    borderTopLeftRadius: 8,
                                    borderTopRightRadius: 8,
                                    opacity: 0.5,
                                }}
                            />
                            <View
                                style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderColor: 'purple',
                                    borderWidth: 0,
                                    flexDirection: 'column',
                                    marginTop: -95,
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
                                        height: personaProfileSize,
                                        width: personaProfileSize,
                                        borderRadius: personaProfileSize,
                                        marginBottom: 10,
                                        borderColor: 'yellow',
                                        borderWidth: 0,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontFamily: fonts.bold,
                                        fontSize: 22,
                                        color: 'white',
                                    }}>
                                    {persona?.name}
                                </Text>
                            </View>
                        </View>
                    </>
                )}
                <View
                    style={{
                        marginTop: 40,
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        backgroundColor: colors.paleBackground,
                        marginEnd: 40,
                        marginStart: 40,
                    }}></View>
            </View>
        </>
    );
}

function Footer() {
    return (
        <View
            style={{
                borderBottomLeftRadius: 8,
                backgroundColor: colors.paleBackground,
                marginEnd: 40,
                marginStart: 40,
                borderBottomRightRadius: 8,
                height: 10,
                marginBottom: 40,
            }}
        />
    );
}

//Invite modal styles
export const InviteViaLinkStyle = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    role_view: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: '#E0D3BF',
        borderRadius: 100,
        height: 44,
        width: 260,
        padding: 10,
        paddingLeft: 15,
    },
    role_text: {
        fontSize: 20,
        marginTop: -1,
    },
    change_role_label: {
        fontSize: 18,
        textDecorationLine: 'underline',
        marginLeft: 10,
    },
    invite_title_message: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#1B1D1F',
        borderRadius: 10,
        width: 360,
        marginTop: 5,
    },
    invite_title_message_text: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
    },
    scrollView: {
        flexGrow: 1,
        width: '90%',
    },
    scrollViewContentContainer: {
        paddingBottom: 20,
    },
    link_container: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: 20,
        backgroundColor: '#1B1D1F',
        borderRadius: 10,
        width: '100%',
        marginTop: 5,
        marginBottom: 5,
        flexDirection: 'row',
    },
    item_common_view: {
        overflow: 'hidden',
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    link_item_view: {
        borderRadius: 42 / 2,
        height: 42,
        width: 42,
    },
    item_view: {
        borderRadius: 30 / 2,
        height: 30,
        width: 30,
    },
});
