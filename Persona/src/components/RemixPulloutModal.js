import React, {useContext} from 'react';
import baseText from 'resources/text';
import isEqual from 'lodash.isequal';
import firestore from '@react-native-firebase/firestore';
import palette from 'resources/palette';
import {InviteStateContext} from 'state/InviteState';
import {vanillaPost, PostStateContext} from 'state/PostState';
import FastImage from 'react-native-fast-image';
import {PersonaStateContext} from 'state/PersonaState';
import {RemixRenderStateContext} from 'state/RemixRenderState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {
    TouchableOpacity,
    Dimensions,
    View,
    FlatList,
    Text,
    StyleSheet,
    TextInput,
} from 'react-native';
import BottomSheet from './BottomSheet';
import {PresenceStateRefContext} from 'state/PresenceStateRef';
//import {RoomsSmallStatusMem} from 'components/RoomsSmallStatus';
import images from 'resources/images';
import colors from 'resources/colors';

import getResizedImageUrl from 'utils/media/resize';
import AntDesign from 'react-native-vector-icons/AntDesign';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default function RemixPulloutProfiler(props) {
    return (
        <React.Profiler
            id={'RemixPulloutModal'}
            onRender={(id, phase, actualDuration) => {
                if (actualDuration > 2) {
                    console.log(
                        '======> (Profiler)',
                        id,
                        phase,
                        actualDuration,
                    );
                }
            }}>
            <RemixPulloutModalMemo {...props} />
        </React.Profiler>
    );
}

const RemixPulloutModalMemo = React.memo(RemixPulloutModal, propsAreEqual);
function RemixPulloutModal({navigation}) {
    const {
        toggleModalVisibility,
        personaID,
        persona,
        postID,
        post,
        showToggle,
    } = React.useContext(RemixRenderStateContext);

    return (
        <BottomSheet
            // windowScale={0.6}
            snapPoints={['60%']}
            showToggle={showToggle}
            toggleModalVisibility={toggleModalVisibility}>
            <ContentWrapperMemo
                navigation={navigation}
                toggleModalVisibility={toggleModalVisibility}
                personaID={personaID}
                postID={postID}
                post={post}
                persona={persona}
            />
        </BottomSheet>
    );
}

const ContentWrapper = ({
    navigation,
    persona,
    post,
    postID,
    personaID,
    toggleModalVisibility,
}) => {
    const {
        current: {personaList, personaMap},
    } = useContext(GlobalStateRefContext);
    const personaContext = React.useContext(PersonaStateContext);
    const postContext = React.useContext(PostStateContext);
    const inviteContext = React.useContext(InviteStateContext);
    const presenceContext = React.useContext(PresenceStateRefContext);
    //const presenceContext = React.useContext(PresenceStateContext);
    let showAllPersonas = true;

    let identityChoices = personaID
        ? [].concat(
              personaList
                  .filter(
                      p =>
                          p.parentPersonaID !== personaID &&
                          p.pid !== personaID &&
                          showAllPersonas,
                  )
                  .concat(
                      personaList.filter(p => p.parentPersonaID === personaID),
                  )
                  .concat(personaList.filter(p => p.personaID === personaID)),
          )
        : [].concat(personaList);

    const postToPersonaAction = React.useCallback(
        async newPersona => {
            console.log();
            console.log('REMIXXXXXXXX', newPersona);
            console.log('REMIXXXXXXXX', newPersona.personaID);
            console.log();

            personaContext.csetState({
                edit: true,
                new: false,
                posted: false,
                persona: Object.assign({pid: newPersona.personaID}, newPersona),
                identityPersona: Object.assign(
                    {pid: newPersona.personaID},
                    newPersona,
                ),
                personaID: newPersona.personaID,
                pid: newPersona.personaID,
            });
            //inviteContext.restoreVanilla({sNew: false, sEdit: true});
            //postContext.restoreVanilla({sNew: false, sEdit: true, sInit: true});

            let ppost = JSON.parse(JSON.stringify(vanillaPost));

            if (!post) {
                //console.log(`querying personas/${personaID}/posts/${postID}`);
                const pst = await firestore()
                    .collection('personas')
                    .doc(personaID)
                    .collection('posts')
                    .doc(postID)
                    .get();

                Object.assign(ppost, pst.data());
                //console.log('pst.data()->', pst.data());
            } else {
                Object.assign(ppost, post);
            }

            //console.log('after the restoreVanilla train');
            //console.log('post.subPersonaID', ppost.subPersonaID);
            //console.log(JSON.stringify(ppost, undefined, 4));
            let subPersona = ppost.subPersonaID
                ? Object.assign({}, personaMap[ppost.subPersonaID])
                : {};

            postContext.restoreVanilla({
                sNew: true,
                sInit: true,
            });
            let now = firestore.Timestamp.now();

            console.log('setting up a remix with remixPersonaID:', personaID);

            postContext.csetState({
                post: {
                    ...ppost,
                    title: 'REMIX: ' + ppost.title,
                    subPersona,
                    remixPostID: postID,
                    identityID: '',
                    minted: false,
                    remixedPostMintHash: ppost.mintHash,
                    remixedPostCID: ppost.ipfs_cid,
                    remixedPostContractHash: ppost.contractHash,
                    remixedPostNFTCounter: ppost.nftCounter,
                    publishDate: now,
                    seen: {},
                    editDate: now,
                    remixPostID: postID,
                    remixPersonaID: personaID,
                },
                init: true,
                edit: false,
                remix: true,
                new: false,
            });

            presenceContext.current.csetState({
                presenceIntent: `Remixing '${
                    ppost?.title ? ppost.title : 'untitled'
                }' • ${newPersona.name}`,
                navStackCache: {
                    identityID: presenceContext.current.identityID,
                    presenceObjPath: presenceContext.current.presenceObjPath,
                    presenceIntent: presenceContext.current.presenceIntent,
                },
            });

            //console.log('after the postContext.csetState');
            inviteContext.csetState({new: false, edit: true});
            //personaContextRef.current.csetState({new: false, edit: true});
            //console.log('after the inviteContext.csetState');

            toggleModalVisibility();
            navigation &&
                navigation.navigate('Persona', {
                    screen: 'StudioPostCreation',
                    persona: newPersona,
                    personaID: newPersona.personaID,
                    newPost: true,
                    editPost: false,
                    newInvite: true,
                    editInvite: false,
                    screenInit: true,
                    inputPost: null,
                    inputPostID: null,
                });
        },
        [
            navigation,
            personaMap,
            postID,
            presenceContext,
            personaContext,
            postContext,
            inviteContext,
            post,
            post?.subPersonaID,
            post?.pid,
            persona?.pid,
            persona,
            personaID,
        ],
    );

    return (
        <View style={{flex: 2, borderColor: 'yellow', borderWidth: 0}}>
            <View
                style={{marginStart: 25, borderColor: 'blue', borderWidth: 0}}>
                <Text
                    style={{
                        ...baseText,
                        color: colors.text,
                        fontWeight: 'bold',
                        fontSize: 18,
                    }}>
                    Remix "{post?.title}"
                </Text>
            </View>
            <IdentityListMemo
                postToPersonaAction={postToPersonaAction}
                personaID={personaID}
                identityChoices={identityChoices}
            />
            <View style={{flex: 2}}>
                <DownButtonMemo toggleModalVisibility={toggleModalVisibility} />
            </View>
        </View>
    );
};
const ContentWrapperMemo = React.memo(ContentWrapper, propsAreEqual);

function DownButton({toggleModalVisibility}) {
    return (
        <View
            style={{
                marginBottom: 30,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                borderColor: 'blue',
                borderWidth: 0,
            }}>
            <View style={{flex: 1}}>
                <Text> </Text>

                <View style={{flex: 0}} />
            </View>
            <View style={{paddingRight: 20, paddingBottom: 20}}>
                <TouchableOpacity
                    hitSlop={{left: 26, right: 25, bottom: 25, top: 25}}
                    onPress={toggleModalVisibility}>
                    <AntDesign
                        name={'down'}
                        size={24}
                        color={colors.postAction}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}
const DownButtonMemo = React.memo(DownButton, propsAreEqual);

const IdentityListMemo = React.memo(IdentityList, propsAreEqual);

function IdentityList({identityChoices, personaID, postToPersonaAction}) {
    const {
        current: {personaList},
    } = useContext(GlobalStateRefContext);
    //console.log('identityChoices', JSON.stringify(identityChoices, undefined, 4));
    const [personaFilter, setPersonaFilter] = React.useState('');

    let personaFilterLowerCase = personaFilter.toLowerCase();
    console.log('personaFilter', personaFilterLowerCase);
    let filteredIdentityChoices = identityChoices.filter(p =>
        !personaFilterLowerCase || !p.name
            ? true
            : p.name.toLowerCase().includes(personaFilterLowerCase),
    );
    let showAllPersonas = true;

    return (
        <View style={{flexDirection: 'column', flex: 11.5}}>
            <View
                style={{
                    flex: 0,
                    borderColor: 'blue',
                    borderWidth: 0,
                    flexDirection: 'column',
                }}>
                {!personaList.findIndex(p => personaID !== p.personaID) ||
                showAllPersonas ? (
                    <Text
                        style={{
                            ...baseText,
                            fontWeight: 'bold',
                            fontSize: 16,
                            marginStart: 15,
                            color: colors.text,
                        }}>
                        onto...
                    </Text>
                ) : null}
                <View
                    style={{
                        flex: 0,
                        width: Dimensions.get('window').width * 0.9,
                        marginStart: 10,
                        marginEnd: 10,
                        marginTop: 10,
                        marginBottom: 10,
                        borderRadius: 25,
                        backgroundColor: colors.homeBackground,
                    }}>
                    <TextInput
                        editable={true}
                        autoCapitalize={'none'}
                        multiline={false}
                        value={personaFilter}
                        placeholderTextColor={colors.textFaded2}
                        placeholder={'search...'}
                        textAlign={'left'}
                        textAlignVertical={'top'}
                        justifyContent={'flex-start'}
                        onChangeText={setPersonaFilter}
                        style={{
                            ...baseText,
                            color: colors.text,
                            padding: 5,
                            paddingLeft: 10,
                            paddingBottom: Platform.OS === 'android' ? 0 : 5,
                        }}
                    />
                </View>
            </View>
            <View style={{flex: 1}}>
                <FlatList
                    keyboardShouldPersistTaps="always"
                    data={filteredIdentityChoices}
                    contentContainerStyle={{
                        borderColor: 'yellow',
                        borderWidth: 0,
                        width: '100%',
                    }}
                    ListHeaderComponentStyle={{paddingLeft: 15}}
                    ListFooterComponentStyle={{paddingLeft: 15}}
                    ListFooterComponent={() =>
                        personaList.findIndex(
                            p => personaID !== p.personaID,
                        ) ? (
                            false ? (
                                <View>
                                    <TouchableOpacity
                                        onPress={() =>
                                            setShowAllPersonas(!showAllPersonas)
                                        }
                                        style={{
                                            alignItems: 'center',
                                            padding: 5,
                                        }}>
                                        <ShareAction
                                            message={
                                                showAllPersonas
                                                    ? 'Hide Other Personas'
                                                    : 'Show All'
                                            }
                                        />
                                    </TouchableOpacity>
                                    {identityChoices.length * 100 >
                                        Dimensions.get('window').height && (
                                        <View
                                            style={{
                                                height: 200,
                                                borderColor: 'blue',
                                                borderWidth: 0,
                                            }}
                                        />
                                    )}
                                </View>
                            ) : null
                        ) : (
                            identityChoices.length * 100 >
                                Dimensions.get('window').height && (
                                <View
                                    style={{
                                        height: 200,
                                        borderColor: 'blue',
                                        borderWidth: 0,
                                    }}
                                />
                            )
                        )
                    }
                    keyExtractor={item => item.personaID}
                    renderItem={({item}) => (
                        <TouchableOpacity
                            style={{flexDirection: 'row'}}
                            onPress={() => postToPersonaAction(item)}>
                            <View
                                style={{
                                    paddingLeft: 15,
                                    borderColor: 'purple',
                                    borderWidth: 0,
                                    flexDirection: 'row',
                                    paddingTop: 8,
                                    paddingBottom: 8,
                                }}>
                                <FastImage
                                    source={{
                                        uri: getResizedImageUrl({
                                            origUrl:
                                                item.profileImgUrl ||
                                                (item.user
                                                    ? images.userDefaultProfileUrl
                                                    : images.personaDefaultProfileUrl),
                                            width: Styles.personImage,
                                            height: Styles.personImage,
                                        }),
                                    }}
                                    style={Styles.personImage}
                                />
                                <Text
                                    style={{
                                        ...baseText,
                                        color: colors.text,
                                        paddingTop: 12,
                                        paddingLeft: 5,
                                        fontWeight: 'bold',
                                    }}>
                                    {item.name}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );
}
export const Styles = StyleSheet.create({
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
    upperTimeline: {
        ...palette.timeline.line,
        marginLeft:
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth,
        position: 'absolute',
        height: 100,
        backgroundColor: colors.timeline,
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
        fontSize: 14,
    },
    replyText: {
        color: colors.textFaded2,
        fontSize: 12,
        fontStyle: 'italic',
        paddingLeft: 17.5,
    },
    replyHeaderText: {
        color: colors.textFaded2,
        fontSize: 12,
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
        fontWeight: 'bold',
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
        fontSize: 12,
        color: colors.textFaded2,
        marginTop: 2,
        marginBottom: 0,
        height: 20,
    },
    centeredView: {
        marginBottom: Platform.OS === 'ios' ? -25 : 0,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    modalView: {
        margin: 0,
        borderRadius: 20,
        paddingTop: 15,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
        alignItems: 'flex-start',
        maxHeight: Dimensions.get('window').height * 0.8,
        width: Dimensions.get('window').width,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    profilePicture: {
        height: 50,
        width: 50,
        borderRadius: 45,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
    personImage: {
        width: 40,
        height: 40,
        borderRadius: 40,
    },
});
