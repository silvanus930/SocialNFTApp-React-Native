import baseText from 'resources/text';
import useRoomPresence from 'hooks/useRoomPresence';
import fonts from 'resources/fonts';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {getServerTimestamp} from 'actions/constants';

import {
    ActivityIndicator,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Dimensions,
    View,
    Text,
    FlatList,
    Image,
    Platform,
    LayoutAnimation,
    Keyboard,
} from 'react-native';
import BottomSheet from './BottomSheet';
import colors from 'resources/colors';
import React, {
    useCallback,
    useMemo,
    useEffect,
    useState,
    useContext,
    useRef,
} from 'react';
import ShareAction from 'components/ShareAction';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Feather';
import FastImage from 'react-native-fast-image';
import useDebounce from 'hooks/useDebounce';
import images from 'resources/images';
import {
    MEDIA_IMAGE_POST_QUALITY,
    MEDIA_VIDEO_POST_QUALITY,
} from 'utils/media/compression';
import {clog} from 'utils/log';
import isEqual from 'lodash.isequal';
import palette from 'resources/palette';
import useRateLimit from 'hooks/useRateLimit';
import {
    DiscussionEngineDispatchContext,
    DiscussionEngineStateContext,
} from './DiscussionEngineContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {PresenceStateRefContext} from 'state/PresenceStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {getClosestWord} from 'utils/helpers';
import {UserAutocompleteContext} from 'state/UserAutocompleteState';
import auth from '@react-native-firebase/auth';
import getResizedImageUrl from 'utils/media/resize';
import Video from 'react-native-video';
import {CREATE_POST_CONTAINER_HEIGHT} from 'components/ForumCreatePost';
import {uploadImages} from 'components/ImageUploader';
const CUSTOM_LOG_WARN_HEADER = '!! components/CreateDiscussionComment';
const log = (...args) =>
    global.LOG_POST_CREATION && clog(CUSTOM_LOG_WARN_HEADER, ...args);

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(CreateDiscussionComment, propsAreEqual);

function CreateDiscussionComment(props) {
    const {state} = React.useContext(DiscussionEngineStateContext);
    const toggleKeyboard = state.toggleKeyboard;
    const editComment = state.editComment;
    const replyComment = state.replyComment;
    const threadID = state.threadID;
    const personaID = state.personaID;
    const editingPost = state.editingPost;
    const postEditOpenedWithPadding = state.postEditOpenedWithPadding;
    const replyUserName = state.replyUserName;

    // console.log('CreateDiscussionComment personaID->', personaID);

    const personaStateRefContext = React.useContext(PersonaStateRefContext);
    return useMemo(
        () => (
            <CreateDiscussionCommentMemo
                {...props}
                toggleKeyboard={toggleKeyboard}
                editComment={editComment}
                replyComment={replyComment}
                threadID={threadID}
                personaID={personaStateRefContext.current?.persona?.pid}
                editingPost={editingPost}
                postEditOpenedWithPadding={postEditOpenedWithPadding}
                replyUserName={replyUserName}
            />
        ),
        [
            postEditOpenedWithPadding,
            props,
            toggleKeyboard,
            editComment,
            replyComment,
            threadID,
            personaID,
            personaStateRefContext.current?.persona?.pid,
            editingPost,
            replyUserName,
        ],
    );
}

function CreateDiscussionCommentMemo({
    replyComment,
    editComment,
    parentObjPath,
    personaID,
    toggleKeyboard,
    getDiscussionCollection = () => {},
    getFirebaseCommentsLiveCache,
    threadID,
    threadView = false,
    replyUserName,
}) {
    const personaContext = useContext(PersonaStateRefContext);
    const isDM = parentObjPath.includes(SYSTEM_DM_PERSONA_ID);
    const isProjectChat =
        parentObjPath.includes('personas') &&
        parentObjPath.includes('chats') &&
        !isDM;

    const isCommunityChat =
        parentObjPath.includes('communities') &&
        parentObjPath.includes('chat') &&
        !isDM;
    const presenceContextRef = React.useContext(PresenceStateRefContext);
    const myUserID = auth().currentUser.uid;
    const handleScrollToEnd = () => {
        dispatch({type: 'setInvertedFlatlist', payload: true});
        dispatch({type: 'toggleScrollToStart'});
        //dispatch({type: 'toggleScrollToEnd'});
    };
    const goToMainThread = () => {
        // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        personaContext.current.csetState({openToThreadID: null});
        dispatch({type: 'clearThread'});
        dispatch({type: 'toggleScrollWhenCancelingThreadReply'});
    };
    const handleClearReply = () => dispatch({type: 'clearReplyComment'});

    const {dispatch} = React.useContext(DiscussionEngineDispatchContext);
    const [progressIndicator, setProgressIndicator] = useState('');
    const {
        current: {user, personaList, userMap, personaMap},
    } = useContext(GlobalStateRefContext);
    const [newComment, setNewComment] = useState('');
    const inputRef = useRef();

    const [showImageOptions, setShowImageOptions] = useState(true); // TODO animate showing Image options
    const [showPersonaList, setShowPersonaList] = useState(false);
    const [mediaChoice, setMediaChoice] = useState('');
    const [showAllPersonas, setShowAllPersonas] = useState(true);

    useEffect(() => {
        setShowAllPersonas(
            personaList.findIndex(p => p.personaID === personaID) < 0,
        );
    }, [personaID]);

    useEffect(() => {
        if (threadID !== null) {
            setNewComment('');
        }
    }, [threadID]);

    let presenceID =
        presenceContextRef.current.identityID &&
        presenceContextRef.current.identityID.startsWith('PERSONA')
            ? presenceContextRef.current.identityID.split('::')[1]
            : myUserID;
    let vanillaID =
        presenceID === myUserID || presenceID === '' || presenceID === 'unset';

    /*console.log(
    'CHECKING PRESENCEID',
    presenceContextRef.current.identityID,
    presenceID,
  );*/
    //console.log('CHECKING vanillaID', vanillaID);
    const [identityID, setIdentityID] = useState(vanillaID ? '' : presenceID);
    const [identityName, setIdentityName] = useState(
        vanillaID ? '' : personaMap[presenceID]?.name,
    );
    const [identityBio, setIdentityBio] = useState(
        vanillaID ? '' : personaMap[presenceID]?.bio,
    );
    const [identityProfileImgUrl, setIdentityProfileImgUrl] = useState(
        vanillaID ? '' : personaMap[presenceID]?.profileImgUrl,
    );
    //console.log('VIBE CHECK', identityID);

    const {
        query: autocompleteQuery,
        setQuery: setAutocompleteQuery,
        selectedUser: autocompleteSelectedUser,
        setSelectedUser: setAutocompleteSelectedUser,
        setDialogAllowed: setAutocompleteDialogAllowed,
    } = useContext(UserAutocompleteContext);
    const cursorPositionRef = useRef(null);

    const maybeUpdateAutocomplete = useCallback(
        (text, cursor, checkPrevWord) => {
            const {closestWord} = getClosestWord(text, cursor);
            const {closestWord: prevClosetWord} = getClosestWord(
                text,
                cursor - 1,
            );
            if (
                closestWord.startsWith('@') &&
                closestWord.length > 1 &&
                (closestWord.slice(1) !== autocompleteQuery ||
                    autocompleteQuery === null)
            ) {
                setAutocompleteQuery(closestWord.slice(1));
            } else if (
                autocompleteQuery !== null &&
                closestWord.slice(1) !== autocompleteQuery &&
                (!checkPrevWord ||
                    prevClosetWord.slice(1) !== autocompleteQuery)
            ) {
                setAutocompleteQuery(null);
            }
        },
        [autocompleteQuery, setAutocompleteQuery],
    );

    const onChange = useCallback(async () => {
        setTyping();
        if (!expandText) {
            // LayoutAnimation.configureNext(
            //     LayoutAnimation.Presets.easeInEaseOut,
            // );
            setExpandText(true);
        }
    }, [setExpandText]);

    const onChangeText = useCallback(
        text => {
            if (!inputRef.current?.isFocused()) {
                return;
            }
            setNewComment(text);
            if (cursorPositionRef.current !== null) {
                maybeUpdateAutocomplete(text, cursorPositionRef.current, false);
            }
        },
        [maybeUpdateAutocomplete],
    );

    const onSelectionChange = useCallback(
        event => {
            if (!inputRef.current?.isFocused()) {
                return;
            }
            // Runs before onChangeText
            const cursor = event.nativeEvent.selection.start;
            const oldCursor = cursorPositionRef.current;
            cursorPositionRef.current = cursor;
            maybeUpdateAutocomplete(
                newComment,
                cursor,
                oldCursor === cursor - 1,
            );
        },
        [newComment, maybeUpdateAutocomplete],
    );

    useEffect(() => {
        if (
            cursorPositionRef.current !== null &&
            autocompleteSelectedUser !== null
        ) {
            const cursor = cursorPositionRef.current;
            const {start, closestWord} = getClosestWord(newComment, cursor);
            const end = start + closestWord.length;
            let replacementText;
            if (autocompleteSelectedUser === undefined) {
                replacementText =
                    newComment.substring(0, start) + newComment.substring(end);
            } else {
                replacementText =
                    newComment.substring(0, start) +
                    `@${autocompleteSelectedUser} ` +
                    newComment.substring(end);
            }
            setNewComment(replacementText);
            setAutocompleteSelectedUser(null);
        }
    }, [autocompleteSelectedUser, newComment, setAutocompleteSelectedUser]);

    const setTyping = useRateLimit(
        () => {
            const id = identityID === '' ? user.id : identityID;
            let update;
            update = {
                typing: {
                    [user.id]: {
                        identity: id,
                        heartbeat: getServerTimestamp(),
                        inThread: threadID !== null,
                    },
                },
            };
            if (threadID !== null) {
                update.threadTyping = {
                    [threadID]: {
                        [user.id]: {
                            identity: id,
                            heartbeat: getServerTimestamp(),
                        },
                    },
                };
            }
            getDiscussionCollection()
                .parent.collection('presence')
                .doc('typing')
                .set(update, {merge: true});
        },
        [identityID, user?.id, threadID],
        3000,
    );

    const [media, setMedia] = useState([]);

    const clearMediaState = (index = null) => {
        if (index === null) {
            setShowImageOptions(true);
            setMediaUploading(false);
            setMedia([]);
            return;
        }
        media.splice(index, 1);
        setMedia([...media]);
        if (media.length === 0) {
            setShowImageOptions(true);
            setMediaUploading(false);
        }
    };

    const clearLocalState = () => {
        clearMediaState();
    };

    /*useEffect(() => {
    !vanillaID && setIdentity(personaMap[presenceID]);
    console.log('SETTING PRESENCE ID TO', presenceID);
    dispatch({type: 'setIdentityID', payload: presenceID});
  }, [vanillaID, presenceID]);*/

    const clearIdentity = useCallback(() => {
        //console.log('@@@@@@@ CALL CLEARIDENTITY');
        presenceContextRef.current.csetState({
            personaVoice: false,
            identityID: myUserID,
        });

        /*
        firestore()
            .doc(ROOMS_ADDRESS)
            .set(
                {
                    rooms: {
                        [presenceContextRef.current.presenceObjPath]: {
                            [myUserID]: {
                                identity: myUserID,
                            },
                        },
                    },
                },
                {merge: true},
            );
            */

        firestore().doc(`users/${myUserID}/live/voice`).set(
            {
                voice: '',
            },
            {merge: true},
        );
        setIdentityID('');
        dispatch({type: 'setIdentityID', payload: user?.id});
        setIdentityName('');
        setIdentityBio('');
        setIdentityProfileImgUrl('');
        setShowPersonaList(false);
    }, [user?.id, presenceContextRef]);

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const toggleShowProfileModal = React.useCallback(() => {
        profileModalContextRef.current.csetState({
            userID: auth().currentUser.uid,
        });
        profileModalContextRef.current.toggleModalVisibility();

        // TODO animations
    }, [profileModalContextRef]);
    const toggleShowPersonaList = React.useCallback(() => {
        setShowPersonaList(!showPersonaList);
        // TODO animations
    }, [showPersonaList]);

    const setEmoji = emoji => {
        console.log('calling setEmoji', emoji);

        /*
        firestore()
            .doc(ROOMS_ADDRESS)
            .set(
                {
                    rooms: {
                        [presenceContextRef.current.presenceObjPath]: {
                            [myUserID]: {
                                emoji: emoji,
                            },
                        },
                    },
                },
                {merge: true},
            );
            */
        setShowPersonaList(false);
    };

    const setIdentity = ({persona, emoji}) => {
        log('@@@@@@@@ setIdentity called with', persona?.name);

        if (persona.personaID === user.id) {
            clearIdentity();
            return;
        }

        presenceContextRef.current.csetState({
            personaVoice: true,
            identityID: 'PERSONA::' + persona.personaID,
            emoji: emoji,
        });

        /*
        firestore()
            .doc(ROOMS_ADDRESS)
            .set(
                {
                    rooms: {
                        [presenceContextRef.current.presenceObjPath]: {
                            [myUserID]: {
                                identity: 'PERSONA::' + persona.personaID,
                            },
                        },
                    },
                },
                {merge: true},
            );
            */

        firestore().doc(`users/${myUserID}/live/voice`).set(
            {
                voice: persona.personaID,
            },
            {merge: true},
        );
        setIdentityID(persona.personaID);
        dispatch({type: 'setIdentityID', payload: persona.personaID});
        setIdentityName(persona?.name);
        setIdentityBio(persona?.bio);
        setIdentityProfileImgUrl(persona?.profileImgUrl);
        setShowPersonaList(false);
    };

    const chooseMedia = async (mediaType = 'photo') => {
        const preUploadCallback = () => {
            setProgressIndicator('busy');
            setShowImageOptions(false);
            setMediaUploading(true);
        };
        const postUploadCallback = (result, error) => {
            setProgressIndicator('');
            setMediaUploading(false);
            if (error) {
                console.log(
                    'ERROR: unable to upload media: ',
                    JSON.stringify(error),
                );
                clearLocalState();
                alert('Unable to upload media - please try again.');
                return;
            }
            setMediaChoice(mediaType);
            setMedia(result);
        };
        await uploadImages(
            'gallery',
            {
                mediaType: 'any',
                compressImageQuality: MEDIA_IMAGE_POST_QUALITY,
                multiple: true,
            },
            preUploadCallback,
            postUploadCallback,
        );
    };

    const newMedia = async (mediaType = 'photo') => {
        const preUploadCallback = () => {
            setProgressIndicator('busy');
            setShowImageOptions(false);
            setMediaUploading(true);
        };
        const postUploadCallback = (result, error) => {
            setProgressIndicator('');
            setMediaUploading(false);
            if (error) {
                console.log(
                    'ERROR: unable to upload media: ',
                    JSON.stringify(error),
                );
                clearLocalState();
                alert('Unable to upload media - please try again.');
                return;
            }
            setMediaChoice(mediaType);
            setMedia(result);
        };
        await uploadImages(
            mediaType,
            {
                mediaType: mediaType,
                compressImageQuality: MEDIA_IMAGE_POST_QUALITY,
                multiple: false,
            },
            preUploadCallback,
            postUploadCallback,
        );
    };

    const [mediaUploading, setMediaUploading] = React.useState(false);

    useEffect(() => {
        if (inputRef?.current && toggleKeyboard !== undefined) {
            inputRef.current.focus();
        }
    }, [toggleKeyboard]);

    useEffect(() => {
        if (editComment !== null && editComment !== undefined) {
            if (editComment?.anonymous) {
                const persona = personaMap[editComment.identityID];
                setIdentity({
                    persona: {...persona, personaID: editComment.identityID},
                });
            } else {
                !vanillaID && setIdentity({persona: personaMap[presenceID]});
                vanillaID && clearIdentity();
                //console.log(!vanillaID, 'SETTING PRESENCE ID TO', presenceID);
            }
            setNewComment(editComment.text);
            const media = {
                width: editComment?.mediaWidth || 0,
                height: editComment?.mediaHeight || 0,
                uri: editComment?.mediaUrl || '',
            };
            setMedia(media.uri ? [media] : []);
        } else {
            setNewComment('');
            vanillaID && clearIdentity();
            !vanillaID && setIdentity({persona: personaMap[presenceID]});
            //console.log(!vanillaID, 'SETTING PRESENCE ID TO', presenceID);
            //dispatch({type: 'setIdentityID', payload: presenceID});
            clearMediaState();
        }
    }, [editComment]);

    const communityContextRef = React.useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;
    let communityID = communityContextRef?.current?.currentCommunity;

    let persona;
    if (isCommunityChat) {
        persona = communityMap[communityID];
    } else {
        persona = personaMap[personaID];
    }

    const submitComment = useDebounce(
        comment => {
            requestAnimationFrame(() => {
                if (comment !== '' || media.length > 0) {
                    for (let i = 0; i < Math.max(media.length, 1); i++) {
                        const isLastMedia =
                            media.length === 0 || i === media.length - 1;
                        let mediaObj = null;
                        if (i < media.length) {
                            mediaObj = media[i];
                        }
                        const currComment = isLastMedia ? comment : '';
                        const mediaUrl = mediaObj?.uri || '';
                        const mediaWidth = mediaObj?.width || 0;
                        const mediaHeight = mediaObj?.height || 0;
                        let createCommentCollection = getDiscussionCollection();
                        let tID = threadID || editComment?.threadID;
                        if (
                            threadID !== null ||
                            (editComment && editComment?.isThread)
                        ) {
                            createCommentCollection = createCommentCollection
                                .doc(tID)
                                .collection('threads');
                        }
                        setNewComment('');
                        if (editComment) {
                            let editCommentMinusPriorHistory = {...editComment};
                            delete editCommentMinusPriorHistory.history;
                            let updatedCommentData = {
                                editTimestamp: firestore.Timestamp.now(),
                                text: currComment,
                                history: firestore.FieldValue.arrayUnion(
                                    editCommentMinusPriorHistory,
                                ),
                                userID: user.id,
                                deleted: false,
                                seen: {},
                            };
                            updatedCommentData.mediaUrl = mediaUrl;
                            updatedCommentData.mediaWidth = mediaWidth;
                            updatedCommentData.mediaHeight = mediaHeight;
                            if (identityID) {
                                updatedCommentData.anonymous = true;
                                updatedCommentData.identityID = identityID;
                            } else {
                                updatedCommentData.anonymous = false;
                                updatedCommentData.identityID =
                                    firestore.FieldValue.delete();
                            }
                            if (replyComment) {
                                updatedCommentData.replyComment = {
                                    ...replyComment,
                                    replyId: replyComment.id,
                                };
                                if (isLastMedia) {
                                    handleClearReply();
                                }
                            } else if (editComment.replyComment) {
                                updatedCommentData.replyComment =
                                    firestore.FieldValue.delete();
                            }
                            const batch = firestore().batch();
                            batch.set(
                                createCommentCollection.doc(editComment.id),
                                updatedCommentData,
                                {merge: true},
                            );
                            batch.set(
                                createCommentCollection.doc(editComment.id),
                                {
                                    seen: {
                                        [myUserID]: getServerTimestamp(),
                                    },
                                },
                                {merge: true},
                            );
                            if (editComment?.isThread) {
                                batch.set(
                                    createCommentCollection.parent,
                                    {
                                        latestThreadComment: updatedCommentData,
                                        seen: {}, // no one has seen the update!
                                    },
                                    {merge: true},
                                );
                                batch.set(
                                    createCommentCollection.parent,
                                    {
                                        seen: {
                                            [myUserID]: getServerTimestamp(),
                                        },
                                    },
                                    {merge: true},
                                );
                            }
                            if (tID) {
                                batch.commit().catch(error => {
                                    //handle error
                                });
                            } else {
                                batch
                                    .commit()
                                    .then(() => {
                                        return createCommentCollection
                                            .doc(editComment.id)
                                            .get();
                                    })
                                    .then(doc => {
                                        if (doc.exists) {
                                            getFirebaseCommentsLiveCache()
                                                .doc(doc.id)
                                                .set(
                                                    {
                                                        ...doc.data(),
                                                        lastUpdatedAtTimestamp:
                                                            firestore.Timestamp.now(),
                                                    },
                                                    {merge: true},
                                                );
                                        }
                                    })
                                    .catch(error => {
                                        //handle error
                                    });
                            }
                            if (isLastMedia) {
                                clearLocalState();
                                dispatch({type: 'clearEditComment'});
                            }
                        } else {
                            if (threadID !== null) {
                                goToMainThread();
                            } else {
                                handleScrollToEnd();
                            }

                            let newCommentData = {
                                userID: user.id,
                                timestamp: getServerTimestamp(),
                                text: currComment,
                                mediaUrl: mediaUrl,
                                mediaWidth: mediaWidth,
                                mediaHeight: mediaHeight,
                                deleted: false,
                                isThread: threadID !== null,
                                seen: {
                                    [myUserID]: getServerTimestamp(),
                                },
                            };

                            if (identityID) {
                                newCommentData.anonymous = true;
                                newCommentData.identityID = identityID;
                            }
                            if (replyComment) {
                                newCommentData.replyComment = {
                                    ...replyComment,
                                    replyId: replyComment.id,
                                };
                                if (isLastMedia) {
                                    handleClearReply();
                                }
                            }
                            createCommentCollection.add(newCommentData);
                            if (!identityID) {
                                newCommentData.anonymous =
                                    firestore.FieldValue.delete();
                                newCommentData.identityID =
                                    firestore.FieldValue.delete();
                            }
                            const batch = firestore().batch();
                            if (threadID !== null) {
                                batch.set(
                                    createCommentCollection.parent,
                                    {
                                        numThreadComments:
                                            firestore.FieldValue.increment(1),
                                        latestThreadComment: newCommentData,
                                        seen: {}, // no one has seen the update!
                                    },
                                    {merge: true},
                                );
                                batch.set(
                                    createCommentCollection.parent,
                                    {
                                        seen: {
                                            [myUserID]: getServerTimestamp(),
                                        },
                                    },
                                    {merge: true},
                                );
                            }
                            batch.set(
                                getDiscussionCollection()
                                    .parent.collection('live')
                                    .doc('discussion'),
                                {
                                    numCommentsAndThreads:
                                        firestore.FieldValue.increment(1),
                                },
                                {merge: true},
                            );
                            // TODO: timestamps doc will be deprecated
                            communityID &&
                                batch.set(
                                    firestore()
                                        .collection('communities')
                                        .doc(communityID)
                                        .collection('live')
                                        .doc('timestamps'),
                                    {
                                        editDate: firestore.Timestamp.now(),
                                        streams: {
                                            [personaID
                                                ? personaID
                                                : communityID]:
                                                firestore.Timestamp.now(),
                                        },
                                    },
                                    {merge: true},
                                );
                            communityID &&
                                batch.set(
                                    firestore()
                                        .collection('communities')
                                        .doc(communityID)
                                        .collection('live')
                                        .doc('activity'),
                                    {
                                        lastActive: firestore.Timestamp.now(),
                                        chats: {
                                            [getDiscussionCollection().path]: {
                                                lastActive:
                                                    firestore.Timestamp.now(),
                                                messageCount:
                                                    firestore.FieldValue.increment(
                                                        1,
                                                    ),
                                            },
                                        },
                                    },
                                    {merge: true},
                                );

                            batch
                                .commit()
                                .then(() => {
                                    if (threadID !== null) {
                                        return createCommentCollection.parent.get();
                                    } else {
                                        return null;
                                    }
                                })
                                .then(doc => {
                                    getFirebaseCommentsLiveCache()
                                        .doc(doc.id)
                                        .set(
                                            {
                                                ...doc.data(),
                                                lastUpdatedAtTimestamp:
                                                    firestore.Timestamp.now(),
                                            },
                                            {merge: true},
                                        );
                                })
                                .catch(error => {
                                    //handle error
                                });
                            if (isLastMedia) {
                                clearLocalState();
                            }
                            //HOOHAA
                        }
                    }
                }
            });
        },
        [
            communityID,
            personaID,
            threadID,
            editComment,
            replyComment,
            identityID,
            identityName,
            identityBio,
            identityProfileImgUrl,
            threadView,
            media,
        ],
    );

    let identityChoices = personaID
        ? []
              .concat({
                  name: user?.userName,
                  personaID: user.id,
                  bio: user.bio,
                  profileImgUrl: user.profileImgUrl,
                  user: true,
              })
              .concat(
                  personaList
                      .filter(
                          p =>
                              p.parentPersonaID !== personaID &&
                              p.pid !== personaID &&
                              showAllPersonas,
                      )
                      .concat(
                          personaList.filter(
                              p => p.parentPersonaID === personaID,
                          ),
                      )
                      .concat(
                          personaList.filter(p => p.personaID === personaID),
                      ),
              )
        : []
              .concat({
                  name: user?.userName,
                  personaID: user.id,
                  bio: user.bio,
                  profileImgUrl: user.profileImgUrl,
                  user: true,
              })
              .concat(personaList);

    /*log(
    'identityChoices',
    identityChoices.map(p => p?.name),
  );*/

    const [expandText, setExpandText] = React.useState(false);
    const onFocusTextInput = () => {
        // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandText(true);
        setAutocompleteDialogAllowed(true);
    };

    const onBlurTextInput = () => {
        // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandText(false);
        setAutocompleteDialogAllowed(false);
    };

    //console.log('CDC', parentObjPath, route?.name);

    /*console.log(
        'CDC checking membership',
        personaID,
        personaID
            ? personaMap[personaID].authors?.includes(auth().currentUser.uid)
            : 'no personamap entry found',
    );*/

    const {roomPresence} = useRoomPresence({
        rootParentObjPath: parentObjPath,
        room: {
            id: postID,
            title: 'chat',
            slug: null,
        },
        myUserID,
    });

    /*React.useEffect(() => {
        const sub = Keyboard.addListener('keyboardDidHide', () =>
            inputRef?.current?.blur(),
        );

        return () => {
            sub.remove();
        };
    }, [inputRef]);*/

    if (
        personaID &&
        !personaMap[personaID]?.authors?.includes(auth().currentUser.uid)
    ) {
        /*console.log(
            'CDC checking if publicCanChat',
            personaMap[personaID].publicCanChat,

        );*/
        if (isProjectChat && !personaMap[personaID]?.publicCanChat) {
            return <></>;
        }

        if (!isProjectChat && !personaMap[personaID]?.publicCanComment) {
            return <></>;
        }
    }

    let postID = parentObjPath?.split('/')[2];

    const replyToName = replyComment
        ? userMap[replyComment.userID]?.fullName
            ? userMap[replyComment.userID]?.fullName
            : '@' + userMap[replyComment.userID]?.userName
        : null;

    const replyCommentText = replyComment?.text
        ? replyComment?.text.length > 49
            ? replyComment.text.substring(0, 49) + '...'
            : replyComment.text
        : '';

    const disabledSubmit = mediaUploading || (!newComment && !media.length);

    return (
        <>
            <View
                onLayout={e =>
                    dispatch({
                        type: 'setCreateDiscussionHeight',
                        payload: e.nativeEvent.layout.height,
                    })
                }
                style={{
                    paddingTop: 3,
                    flexDirection: 'column',
                    marginBottom: 0,
                    borderTopWidth: 0.4,
                    borderTopColor: colors.timestamp,
                    paddingTop: 8,
                    zIndex: 999999999,
                    elevation: 999999999,
                    borderWidth: 0,
                    borderColor: 'white',
                    width: '100%',
                    paddingBottom: 20,
                    minHeight: CREATE_POST_CONTAINER_HEIGHT / 2,
                }}>
                {threadID !== null && (
                    <View
                        style={{
                            marginLeft: 0,
                            marginBottom: 0,
                            width: 300,
                            borderRadius: 25,
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start',
                            flexDirection: 'row',
                            paddingRight: 25,
                        }}>
                        <TouchableOpacity onPress={goToMainThread}>
                            <View
                                style={{
                                    marginLeft: 50,
                                    marginBottom: 5,
                                    width: 300,
                                    borderRadius: 25,
                                    alignItems: 'flex-end',
                                    justifyContent: 'flex-end',
                                    flexDirection: 'row',
                                    paddingRight: 25,
                                }}>
                                {threadID !== null && (
                                    <Text
                                        style={{
                                            ...baseText,
                                            fontFamily: fonts.bold,
                                            fontSize: 12,
                                            marginStart: 0,
                                            marginEnd: 20,
                                            top: 0,
                                            color: colors.textBright,
                                        }}>
                                        Replying to {replyUserName}
                                    </Text>
                                )}
                                {threadID !== null ? (
                                    <View style={{paddingLeft: 20, top: -2}}>
                                        <Icon
                                            color={colors.postAction}
                                            size={14}
                                            name={'chevron-left'}
                                        />
                                    </View>
                                ) : (
                                    <View
                                        style={{
                                            height: 21,
                                            paddingLeft: 20,
                                        }}
                                    />
                                )}
                                <Text
                                    style={{
                                        ...baseText,
                                        fontFamily: fonts.bold,
                                        fontSize: 12,
                                        marginStart: 0,
                                        marginEnd: 10,
                                        top: 0,
                                        color: colors.textBright,
                                    }}>
                                    {threadID !== null ? 'cancel' : ''}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {replyComment && (
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            marginLeft: 16,
                            marginRight: 16,
                            marginBottom: 10,
                            backgroundColor: '#1B1D1F',
                            // padding: 6,
                            borderWidth: 0.5,
                            borderColor: '#424547',
                            borderRadius: 8,
                        }}>
                        <View style={Styles.replyRow}>
                            <View style={Styles.replyBox}>
                                <View style={{flex: 1, flexDirection: 'row'}}>
                                    <MaterialCommunityIcons
                                        name="reply"
                                        size={18}
                                        color={colors.navSubProminent}
                                        style={{marginLeft: 0, marginRight: 2}}
                                    />
                                    <Text
                                        style={{
                                            ...baseText,
                                            fontWeight: '500',
                                            color: '#D0D3D6',
                                            fontSize: 14,
                                            // marginBottom: 2,
                                        }}>
                                        Replying to{' '}
                                        {replyComment.userID === user.id
                                            ? 'yourself'
                                            : replyToName}
                                    </Text>
                                    <TouchableOpacity
                                        style={{
                                            ...Styles.exitReply,
                                            marginLeft: 'auto',
                                        }}
                                        onPress={handleClearReply}>
                                        <MaterialCommunityIcons
                                            name="close-circle"
                                            size={22}
                                            color={colors.navSubProminent}
                                            style={{
                                                marginLeft: 0,
                                                marginRight: 2,
                                            }}
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text
                                    style={{
                                        ...baseText,
                                        color: colors.textFaded2,
                                        fontSize: 14,
                                        fontWeight: '400',
                                        marginLeft: 2,
                                        color: '#AAAEB2',
                                        borderWidth: 0,
                                        borderColor: 'red',
                                    }}>
                                    {replyCommentText}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                <View
                    style={{
                        ...Styles.commentContainer,
                        paddingBottom: 10,
                    }}>
                    {false ?? (
                        <TouchableOpacity
                            style={{
                                borderColor: 'blue',
                                borderWidth: 0,
                                top: 3.0,
                            }}
                            disabled={false}
                            onPress={toggleShowProfileModal}>
                            <FastImage
                                source={{
                                    uri: getResizedImageUrl({
                                        origUrl: identityID
                                            ? identityProfileImgUrl ||
                                              images.personaDefaultProfileUrl
                                            : user.profileImgUrl ||
                                              images.userDefaultProfileUrl,
                                        height: Styles.personImage.height,
                                        width: Styles.personImage.width,
                                    }),
                                }}
                                style={{
                                    ...Styles.personImage,
                                    top: -2,
                                }}
                            />
                        </TouchableOpacity>
                    )}
                    {media.length > 0 ? (
                        <FlatList
                            horizontal
                            style={{width: 40, height: 40}}
                            data={media}
                            renderItem={({item, index}) => {
                                const isVideo =
                                    media[index].uri.slice(-3) === 'mp4';
                                return (
                                    <TouchableOpacity
                                        onPress={() => clearMediaState(index)}>
                                        {isVideo ? (
                                            <Video
                                                source={{uri: item.uri}}
                                                style={{
                                                    marginLeft: 12,
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 5,
                                                }}
                                                resizeMode="cover"
                                                repeat={true}
                                                paused={true}
                                            />
                                        ) : (
                                            <FastImage
                                                source={{
                                                    uri: getResizedImageUrl({
                                                        origUrl: item.uri,
                                                        width: 40,
                                                        height: 40,
                                                    }),
                                                }}
                                                style={{
                                                    marginLeft: 12,
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 5,
                                                }}
                                            />
                                        )}

                                        <View
                                            style={{
                                                position: 'absolute',
                                                marginLeft: 2,
                                                backgroundColor:
                                                    colors.seperatorLineColor,
                                                borderRadius: 10,
                                                left: 39,
                                                top: -5,
                                                width: 16,
                                                height: 16,
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}>
                                            <Icon
                                                color={colors.textFaded}
                                                name={'x'}
                                                size={12}
                                                style={{marginLeft: 1}}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    ) : (
                        <>
                            {progressIndicator === 'busy' && (
                                <View style={Styles.loadingIndicator}>
                                    <ActivityIndicator
                                        size="large"
                                        color={colors.text}
                                    />
                                </View>
                            )}
                            {!expandText && showImageOptions && (
                                <View style={{flexDirection: 'row'}}>
                                    <TouchableOpacity
                                        hitSlop={{
                                            left: -7,
                                            right: 7,
                                            bottom: 6,
                                            top: 6,
                                        }}
                                        onPress={() => chooseMedia('photo')}>
                                        <Icon
                                            name="image"
                                            size={22}
                                            style={{
                                                marginStart: 15,
                                                marginTop: 0,
                                            }}
                                            color={
                                                media.length &&
                                                mediaChoice === 'selectPhoto'
                                                    ? colors.actionText
                                                    : colors.textFaded2
                                            }
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        hitSlop={{
                                            left: -7,
                                            right: 7,
                                            bottom: 6,
                                            top: 6,
                                        }}
                                        onPress={() => {
                                            newMedia('video');
                                        }}>
                                        <Icon
                                            name="video"
                                            size={22}
                                            style={{
                                                marginStart: 15,
                                                marginTop: 0,
                                            }}
                                            color={
                                                media.length &&
                                                mediaChoice === 'selectPhoto'
                                                    ? colors.actionText
                                                    : colors.textFaded2
                                            }
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        hitSlop={{
                                            left: -7,
                                            right: 7,
                                            bottom: 6,
                                            top: 6,
                                        }}
                                        onPress={() => newMedia('photo')}>
                                        <Icon
                                            name="camera"
                                            size={22}
                                            style={{
                                                marginTop: 0,
                                                marginStart: 15,
                                            }}
                                            color={
                                                media.length &&
                                                mediaChoice === 'takePhoto'
                                                    ? colors.actionText
                                                    : colors.textFaded2
                                            }
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                            {expandText && (
                                <TouchableOpacity
                                    hitSlop={{
                                        left: 5,
                                        right: 5,
                                        bottom: 5,
                                        top: 5,
                                    }}
                                    onPress={() => {
                                        // LayoutAnimation.configureNext(
                                        //     LayoutAnimation.Presets
                                        //         .easeInEaseOut,
                                        // );
                                        setExpandText(false);
                                    }}
                                    style={{marginLeft: 7}}>
                                    <Icon
                                        name={'chevron-right'}
                                        size={20}
                                        color={colors.textFaded2}
                                    />
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                    <TextInput
                        ref={inputRef}
                        onFocus={onFocusTextInput}
                        onBlur={onBlurTextInput}
                        multiline={true}
                        style={{
                            ...baseText,
                            ...Styles.textInput,
                            fontFamily: fonts.system,
                            marginLeft: expandText
                                ? media.length
                                    ? 15
                                    : 4
                                : 15,
                            marginRight: expandText ? 0 : 10,
                            maxHeight: 450,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        placeholder={'Write a message'}
                        placeholderTextColor={colors.maxFaded}
                        editable={true}
                        clearTextOnFocus={false}
                        onChange={onChange}
                        onChangeText={onChangeText}
                        onSelectionChange={onSelectionChange}
                        spellCheck={true}
                        keyboardAppearance="dark"
                        value={newComment}
                        maxLength={8200}
                    />
                    {/* Submit Button */}
                    <TouchableOpacity
                        hitSlop={{
                            left: 10,
                            right: 7,
                            bottom: 6,
                            top: 6,
                        }}
                        style={Styles.postAction}
                        onPress={() => submitComment(newComment)}
                        disabled={disabledSubmit}>
                        <View style={Styles.sendIcon}>
                            {editComment ? (
                                <Icon
                                    name="check"
                                    size={24}
                                    color={
                                        disabledSubmit
                                            ? colors.personaDarkBlue
                                            : 'white'
                                    }
                                />
                            ) : (
                                <Ionicons
                                    name="send"
                                    size={24}
                                    color={
                                        disabledSubmit
                                            ? colors.personaDarkBlue
                                            : 'white'
                                    }
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const Styles = StyleSheet.create({
    loadingIndicator: {
        marginStart: 12,
    },
    exitReply: {
        width: 24,
        height: 24,
        // borderRadius: 30,
        // marginRight: 10,
        // marginLeft: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyBox: {
        flex: 1,
        flexDirection: 'column',
        // padding: 5,
        // borderWidth: 1,
        // borderColor: 'red',
        // padding: 2,
    },
    replyRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignContent: 'center',
        padding: 10,
        paddingTop: 7,
        paddingBottom: 8,
        borderWidth: 0,
        borderColor: 'red',
    },
    sendIcon: {
        width: 30,
        height: 25,
        flexDirection: 'column',
        alignContent: 'center',
        justifyContent: 'center',
    },
    commentContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 0,
        paddingTop: 0,
        paddingLeft: 0,
        paddingBottom: 0,
        alignItems: 'center',
        borderWidth: 0,
        borderColor: 'white',
    },
    postAction: {
        marginLeft: 10,
        marginRight: 8,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 5,
        paddingRight: 5,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: 'blue',
        borderWidth: 0,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    personImage: {
        top: -3,
        width: 30,
        height: 30,
        borderRadius: 30,
        borderColor: colors.timeline,
        borderWidth: 1,
    },
    newCommentTimeline: {
        flex: 1,
        marginTop: -9,
        ...palette.timeline.line,
        marginLeft:
            palette.timeline.line.marginLeft -
            palette.post.marginLeft -
            palette.post.borderLeftWidth -
            15,
        backgroundColor: colors.timeline,
    },
    quotingTimeline: {
        marginTop: -11,
        marginRight: 50,
        ...palette.timeline.line,
        backgroundColor: colors.timeline,
        marginBottom: -10,
    },
    quotingTimelineFeedIn: {
        marginTop: 13,
        marginRight: 50,
        marginBottom: -10,
        marginLeft: palette.timeline.line.marginLeft,
        position: 'absolute',
        width: 46,
        height: 50,
        zIndex: 2,
        borderTopLeftRadius: 20,
        borderLeftWidth: 0.4,
        borderTopWidth: 0.4,
        borderLeftColor: colors.timeline,
        borderTopColor: colors.timeline,
    },
    threadTimelineEnd: {
        position: 'absolute',
        left: palette.timeline.line.marginLeft + 0.8 - 8 / 2,
        width: 8,
        height: 8,
        borderRadius: 8,
        borderWidth: 2,
        top: 7,
        borderColor: palette.timeline.line.backgroundColor,
    },
    textInput: {
        color: 'white',
        fontSize: 17,
        flex: 6,
        backgroundColor: colors.seperatorLineColor,
        color: colors.textBright,
        padding: 7,
        paddingLeft: 12,
        borderRadius: 14,
        paddingRight: 10,
    },

    centeredView: {
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
        borderColor: 'yellow',
        borderWidth: 0,
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxHeight: Dimensions.get('window').height * 0.75,
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
});
