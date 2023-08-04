import React from 'react';
import {vanillaPost} from 'state/PostState';
import firestore from '@react-native-firebase/firestore';
import {getTimeStamp} from 'actions/constants';
import auth from '@react-native-firebase/auth';
import {clog, cwarn, cerror} from 'utils/log';
import md5 from 'utils/md5';

const CUSTOM_LOG_WARN_HEADER = '!! state/InviteState';
const log = (...args) =>
    global.LOG_STATE_INVITE && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_STATE_INVITE && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);

export const vanillaChat = Object.assign(
    {},
    JSON.parse(JSON.stringify(vanillaPost)),
);

const stringify = require('json-stringify-safe');

const InviteStateContext = React.createContext({
    init: true,
    new: false,
    edit: false,
    setNew: () => {},
    csetState: () => {},
    setEdit: () => {},
    subPersonaId: '',
    setSubPersonaId: () => {},
    personaID: '',
    setPersonaID: () => {},
    postID: '',
    setPostID: () => {},
    posted: false,
    setPosted: () => {},
    invitees: [],
    publishDate: '',
    editDate: '',
    chatMessages: [],
    setChatMessages: () => {},
    inviteID: '',
    setInviteID: () => {},
});

export {InviteStateContext};
export const vanillaInviteState = {
    init: true,
    new: false,
    edit: false,
    posted: false,
    personaID: '',
    subPersonaID: '',
    postID: '',
    inviteID: '',
    invitees: [],
    publishDate: '',
    editDate: '',
    chatMessages: [],
};

export default class InviteState extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = Object.assign(
            {},
            JSON.parse(JSON.stringify(vanillaInviteState)),
        );
    }

    setNew = n => {
        log('setNew', n);
        this.setState({new: n});
    };

    setInit = n => {
        log('setInit', n);
        this.setState({init: n});
    };

    setEdit = e => {
        log('setEdit', e);
        this.setState({edit: e});
    };

    setInviteID = p => {
        log('setInviteID', p);
        this.setState({inviteID: p});
    };

    setPersonaID = p => {
        log('setPersonaID', p);
        this.setState({personaID: p});
    };

    setSubPersonaID = p => {
        log('setSubPersonaID', p);
        this.setState({subPersonaID: p});
    };

    setPosted = p => {
        log('setPosted', p);
        this.setState({posted: p});
    };

    setPostID = p => {
        log('setPostID', p);
        this.setState({postID: p});
    };

    setInvitees = pn => {
        //log('setInvitees', pn);
        this.setState({invitees: pn});
    };

    setChatMessages = pn => {
        log('setChatMessages', pn);
        this.setState({chatMessages: pn});
    };

    publishTimestamp = () => {
        const newPublishDate = getTimeStamp();
        this.setState({publishDate: newPublishDate});
        log('publishTimestamp', this.state.publishDate);
        return this.state.publishDate;
    };

    editTimestamp = () => {
        const newEditDate = getTimeStamp();
        this.setState({editDate: newEditDate});
        log('editTimestamp', this.state.editDate);
        return this.state.editDate;
    };

    getChatID = async (authors, invitees) => {
        const attendees = Object.assign([], authors);

        invitees.forEach(inv => {
            log(`checking if ${inv.uid} is in ${authors.map(a => a.uid)}`);
            if (!authors.map(a => a.uid).includes(inv.uid)) {
                attendees.push(inv);
            }
        });
        const chatID = md5(
            this.state.postID.concat(
                attendees
                    .sort((a, b) => a?.uid.localeCompare(b?.uid, 'en'))
                    .map(a => a.uid),
            ),
        );
        return chatID;
    };

    pushChatStateToFirebaseAsync = async (
        authors,
        invitees,
        personaID,
        postID,
        inChatID = null,
    ) => {
        console.log(
            'pushChatStateToFirebaseAsync authors->',
            authors,
            'invitees->',
            invitees,
            'personaID->',
            personaID,
            'postID->',
            postID,
            'inChatID->',
            inChatID,
        );
        if (personaID) {
            this.state.personaID = personaID;
        }
        if (postID) {
            this.state.postID = postID;
        }

        const attendees = Object.assign([], authors);
        invitees.forEach(inv => {
            if (!authors.map(a => a.uid).includes(inv.uid)) {
                attendees.push(inv);
            }
        });

        if (!this.state.postID) {
            alert(
                'trying to create a chatID without a postID!\ntry leaving post creation and coming back inside! (to be fixed ASAP)',
            );
            throw Error('halt! trying to create a chatID without a postID!');
        }
        const chatID =
            inChatID ||
            md5(
                this.state.postID.concat(
                    attendees
                        .sort((a, b) => a?.uid?.localeCompare(b?.uid, 'en'))
                        .map(a => a.uid),
                ),
            );

        if (!this.state.personaID) {
            alert(
                'trying to create a chatID without a personaID!\ntry leaving post creation and coming back inside! (to be fixed ASAP)',
            );
            throw Error('halt! trying to create a chatID without a personaID!');
        }

        const chatContext = {
            ...JSON.parse(stringify(vanillaChat)),
            attendees: attendees,
            userIDList: attendees.map(a => a.id),
            invitees: invitees,
            authors: authors,
            chatID: chatID,
            postID: this.state.postID,
            personaID: this.state.personaID,
        };
        /*this.setState({
      attendees: attendees,
      invitees: invitees,
      authors: authors,
      chatID: chatID,
    });*/

        // this output is a mile long; uncomment only as necessary; -AROTH
        // console.log(
        //     `setting chatContext ${stringify(
        //         chatContext,
        //         function (k, v) {
        //             return v === undefined ? null : v;
        //         },
        //         4,
        //     )} to personas/${chatContext.personaID}/chats/${
        //         chatContext.chatID
        //     } <--> chatID=${chatID}`,
        // );
        firestore()
            .collection('personas')
            .doc(this.state.personaID)
            .collection('chats')
            .doc(chatID)
            .set(
                JSON.parse(
                    stringify(
                        chatContext,
                        function (k, v) {
                            return v === undefined ? null : v;
                        },
                        4,
                    ),
                ),
                {merge: true},
            );

        return chatContext;
    };

    async pushInviteStateToFirebaseAsync(inviteID = null, del = false) {
        log('pre-existing inviteID:', this.inviteID);

        if (!inviteID && this.inviteID) {
            log('using pre-existing inviteID');
        } else {
            log('passed in inviteID', inviteID);
            if (inviteID && !this.inviteID) {
                log('using passed inviteID');
                this.inviteID = inviteID;
            } else if (!inviteID && !this.inviteID) {
                log('will get a new inviteID from firebase!');
            }
        }

        if (this.new) {
            log('this is a new invite, setting publishTimestamp...');
            // for now
            // first time inviting
            this.publishDate = this.publishTimestamp();
            this.editDate = this.publishDate;
            log('this.editDate', this.editDate);
            log('this.publishDate', this.publishDate);
        } else if (this.edit) {
            log('this is an edit, setting editTimestamp...');
            // set in
            this.editDate = this.editTimestamp();
            log('this.editDate', this.editDate);
            log('this.publishDate', this.publishDate);
        }

        log('new', this.new);
        log('edit', this.edit);
        log('starting pushToFirebase inviteID->', this.inviteID);
        log('pushing publish timestamp', this.publishDate);
        log('pushing edit timestamp', this.editDate);
        const invite = Object.assign(
            {},
            {
                publishDate: this.publishDate,
                editDate: this.editDate,
                postID: this.postID,
                personaID: this.subPersonaID
                    ? this.subPersonaID
                    : this.personaID,
                createdByUserID: auth().currentUser.uid,
                invited: true,
            },
        );
        log('pushToFirebase invite->', this.inviteID, invite);

        // for now use the same inviteID for every invite in every user's invite collection
        // user = {
        //      id: '',
        // }

        if (!inviteID && !this.inviteID) {
            this.inviteID = this.postID;
            log('...got an inviteID:', this.inviteID);
        }

        this.invitees.forEach(async user => {
            // skip self, if modifying a post you were invited on
            if (user.uid === auth().currentUser.uid) {
                return;
            }

            // an application; skip
            if (!user.selected) {
                return;
            }

            log('found user', user);

            const inviteCollection = firestore()
                .collection('personas')
                .doc(this.personaID)
                .collection('posts')
                .doc(this.postID)
                .collection('invites');

            //console.log('pushToFirebase set inviteID->', this.inviteID);

            inviteCollection
                .doc(user.uid)
                .set(invite, {merge: true})
                .catch(err => {
                    error(
                        `firestore().collection(\'users\').doc(${user.id}).collection(\'invites\') errored`,
                        err.toString(),
                    );
                    alert(err.toString());
                });
        });

        /*console.log(
      'pushToFirebase completed; returning inviteID->',
      this.inviteID,
    );*/
        return this.inviteID;
    }

    /*
  init: true,
  new: false,
  edit: false,
  posted: false,
  personaID: '',
  postID: '',
  inviteID: '',
  invitees: [],
  publishDate: '',
  editDate: '',
  chatMessages: [],
  */

    validateInvite = () => {
        const e = [];
        this.state.init && e.push('Invite context should not be in init!');
        !this.state.personaID && e.push('missing personaID!');
        !this.state.postID && e.push('missing postID!');
        !this.state.inviteID &&
            this.state.edit &&
            e.push('in an edit session but missing an inviteID!');
        !this.state.invitees.length && e.push('no invitees!');

        const header = e.length ? 'You need to fix your shit!' : '';
        return {
            valid:
                false ||
                (this.state.init &&
                    !this.state.personaID &&
                    !this.state.postID &&
                    !this.state.inviteID &&
                    !this.state.invitees.length),
            errorMessage: header.concat(e),
        };
    };

    validateChat = () => {
        throw Error('halt: not implemented!');
        const e = [];
        !this.state.persona.name && e.push('Personas need a name!');
        const header = e.length ? 'You need to fix your shit!' : '';
        return {
            valid: false || this.state.persona.name,
            errorMessage: header.concat(e),
        };
    };

    csetState = state => {
        this.setState(state);
    };

    restoreVanilla = obj => {
        this.setState(
            Object.assign(JSON.parse(JSON.stringify(vanillaInviteState)), {
                new: obj?.sNew ? true : false,
            }),
        );
    };

    render() {
        console.log('RENDER InviteState');
        return (
            <InviteStateContext.Provider
                value={{
                    init: this.state.init,
                    setInit: this.setInit,
                    new: this.state.new,
                    setNew: this.setNew,
                    edit: this.state.edit,
                    setEdit: this.setEdit,
                    posted: this.state.posted,
                    setPosted: this.setPosted,
                    publishDate: this.state.publishDate,
                    editDate: this.state.editDate,
                    personaID: this.state.personaID,
                    subPersonaID: this.state.subPersonaID,
                    postID: this.state.postID,
                    setPersonaID: this.setPersonaID,
                    setSubPersonaID: this.setSubPersonaID,
                    setPostID: this.setPostID,
                    restoreVanilla: this.restoreVanilla,
                    publishTimestamp: this.publishTimestamp,
                    editTimestamp: this.editTimestamp,
                    chatMessages: this.state.chatMessages,
                    setChatMessages: this.setChatMessages,
                    invitees: this.state.invitees,
                    setInvitees: this.setInvitees,
                    inviteID: this.state.inviteID,
                    setInviteID: this.setInviteID,
                    validate: this.validatePersona,
                    pushInviteStateToFirebaseAsync:
                        this.pushInviteStateToFirebaseAsync,
                    pushChatStateToFirebaseAsync:
                        this.pushChatStateToFirebaseAsync,
                    getChatID: this.getChatID,
                    validateChat: this.validateChat,
                    validateInvite: this.validateInvite,
                    csetState: this.csetState,
                }}>
                {this.props.children}
            </InviteStateContext.Provider>
        );
    }
}
