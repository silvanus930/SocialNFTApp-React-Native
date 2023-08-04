import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {clog, cwarn, cerror} from 'utils/log';
import {POST_TYPE_ARTIST, POST_TYPE_COLLABORATOR} from 'state/PostState';
const CUSTOM_LOG_WARN_HEADER = '!! fb/pushPattern';
const log = (...args) => global.LOG_FB && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_FB && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);

export const pushPersonaToFirebaseAsync = async (
    perContext,
    posContext,
    invContext,
    usrContext,
    nav,
    parentNav,
    navCallback,
) => {
    perContext.edit = true;

    let pID = perContext.persona.pid;
    let personaID = pID;

    /*if (pID) {
    if (
      usrContext.personaMap[pID]?.name === perContext.persona.name &&
      usrContext.personaMap[pID]?.bio === perContext.persona.bio
    ) {
      console.log('skipping pushing persona to', personaID);
    } else {
      personaID = await perContext.pushPersonaStateToFirebaseAsync(personaID);
      console.log('pushed persona to', personaID);
    }
  } else {
    personaID = await perContext.pushPersonaStateToFirebaseAsync(personaID);
    console.log('pushed persona to', personaID);
  }*/
    //perContext.persona.pid = personaID;

    /*if (posContext.post.type == POST_TYPE_ARTIST) {
    posContext.post.subPersona.isSubPersona = true;
    posContext.post.subPersona.parentPersonaID = personaID;
    posContext.post.subPersona.private = Boolean(perContext.persona.private);
    posContext.post.subPersona.published = true;
    const subPersonaID = await posContext.pushSubPersonaStateToFirebaseAsync(
      posContext.post.subPersonaID,
      false,
    );
    posContext.post.subPersonaID = subPersonaID;
    //posContext.post.subPersona.personaID = subPersonaID;
  }*/

    posContext.personaID = personaID;
    posContext.post.published = true;
    const postID = await posContext.pushPostStateToFirebaseAsync();

    /*perContext.persona.published = true;
  if (
    usrContext.personaMap[personaID]?.name === perContext.persona.name &&
    usrContext.personaMap[personaID]?.bio === perContext.persona.bio
  ) {
    console.log('skipping pushing persona to', personaID);
  } else {
    await perContext.pushPersonaStateToFirebaseAsync(personaID);
    console.log('pushed persona to', personaID);
  }*/

    // restore vanilla state
    //perContext.restoreVanilla();
    //posContext.restoreVanilla();
    //invContext.restoreVanilla();
    //perContext.setPosted(false); // reactivate back button on StudioConclusionScreen
    //perContext.setPersonaID(personaID);
    perContext.csetState({
        personaID: personaID,
        pid: personaID,
        posted: false,
        persona: {...perContext.persona, pid: personaID},
    });

    navCallback();
};

export const pushDraftToFirebaseAsync = async (
    draftID,
    perContext,
    posContext,
    invContext,
    usrContext,
    setUnpublished = true,
) => {
    //let personaID = perContext.persona.pid;
    console.log('in pushDraftToFirebaseAsync');

    /*if (!personaID) {
    personaID = await perContext.pushPersonaStateToFirebaseAsync(personaID);
    console.log('pushed persona to', personaID);
  }
  console.log('post pushPersonaState');*/

    /*if (posContext.post.type === POST_TYPE_ARTIST) {
    posContext.post.subPersona.isSubPersona = true;
    posContext.post.subPersona.parentPersonaID = personaID;
    posContext.post.subPersona.published = false;
    const subPersonaID = await posContext.pushSubPersonaStateToFirebaseAsync(
      posContext.post.subPersonaID,
      false,
    );
    posContext.post.subPersonaID = subPersonaID;
    //posContext.post.subPersona.personaID = subPersonaID;*/
    //}
    //console.log('post artist check');

    //posContext.personaID = personaID;
    posContext.post.published = setUnpublished
        ? false
        : posContext.post.published;

    const postID = await posContext.pushDraftStateToFirebaseAsync(draftID);

    console.log('pushDraftToFirebaseAsync postID', postID);

    /*if (perContext.persona.published !== true) {
    perContext.persona.published = false;
  } // TODO: main difference with what happens in pushPersona...ASync; refactor*/

    /*if (
    usrContext.personaMap[personaID]?.name === perContext.persona.name &&
    usrContext.personaMap[personaID]?.bio === perContext.persona.bio
  ) {
    console.log('skipping pushing persona to', personaID);
  } else {
    personaID = await perContext.pushPersonaStateToFirebaseAsync(personaID);
    console.log('pushed persona to', personaID);
  }*/

    console.log('post pushPersonaState');

    // restore vanilla state
    //perContext.restoreVanilla();
    posContext.csetState({edit: true, post: {...posContext.post, pid: postID}});
    //perContext.setEdit(true);
};
export const pushPostDraftToFirebaseAsync = async (
    perContext,
    posContext,
    invContext,
    usrContext,
    setUnpublished = true,
) => {
    let personaID = perContext.persona.pid;
    console.log('in pushPostDraftToFirebaseAsync');

    /*if (!personaID) {
    personaID = await perContext.pushPersonaStateToFirebaseAsync(personaID);
    console.log('pushed persona to', personaID);
  }
  console.log('post pushPersonaState');*/

    /*if (posContext.post.type === POST_TYPE_ARTIST) {
    posContext.post.subPersona.isSubPersona = true;
    posContext.post.subPersona.parentPersonaID = personaID;
    posContext.post.subPersona.published = false;
    const subPersonaID = await posContext.pushSubPersonaStateToFirebaseAsync(
      posContext.post.subPersonaID,
      false,
    );
    posContext.post.subPersonaID = subPersonaID;
    //posContext.post.subPersona.personaID = subPersonaID;*/
    //}
    //console.log('post artist check');

    posContext.personaID = personaID;
    posContext.post.published = setUnpublished
        ? false
        : posContext.post.published;

    const postID = await posContext.pushPostStateToFirebaseAsync();

    console.log('pushPostDraftToFirebaseAsync postID', postID);

    /*if (perContext.persona.published !== true) {
    perContext.persona.published = false;
  } // TODO: main difference with what happens in pushPersona...ASync; refactor*/

    /*if (
    usrContext.personaMap[personaID]?.name === perContext.persona.name &&
    usrContext.personaMap[personaID]?.bio === perContext.persona.bio
  ) {
    console.log('skipping pushing persona to', personaID);
  } else {
    personaID = await perContext.pushPersonaStateToFirebaseAsync(personaID);
    console.log('pushed persona to', personaID);
  }*/

    console.log('post pushPersonaState');

    // restore vanilla state
    //perContext.restoreVanilla();
    posContext.setPost({...posContext.post, pid: postID});
    posContext.setEdit(true);
    perContext.setEdit(true);
};

export const setDraft = postOrPersona => {
    postOrPersona.posted = true;
    postOrPersona.published = false;
};

export const ensureAuthor = personaContext => {
    if (!personaContext.persona.authors.includes(auth().currentUser.uid)) {
        personaContext.persona.authors.push(auth().currentUser.uid);
    }
};

// passed down to components that publish
export const addPersona = async (
    perContext,
    posContext,
    invContext,
    usrContext,
    nav,
    parentNav,
    navCallback,
) => {
    //return;

    posContext.setPosted(true);
    // NB: the pushes are async functions; only set state in them in groups
    // together, preferably at the beginning and end, and limit to one!
    if (perContext.persona.published !== true) {
        setDraft(perContext.persona);
    }
    ensureAuthor(perContext);
    await pushPersonaToFirebaseAsync(
        perContext,
        posContext,
        invContext,
        usrContext,
        nav,
        parentNav,
        navCallback,
    );
    posContext.csetState({posted: false, draft: false});
};

export const addPersonaDraft = async (
    perContext,
    posContext,
    invContext,
    usrContext,
    nav,
) => {
    perContext.setPosted(true);
    // NB: the pushes are async functions; only set state in them in groups
    // together, preferably at the end!
    if (perContext.persona.published !== true) {
        setDraft(perContext.persona);
    }
    ensureAuthor(perContext);
    await pushPersonaDraftToFirebaseAsync(
        perContext,
        posContext,
        invContext,
        usrContext,
    );
    alert('saved!');
    perContext.setPosted(false);
};

export const addDraft = async (
    draftID,
    perContext,
    posContext,
    invContext,
    usrContext,
    setUnpublished = true,
) => {
    posContext.setPosted(true);
    // NB: the pushes are async functions; only set state in them in groups
    // together, preferably at the end!
    setUnpublished && setDraft(posContext.post);
    /*await pushPersonaDraftToFirebaseAsync(
    perContext,
    posContext,
    invContext,
    usrContext,
  );*/
    console.log('about to pushPostDraftToFirebaseASync');
    await pushDraftToFirebaseAsync(
        draftID,
        perContext,
        posContext,
        invContext,
        usrContext,
        setUnpublished,
    );
    setUnpublished && alert('draft saved!');
    !setUnpublished && alert('saved');
    posContext.csetState({posted: false, draft: false});
};
export const addPostDraft = async (
    perContext,
    posContext,
    invContext,
    usrContext,
    setUnpublished = true,
) => {
    posContext.setPosted(true);
    // NB: the pushes are async functions; only set state in them in groups
    // together, preferably at the end!
    if (perContext.published !== true) {
        setDraft(perContext.persona);
    }
    setUnpublished && setDraft(posContext.post);
    ensureAuthor(perContext);
    /*await pushPersonaDraftToFirebaseAsync(
    perContext,
    posContext,
    invContext,
    usrContext,
  );*/
    console.log('about to pushPostDraftToFirebaseASync');
    await pushPostDraftToFirebaseAsync(
        perContext,
        posContext,
        invContext,
        usrContext,
        setUnpublished,
    );
    setUnpublished && alert('draft saved!');
    !setUnpublished && alert('saved');
    posContext.csetState({posted: false, draft: false});
};

// passed down to components that invite
export const addInvite = async (
    // NB: the pushes are async functions; only set state in them together,
    // preferably at the end!
    perContext,
    posContext,
    invContext,
    usrContext,
    nav,
) => {
    //return;
    invContext.setPosted(true);
    /*
  perContext.setPersona({
    name: usrContext.persona.name,
    bio: usrContext.persona.bio,
  });*/
    /*posContext.setPost({
    title: usrContext.post.title,
    text: usrContext.post.text,
  });*/
    setDraft(perContext.persona);
    setDraft(posContext.post); // TODO cleanup, redundant with later code, but harmless
    ensureAuthor(perContext);
    await pushInviteToFirebaseAsync(
        perContext,
        posContext,
        invContext,
        usrContext,
        nav,
    );
    invContext.setPosted(false);
};
