import React from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {clog, cwarn} from 'utils/log';
const CUSTOM_LOG_WARN_HEADER = '!! state/PersonaState';
const log = (...args) =>
    global.LOG_STATE_PERSONA && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_STATE_PERSONA && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
import {uniqAdd} from 'utils/helpers';

const PersonaStateContext = React.createContext({
    new: false,
    edit: false,
    draft: false,
    setNew: () => {},
    csetState: () => {},
    setEdit: () => {},
    pid: '',
    setPersonaID: () => {},
    persona: null,
    setPersona: p => {},
    posted: false,
    setPosted: () => {},
});

export {PersonaStateContext};

import {SYSTEM_USER_22_ID} from 'config/personas';

export const vanillaPersona = {
    private: true,
    anonymous: false,
    showOnlyInStaffHome: false,
    showOnlyInStaffStudio: false,
    deleted: false,
    published: false,
    publishDate: '',
    editDate: '',
    admins: [],
    name: '',
    authors: [],
    followers: [],
    bio: '',
    inviteID: '',
    publicCanChat: true,
    publicCanComment: true,
    publicCanAudioChat: true,
    profileImgUrl: '',
    isSubPersona: false,
    parentPersonaID: '',
    showInProfile: false,
    remix: false,
    remixPersonaID: '',
    remixPostID: '',
    openFromTop: false,
    open: false,
    openToThreadID: null,
    threadID: null,
    scrollToMessageID: null,
};

export default class PersonaState extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            persona: Object.assign(
                {},
                JSON.parse(JSON.stringify(vanillaPersona)),
            ),
            new: false,
            edit: false,
            draft: false,
            posted: false,
            identityPersona: Object.assign(
                {},
                JSON.parse(JSON.stringify(vanillaPersona)),
            ),
            pid: '',
            openToThreadID: null,
            threadID: null,
            scrollToMessageID: null,
        };
        this.state.persona.showOnlyInStaffStudio =
            auth()?.currentUser?.uid === SYSTEM_USER_22_ID ? true : false;
    }

    setNew = n => {
        this.setState({new: n});
    };

    setEdit = e => {
        this.setState({edit: e});
    };

    setPersonaID = (p, smallLog = true) => {
        const per = this.state.persona;
        this.setState({
            new: false,
            edit: true,
            pid: p,
            persona: {...per, pid: p},
        });
    };

    setInviteID = p => {
        this.setState({inviteID: p});
    };

    setPosted = p => {
        this.setState({posted: p});
    };

    setPersona = (p, smallLog = true) => {
        if (smallLog) {
            log(
                'setPersona (smallLog)',
                'pid',
                p.pid ? p.pid : null,
                'name',
                p.name,
            );
        } else {
            log('setPersona', p);
        }
        this.setState({persona: {...p}});

        log('personaContext.new', this.state.new);
        log('personaContext.edit', this.state.edit);
    };

    setPersonaNameBio = pnb => {
        const p = this.state.persona;
        this.setState({persona: {...p, name: pnb?.name, bio: pnb?.bio}});
    };
    setPersonaName = pn => {
        log('setPersonaName', pn);
        const p = this.state.persona;
        p.name = pn;
        this.setState({persona: p});
    };

    setPersonaAuthors = pn => {
        log('setPersonaAuthors', pn);
        const p = this.state.persona;
        p.authors = pn;
        this.setState({persona: p});
    };

    setPersonaPublished = pub => {
        log('setPersonaPublished', pub);
        const p = this.state.persona;
        p.published = pub;
        this.setState({persona: p});
    };

    setPersonaBio = pd => {
        log('setPersonaBio', pd);
        const p = this.state.persona;
        p.bio = pd;
        this.setState({persona: p});
    };

    setPersonaProfileImgUrl = pi => {
        log('setPersonaProfileImgUrl', pi);
        const p = this.state.persona;
        p.profileImgUrl = pi;
        this.setState({persona: p});
    };

    setPersonaHeaderImgUrl = hi => {
        log('setPersonaHeaderImgUrl', hi);
        const p = this.state.persona;
        p.headerImgUrl = hi;
        this.setState({persona: p});
    };

    setPersonaOpen = flag => {
        log('setPersonaOpen', flag);
        const p = this.state.persona;
        p.open = flag;
        this.setState({persona: p});
    };

    addPersonaFollower = fid => {
        log('addPersonaNumPromises', fid);
        const p = this.state.persona;
        p.followers = uniqAdd(p.followers, fid);
        this.setState({persona: p});
    };

    addPersonaAuthor = pid => {
        log('addPersonaAuthors', pid);
        const p = this.state.persona;
        if (!p.authors.includes(pid)) {
            p.authors = p.authors.concat(pid);
        }
        this.setState({persona: p});
    };

    removePersonaAuthor = pid => {
        log('addPersonaAuthors', pid);
        const p = this.state.persona;
        p.authors = p.authors.filter(function (id) {
            return id !== pid;
        });
        this.setState({persona: p});
    };

    ensurePersonaAdmins = uids => {
        log('ensurePersonaAdmins', uids);
        uids.forEach(uid => {
            this.ensurePersonaAdmin(uid);
        });
    };

    ensurePersonaAdmin = uid => {
        log('ensurePersonaAdmins', uid);
        let newAdmins = this.state.persona.admins.includes(uid)
            ? this.state.persona.admins
            : this.state.persona.admins.concat([uid]);
        log('new admins', newAdmins);
        this.setPersona({admins: newAdmins});
    };

    validatePersona = (small = false, textContext = null) => {
        let nameToTest = this.state.persona.name; //textContext ? textContext.persona.name : this.state.persona.name;
        //log('in validatePersona! nameToTest:',nameToTest);
        //log('in validatePersona! textContext:',textContext);
        const e = [];
        !nameToTest &&
            e.push("\nOne does not just leave one's newly born child unnamed!");
        const header = e.length ? 'sorry ~' : '';
        return {
            valid: false || nameToTest,
            errorMessage: header.concat(e),
        };
    };

    updateFromTextContext(textContext) {
        //this.setPersona({name: textContext.persona.name, bio: textContext.persona.bio});
    }
    publishTimestamp = () => {
        this.state.persona.publishDate = firestore.Timestamp.now();
        log('publishTimestamp', this.state.persona.publishDate);
    };

    editTimestamp = () => {
        this.state.persona.editDate = firestore.Timestamp.now();
        log('editTimestamp', this.state.persona.editDate);
    };

    async pushPersonaStateToFirebaseAsync(pid = null, del = true) {
        if (!pid && this.persona.pid) {
            pid = this.persona.pid;
        }
        log('got a pid!', pid);

        if (this.new) {
            // set in PersonaCreationScreen
            this.publishTimestamp();
            this.persona.editDate = this.persona.publishDate;
        }

        if (!this.persona.editDate) {
            // set in
            this.editTimestamp();
        }

        const personas = firestore().collection('personas');
        if (!pid && !this.pid) {
            const docRef = await personas.add(this.persona); // TODO error handling
            pid = docRef.id;
        } else {
            const id = pid ? pid : this.pid;
            log('pushToFirebase set pid->', pid);
            personas
                .doc(id)
                .set(this.persona, {merge: true})
                .catch(error => {
                    warn('firestore().collection(personas) errored', error);
                    alert(error);
                });
        }
        log('pushToFirebase returning pid->', pid);

        if (pid) {
            // restore pid
            this.persona.pid = pid;
        }

        return pid;
    }

    csetState = state => {
        this.setState(state);
    };

    restoreVanilla = obj => {
        this.setState({
            edit: obj?.sEdit ? true : false,
            new: obj?.sNew ? true : false,
            posted: obj?.sPosted ? true : false,
            persona: Object.assign(JSON.parse(JSON.stringify(vanillaPersona)), {
                persona: obj?.persona ? obj.persona : null,
                admins: obj?.sAdmin ? [auth().currentUser.uid] : [],
            }),
            pid: obj?.sPid ? obj.sPid : null,
            openToThreadID: obj?.openToThreadID ?? null,
            threadID: obj?.threadID ?? null,
            scrollToMessageID: obj?.scrollToMessageID ?? null,
        });
    };

    render() {
        console.log(
            'RENDER PERSONACONTEXT',
            this.state.persona.name,
            this.state.persona.pid,
        );
        return (
            <PersonaStateContext.Provider
                value={{
                    new: this.state.new,
                    draft: this.state.draft,
                    edit: this.state.edit,
                    clearHomeSearch: this.state.clearHomeSearch,
                    setNew: this.setNew,
                    setEdit: this.setEdit,
                    posted: this.state.posted,
                    setPosted: this.setPosted,
                    publishDate: this.state.publishDate,
                    editDate: this.state.editDate,
                    inviteID: this.state.inviteID,
                    setInviteID: this.setInviteID,
                    pid: this.state.pid,
                    setPersonaID: this.setPersonaID,
                    persona: this.state.persona,
                    identityPersona: this.state.identityPersona,
                    setPersona: this.setPersona,
                    setPersonaName: this.setPersonaName,
                    setPersonaNameBio: this.setPersonaNameBio,
                    setPersonaPromises: this.setPromises,
                    setPersonaBio: this.setPersonaBio,
                    setPersonaOpen: this.setPersonaOpen,
                    setPersonaProfileImgUrl: this.setPersonaProfileImgUrl,
                    setPersonaHeaderImgUrl: this.setPersonaHeaderImgUrl,
                    setPersonaAuthors: this.setPersonaAuthors,
                    addPersonaAuthor: this.addPersonaAuthor,
                    removePersonaAuthor: this.removePersonaAuthor,
                    addPersonaFollower: this.addPersonaFollower,
                    pushPersonaStateToFirebaseAsync:
                        this.pushPersonaStateToFirebaseAsync,
                    restoreVanilla: this.restoreVanilla,
                    publishTimestamp: this.publishTimestamp,
                    editTimestamp: this.editTimestamp,
                    ensurePersonaAdmin: this.ensurePersonaAdmin,
                    ensurePersonaAdmins: this.ensurePersonaAdmins,
                    admins: this.state.admins,
                    updateFromTextContext: this.updateFromTextContext,
                    validatePersona: this.validatePersona,
                    csetState: this.csetState,
                    openToThreadID: this.state.openToThreadID,
                    openFromTop: this.state.openFromTop,
                    open: this.state.open,
                    threadID: this.state.threadID,
                    scrollToMessageID: this.state.scrollToMessageID,
                }}>
                {this.props.children}
            </PersonaStateContext.Provider>
        );
    }
}
