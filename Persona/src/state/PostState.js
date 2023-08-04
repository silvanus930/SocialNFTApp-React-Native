import React from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {getTimeStamp} from 'actions/constants';
import {vanillaPersona} from 'state/PersonaState';
import {clog, cwarn, cerror} from 'utils/log';
const CUSTOM_LOG_WARN_HEADER = '!! state/PostState';
const log = (...args) =>
    global.LOG_STATE_POST && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_STATE_POST && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);

// TODO loop through to set up markup etc.
// WARNING: If you change these values you may need to update them in
// `functions` as well
export const POST_TYPE_MEDIA = 'media';
export const POST_TYPE_COLLABORATOR = 'collaborator';
export const POST_TYPE_ARTIST = 'artist';
export const POST_TYPE_COMMENT = 'comment';
export const POST_TYPE_CHAT = 'chat';
export const POST_TYPE_INVITE = 'invite';
export const POST_TYPE_PROPOSAL = 'proposal';
export const POST_TYPE_TRANSFER = 'transfer';
export const POST_TYPE_EVENT = 'event';

export const postTypes = [
    POST_TYPE_MEDIA, // images.addMediaPost images.addMediaPostSelected
    POST_TYPE_COLLABORATOR, // images.addCollaboratorPost images.addCollaboratorPostSelected
    POST_TYPE_ARTIST, // images.addArtistPost images.addArtistPostSelected
    POST_TYPE_COMMENT,
    POST_TYPE_CHAT,
    POST_TYPE_INVITE,
    POST_TYPE_PROPOSAL,
    POST_TYPE_TRANSFER,
    POST_TYPE_EVENT,
];

export const ProposalTypes = {
    Binary: 'Binary',
};

export const BinaryProposalOptions = {
    for: 0,
    against: 1,
    abstain: 2,
};

export const BinaryProposalOptionsDisplay = {
    0: 'for',
    1: 'against',
    2: 'abstain',
};

export const ProposalAuthorizedVotersTypes = {
    authors: 'authors',
    authorsAndFollowers: 'authorsAndFollowers',
    anyone: 'anyone',
};

export const POST_MEDIA_TYPE_AUDIO = 'audio';
export const POST_MEDIA_TYPE_VIDEO = 'video';
export const POST_MEDIA_TYPE_GALLERY = 'gallery';
export const POST_MEDIA_TYPE_RICHTEXT = 'richtext';
export const POST_MEDIA_TYPE_FILE = 'file';

export const postMediaTypes = [
    POST_MEDIA_TYPE_AUDIO,
    POST_MEDIA_TYPE_RICHTEXT,
    POST_MEDIA_TYPE_FILE,
    POST_MEDIA_TYPE_GALLERY,
];

export const POST_EMPTY = 0;
export const POST_SUBMITTING = 1;
export const POST_SUBMITTED = 2;

export const DEFAULT_POST_TYPE = POST_TYPE_MEDIA;
export const DEFAULT_POST_MEDIA_TYPE = POST_MEDIA_TYPE_GALLERY;

const vanillaAudioRecorderState = {
    audioPlayerStarted: false,
    recordSecs: 0,
    recordTime: '00:00:00',
    currentPositionSec: 0,
    currentDurationSec: 0,
    playTime: '00:00:00',
    duration: '00:00:00',
};
const PostStateContext = React.createContext({
    new: false,
    edit: false,
    remix: false,
    init: true,
    visible: false,
    event: false,
    csetState: () => {},
    posted: false,
    setPosted: () => {},
    setNew: () => {},
    setEdit: () => {},
    addMedia: POST_EMPTY,
    setAddMedia: () => {},
    personaID: '',
    communityID: '',
    post: null,
    setPersonaID: () => {},
    setPost: () => {},
    inviteID: '',
    videoIcon: null,
    writeIcon: null,
    photoIcon: null,
    audioIcon: null,
    audioRecorder: vanillaAudioRecorderState,
    audioManager: null,
    deleted: false,
});

export {PostStateContext};

export const vanillaPost = {
    invitedUsers: {},
    galleryUris: [],
    deleted: false,
    showOnlyInStaffHome: false,
    showOnlyInStaffStudio: false,
    anonymous: false,
    publicCollabBar: false,
    type: DEFAULT_POST_TYPE,
    mediaType: '',
    title: '',
    identityID: '',
    identityProfileImgUrl: '',
    identityName: '',
    identityBio: '',
    userName: '',
    mediaLoop: true,
    mediaUrl: '',
    audioUrl: '',
    mediaMuted: false,
    remixPostID: '',
    remixPersonaID: '',
    remixCommentIDList: [],
    fileUris: [],
    mediaRotate: false,
    text: '',
    publishDate: '',
    editDate: '',
    userID: '',
    inviteID: '',
    promise: false,
    promiseState: '',
    promiseSatisfied: false,
    userProfileImgUrl: '',
    personaProfileImgUrl: '',
    subPersonaID: '',
    subPersona: Object.assign({}, JSON.parse(JSON.stringify(vanillaPersona))),
    seen: {},
    present: [],
    threadIDs: {},
    proposal: {},
    showInCommunityChat: true,
};

export default class PostState extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            personaID: '',
            communityID: '',
            post: JSON.parse(JSON.stringify(vanillaPost)),
            new: false,
            visible: false,
            event: false,
            edit: false,
            init: true,
            draft: false,
            videoIcon: null,
            photoIcon: null,
            writeIcon: null,
            audioRecorder: vanillaAudioRecorderState,
            audioManager: null,
            addMedia: POST_EMPTY,
        };
    }

    setNew = n => {
        this.setState({new: n});
    };

    setEdit = e => {
        this.setState({edit: e});
    };

    setInit = i => {
        this.setState({init: i});
    };

    setPostID = id => {
        this.setState({
            pid: id,
            post: Object.assign(this.state.post, {pid: id}),
        });
    };

    setPosted = p => {
        this.setState({posted: p});
    };

    setAddMedia = e => {
        this.setState({addMedia: e});
    };

    setVisible = e => {
        this.setState({visible: e});
    };

    setPersonaID = p => {
        this.setState({
            personaID: p,
            post: Object.assign(this.state.post, {personaID: p}),
        });
    };

    addFile = f => {
        let pushedFileUris = this.state.post.fileUris.push(f);
        let newFileUris = this.state.post.fileUris.includes(f)
            ? this.state.post.fileUris
            : Object.assign([], pushedFileUris);
        this.setPost({fileUris: newFileUris});
    };

    setPost = p => {
        this.setState({post: Object.assign(this.state.post, p)});
    };

    setPostSubPersona = p => {
        this.setPost({
            subPersona: Object.assign(this.state.post.subPersona, p),
        });
    };

    setPostSubPersonaID = pn => {
        this.setPostSubPersona({personaID: pn});
    };

    setPostSubPersonaName = pn => {
        this.setPostSubPersona({name: pn});
    };

    setPostSubPersonaBio = pb => {
        this.setPostSubPersona({bio: pb});
    };

    setPostSubPersonaProfileImgUrl = pb => {
        this.setPostSubPersona({profileImgUrl: pb});
    };

    setPostType = pt => {
        this.setPost({type: pt}); //re-initialize PostCreationScreen
    };

    setPostMediaType = mt => {
        this.setPost({mediaType: mt});
    };

    setPostProposal = proposal => {
        this.setPost({proposal});
    };

    setAudioManager = am => {
        this.setState({audioManager: am});
    };

    setAudioRecorder = ar => {
        this.setState(Object.assign(this.state.audioRecorder, ar));
    };

    setAudioRecorderPlayerStarted = ps => {
        this.setAudioRecorder({playerStarted: ps});
    };

    setAudioRecorderRecordSecs = rs => {
        this.setAudioRecorder({recordSecs: rs});
    };

    setAudioRecorderRecordTime = rt => {
        this.setAudioRecorder({recordTime: rt});
    };

    setAudioRecorderCurrentPositionSec = cps => {
        this.setAudioRecorder({currentPositionSec: cps});
    };
    setAudioRecorderCurrentDurationSec = cds => {
        this.setAudioRecorder({currentDurationSec: cds});
    };
    setAudioRecorderPlayTime = pt => {
        this.setAudioRecorder({playTime: pt});
    };
    setAudioRecorderDuration = d => {
        this.setAudioRecorder({duration: d});
    };

    setPhotoIcon = vi => {
        this.setState({photoIcon: vi});
    };

    setVideoIcon = vi => {
        this.setState({videoIcon: vi});
    };

    setAudioIcon = vi => {
        this.setState({audioIcon: vi});
    };

    setWriteIcon = vi => {
        this.setState({writeIcon: vi});
    };

    setPostAnonymous = a => {
        this.setPost({anonymous: a});
    };

    setPostInviteID = a => {
        this.setPost({inviteID: a});
    };

    setPostTitle = pt => {
        this.setPost({title: pt});
    };

    setPostMediaUrl = iu => {
        this.setPost({mediaUrl: iu});
    };

    setPostUserID = un => {
        this.setPost({userID: un});
    };

    setPostUserName = un => {
        this.setPost({userName: un});
    };

    setPostUserProfileImgUrl = un => {
        if (typeof un === 'undefined') {
            this.setPost({userProfileImgUrl: ''});
        } else {
            this.setPost({userProfileImgUrl: un});
        }
    };

    setPostPersonaProfileImgUrl = un => {
        this.setPost({personaProfileImgUrl: un});
    };

    setPostText = pt => {
        this.setPost({text: pt});
    };

    setPostPromise = p => {
        this.setPost({promise: p});
    };

    setPostPromiseSatisfied = ps => {
        this.setPost({promiseSatisfied: ps});
    };

    validatePost = (small = false, textContext = null) => {
        //log('small is', small);
        //log('in validatePost, subPersona:', this.state.post.subPersona);
        let titleToTest =
            this.state.post.subPersonaID ||
            this.state.post.subPersonaID ||
            this.state.post.mediaUrl ||
            this.state.post.galleryUris?.length ||
            this.state.post.text
                ? 'NOTITLE'
                : this.state.post.title;
        let textToTest =
            this.state.post.subPersonaID || this.state.post.subPersona?.name
                ? 'PERSONA'
                : this.state.post.text; //textContext ? textContext.post.text : this.state.post.text;
        const e = [];
        /*log(
      'eval conditional',
      small ||
        this.state.post.title ||
        (this.state.post.mediaUrl && titleToTest),
    );*/
        !small && !titleToTest && e.push('\nYour post needs a title!');
        !small &&
            !(
                textToTest ||
                this.state.post.mediaUrl ||
                this.state.post.galleryUris?.length
            ) &&
            e.push('\nYour post needs a caption and/or media!');
        !small &&
            this.state.post.type === POST_TYPE_ARTIST &&
            !(this.state.post.subPersona && this.state.post.subPersona.name) &&
            e.push('\n Personas on posts need a name!');
        const header = e.length ? '~ sorry\n' : '';
        //log('errorMessage', header.concat(e));
        return {
            valid: !e.length,
            errorMessage: header.concat(e),
        };
    };

    publishTimestamp = (subPersona = false) => {
        if (!subPersona) {
            this.state.post.publishDate = getTimeStamp();
        } else {
            this.state.post.subPersona.publishDate = getTimeStamp();
        }
        log(
            'publishTimestamp',
            subPersona
                ? this.state.post.subPersona.publishDate
                : this.state.post.publishDate,
        );
        return subPersona
            ? this.state.post.subPersona.publishDate
            : this.state.post.publishDate;
    };

    editTimestamp = (subPersona = false) => {
        if (!subPersona) {
            this.state.post.editDate = getTimeStamp();
        } else {
            this.state.post.subPersona.editDate = getTimeStamp();
        }
        log(
            'editTimestamp',
            subPersona
                ? this.state.post.subPersona.editDate
                : this.state.post.editDate,
        );
        return subPersona
            ? this.state.post.subPersona.editDate
            : this.state.post.editDate;
    };

    async pushSubPersonaStateToFirebaseAsync(pid = null, del = true) {
        if (!pid && this.post.subPersonaID) {
            pid = this.post.subPersonaID;
        }

        delete this.post.subPersona.personaID; // don't store pid in firestore
        delete this.post.subPersona.pid;

        log('pushSubPersonaStateToFirebaseAsync pid->', pid);
        log(
            'pushSubPersonaStateToFirebaseAsync subPersona->',
            this.post.subPersona,
        );

        if (!this.post.subPersona.authors.includes(auth().currentUser.uid)) {
            this.post.subPersona.authors.push(auth().currentUser.uid);
        }

        if (!this.post.subPersona.admins.includes(auth().currentUser.uid)) {
            this.post.subPersona.admins.push(auth().currentUser.uid);
        }

        if (this.new) {
            console.log('taking the new conditional in PostState');
            // set in PersonaCreationScreen
            //this.publishTimestamp(true);
            this.post.subPersona.publishDate = getTimeStamp();
            this.post.subPersona.editDate = this.post.subPersona.publishDate;
        } else if (this.post.publishDate) {
            // set in
            //this.editTimestamp(true);
            this.post.subPersona.editDate = getTimeStamp();
        } else {
            throw Error(
                'detected neither a new session or an existing publishDate, indicating an edit session',
            ); // we should not be here
        }

        const personas = firestore().collection('personas');
        if (!pid && !this.post.subPersonaID) {
            const docRef = await personas.add(this.post.subPersona); // TODO error handling
            pid = docRef.id;
        } else if (this.communityID !== this.personaID) {
            const id = pid ? pid : this.post.subPersonaID;
            log('pushSubPersonaStateToFirebaseAsync set pid->', id);
            personas
                .doc(id)
                .set(this.post.subPersona)
                .catch(err => {
                    warn(
                        'firestore().collection(personas) errored',
                        err.toString(),
                    );
                    alert(err.toString());
                });
        }
        log('pushSubPersonaStateToFirebaseAsync returning pid->', pid);

        if (!del) {
            this.post.subPersona.personaID = pid;
        }
        return pid;
    }

    async pushDraftStateToFirebaseAsync(draftID) {
        if (!draftID) {
            alert('no valid draftID in pushDraftStateToFirebaseAsync');
            return;
        }
        delete this.post.pid; // don't store pid in firestore
        delete this.post.posted;

        console.log(
            'checking subpersona is pushPosTStateToFirebaseAsync',
            JSON.stringify(this.post.subPersona),
        );
        const subPersonaID = this.post.subPersona?.personaID;

        if (this.post.subPersona) {
            delete this.post.subPersona.personaID;
        }

        if (!this.post.userProfileImgUrl) {
            this.post.userProfileImgUrl = '';
        }

        if (this.post.subPersona && !this.post.subPersona.userProfileImgUrl) {
            this.post.subPersona.userProfileImgUrl = '';
        }

        log('pushPostStateToFirebase post->', this.post);

        if (this.new) {
            console.log('detected a cry for help!');
            //this.publishTimestamp();
            this.post.publishDate = getTimeStamp();
            this.post.editDate = this.post.publishDate;
            console.log('the cry:', this.post.publishDate);
        }

        //this.editTimestamp();
        this.post.editDate = getTimeStamp();

        if (!this.post.publishDate) {
            console.log('detected no publishDate!');
            //this.publishTimestamp();
            this.post.publishDate = getTimeStamp();
            this.post.editDate = this.post.publishDate;
            console.log('the lack of publishDate:', this.post.publishDate);
        }

        console.log(
            `pushPostState: post.publishDate->${this.post.publishDate} post.editdate->${this.post.editDate}`,
        );

        const draftRef = firestore().collection('drafts').doc(draftID);

        const saveSubPersona = JSON.parse(JSON.stringify(this.post.subPersona));
        delete this.post.subPersona;

        const safePost = JSON.parse(JSON.stringify(this.post, undefined, 4));
        safePost.publishDate = this.post.publishDate;
        safePost.editDate = this.post.editDate;

        draftRef.set(safePost, {merge: true}).catch(err => {
            error('firestore().collection(drafts) errored', err.toString());
            alert(err.toString());
        });

        this.post.subPersona = saveSubPersona;
        // store pid in edit
        if (subPersonaID) {
            this.post.subPersona.personaID = subPersonaID;
        }

        return draftID;
    }
    async pushPostStateToFirebaseAsync(pid = null, del = true) {
        if (!pid && this.post.pid) {
            pid = this.post.pid;
        }
        delete this.post.pid; // don't store pid in firestore
        delete this.post.posted;

        console.log(
            'checking subpersona is pushPosTStateToFirebaseAsync',
            JSON.stringify(this.post.subPersona),
        );
        const subPersonaID = this.post.subPersona?.personaID;

        if (this.post.subPersona) {
            delete this.post.subPersona.personaID;
        }

        if (!this.post.userProfileImgUrl) {
            this.post.userProfileImgUrl = '';
        }

        if (this.post.subPersona && !this.post.subPersona.userProfileImgUrl) {
            this.post.subPersona.userProfileImgUrl = '';
        }

        log('pushPostStateToFirebase pid->', pid);
        log('pushPostStateToFirebase post->', this.post);

        if (this.new) {
            console.log('detected a cry for help!');
            //this.publishTimestamp();
            this.post.publishDate = getTimeStamp();
            this.post.editDate = this.post.publishDate;
            console.log('the cry:', this.post.publishDate);
        }

        //this.editTimestamp();
        this.post.editDate = getTimeStamp();

        if (!this.post.publishDate) {
            console.log('detected no publishDate!');
            //this.publishTimestamp();
            this.post.publishDate = getTimeStamp();
            this.post.editDate = this.post.publishDate;
            console.log('the lack of publishDate:', this.post.publishDate);
        }

        console.log(
            `pushPostState: post.publishDate->${this.post.publishDate} post.editdate->${this.post.editDate}`,
        );

        const personaPosts =
            this.communityID === this.personaID
                ? firestore()
                      .collection('communities')
                      .doc(this.personaID)
                      .collection('posts')
                : firestore()
                      .collection('personas')
                      .doc(this.personaID)
                      .collection('posts');

        /*
    const postsRef = await personaPosts.where('deleted', '==', 'false').get();
    if (postsRef.docs.length === 0) {
      this.post.firstPost = true;
    }
    */

        const saveSubPersona = JSON.parse(JSON.stringify(this.post.subPersona));
        delete this.post.subPersona;

        const safePost = JSON.parse(JSON.stringify(this.post, undefined, 4));
        safePost.editDate = getTimeStamp();
        safePost.publishDate = safePost.editDate;
        console.log(
            'RIGHT BEFORE PUSHING POST TO FB publishDate->',
            safePost.publishDate,
            'editDate->',
            safePost.editDate,
        );
        if (!pid) {
            const docRef = await personaPosts.add(safePost).catch(err => {
                error(
                    'firestore().collection(personas) errored',
                    err.toString(),
                );
                alert(err.toString());
            }); // TODO error handling

            pid = docRef.id;
        } else {
            personaPosts
                .doc(pid)
                .set(safePost, {merge: true})
                .catch(err => {
                    error(
                        'firestore().collection(personas) errored',
                        err.toString(),
                    );
                    alert(err.toString());
                });
        }
        this.post.subPersona = saveSubPersona;
        // store pid in edit
        this.post.pid = pid;
        if (subPersonaID) {
            this.post.subPersona.personaID = subPersonaID;
        }

        console.log(
            'about to set personaPosts collection!!!!!!',
            this.personaID === this.communityID,
            'this.personaID',
            this.personaID,
            'this.communityID',
            this.communityID,
        );
        const personaPosts_edits =
            this.personaID === this.communityID
                ? firestore()
                      .collection('communities')
                      .doc(this.personaID)
                      .collection('posts')
                      .doc(pid)
                      .collection('edits')
                : firestore()
                      .collection('personas')
                      .doc(this.personaID)
                      .collection('posts')
                      .doc(pid)
                      .collection('edits');

        // retreive when we build edit history
        const editID = personaPosts_edits.add(safePost);

        if (del) {
            delete this.post.pid;
            if (subPersonaID && this.post.subPersona) {
                delete this.post.subPersona.personaID;
            }
        }

        return pid;
    }

    realizeAll() {
        if (this.edit) {
            //fill in missing fields

            if (!this.post.type) {
                this.post.type = POST_TYPE_MEDIA;
            }

            if (!this.post.mediaType) {
                this.post.mediaType = POST_MEDIA_TYPE_GALLERY;
            }

            if (!this.post.anonymous) {
                this.post.anonymous = false;
            }

            if (!this.post.mediaUrl) {
                this.post.mediaUrl = this.post.imgUrl ? this.post.imgUrl : '';
            }

            if (!this.post.editDate) {
                this.post.editDate = this.post.publishDate;
            }

            if (!this.addMedia) {
                this.addMedia = POST_EMPTY;
            }
        }
    }
    updateFromTextContext(textContext) {
        //this.setPost({text: textContext.post.text, title: textContext.post.title});
    }
    csetState = state => {
        this.setState(state);
    };
    restoreVanilla = obj => {
        const newPost = JSON.parse(JSON.stringify(vanillaPost));
        const newAudioRecorderState = JSON.parse(
            JSON.stringify(vanillaAudioRecorderState),
        );
        this.setState({
            new: obj?.sNew ? true : false,
            edit: obj?.sEdit ? true : false,
            init: obj?.sInit ? true : false,
            remix: false,
            event: false,
            draft: false,
            posted: false,
            personaID: '',
            post: Object.assign(newPost, obj?.post ? obj.post : {}),
            videoIcon: null,
            audioIcon: null,
            writeIcon: null,
            addMedia: POST_EMPTY,
            audioRecorder: newAudioRecorderState,
        });
        //this.setAudioManager(null);
    };
    render() {
        console.log('RENDER PostState', this.state.anonymous);
        return (
            <PostStateContext.Provider
                value={{
                    new: this.state.new,
                    edit: this.state.edit,
                    remix: this.state.remix,
                    init: this.state.init,
                    event: this.state.event,
                    draft: this.state.draft,
                    addMedia: this.state.addMedia,
                    setAddMedia: this.setAddMedia,
                    setNew: this.setNew,
                    setEdit: this.setEdit,
                    setInit: this.setInit,
                    publishDate: this.state.publishDate,
                    editDate: this.state.editDate,
                    personaID: this.state.personaID,
                    communityID: this.state.communityID,
                    setPersonaID: this.setPersonaID,
                    posted: this.state.posted,
                    setPosted: this.setPosted,
                    inviteID: this.state.inviteID,
                    setInviteID: this.setInviteID,
                    post: this.state.post,
                    setPost: this.setPost,
                    setPostID: this.setPostID,
                    setPostAnonymous: this.setPostAnonymous,
                    setPostType: this.setPostType,
                    setPostTitle: this.setPostTitle,
                    setPostText: this.setPostText,
                    setPostPromise: this.setPostPromise,
                    setPostPromiseSatisfied: this.setPostPromiseSatisfied,
                    setPostUserID: this.setPostUserID,
                    setPostUserName: this.setPostUserName,
                    setPostUserProfileImgUrl: this.setPostUserProfileImgUrl,
                    setPostPersonaProfileImgUrl:
                        this.setPostPersonaProfileImgUrl,
                    setPostMediaUrl: this.setPostMediaUrl,
                    setPostMediaType: this.setPostMediaType,
                    setPostSubPersona: this.setPostSubPersona,
                    setPostSubPersonaBio: this.setPostSubPersonaBio,
                    setPostSubPersonaName: this.setPostSubPersonaName,
                    setPostSubPersonaID: this.setPostSubPersonaID,
                    setPostSubPersonaProfileImgUrl:
                        this.setPostSubPersonaProfileImgUrl,
                    pushPostStateToFirebaseAsync:
                        this.pushPostStateToFirebaseAsync,
                    pushDraftStateToFirebaseAsync:
                        this.pushDraftStateToFirebaseAsync,
                    pushSubPersonaStateToFirebaseAsync:
                        this.pushSubPersonaStateToFirebaseAsync,
                    restoreVanilla: this.restoreVanilla,
                    publishTimestamp: this.publishTimestamp,
                    editTimestamp: this.editTimestamp,
                    photoIcon: this.state.photoIcon,
                    videoIcon: this.state.videoIcon,
                    writeIcon: this.state.writeIcon,
                    audioIcon: this.state.audioIcon,
                    setAudioIcon: this.setAudioIcon,
                    setPhotoIcon: this.setPhotoIcon,
                    setVideoIcon: this.setVideoIcon,
                    setWriteIcon: this.setWriteIcon,
                    realizeAll: this.realizeAll,
                    audioRecorder: this.state.audioRecorder,
                    setAudioRecorder: this.setAudioRecorder,
                    setAudioRecorderPlayerStarted:
                        this.setAudioRecorderPlayerStarted,
                    setAudioRecorderRecordSecs: this.setAudioRecorderRecordSecs,
                    setAudioRecorderRecordTime: this.setAudioRecorderRecordTime,
                    setAudioRecorderCurrentPositionSec:
                        this.setAudioRecorderCurrentPositionSec,
                    setAudioRecorderCurrentDurationSec:
                        this.setAudioRecorderCurrentDurationSec,
                    setAudioRecorderPlayTime: this.setAudioRecorderPlayTime,
                    setAudioRecorderDuration: this.setAudioRecorderDuration,
                    audioManager: this.state.audioManager,
                    setAudioManager: this.setAudioManager,
                    updateFromTextContext: this.updateFromTextContext,
                    validatePost: this.validatePost,
                    addFile: this.addFile,
                    csetState: this.csetState,
                    setPostProposal: this.setPostProposal,
                    visible: this.state.visible,
                    setVisible: this.setVisible,
                }}>
                {this.props.children}
            </PostStateContext.Provider>
        );
    }
}
