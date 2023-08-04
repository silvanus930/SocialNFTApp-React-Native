import '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import {Platform, LogBox} from 'react-native';
import React from 'react';

import {clog, cwarn, cerror} from 'utils/log';
const CUSTOM_LOG_WARN_HEADER = '!! actions/utils';
const log = (...args) => global.LOG_FB && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_FB && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);

export default function cleanPersonas() {
    // TODO delete extraneous fields
    firestore()
        .collection('personas')
        .get()
        .then(querySnapshot => {
            querySnapshot.docs.map((personaRef, index) => {
                log('looking at a persona', personaRef.id);
                firestore()
                    .collection('personas')
                    .doc(personaRef.id)
                    .collection('posts')
                    .get()
                    .then(postQuery => {
                        postQuery.docs.map((postRef, index) => {
                            log('post', postRef.id);
                            firestore()
                                .collection('personas')
                                .doc(personaRef.id)
                                .collection('posts')
                                .doc(postRef.id)
                                .set({
                                    ...postRef.data(),
                                    type: postRef.data().type
                                        ? postRef.data().type
                                        : 'media',
                                    mediaUrl: postRef.data().mediaUrl
                                        ? postRef.data().mediaUrl
                                        : '',
                                    mediaType: postRef.data().mediaType
                                        ? postRef.data().mediaType
                                        : 'photo',
                                    userID: personaRef.data().authors[0], // TODO stop using once we have collabs
                                    published: postRef.data().published
                                        ? postRef.data().published
                                        : true,
                                    anonymous: postRef.data().anonymous
                                        ? postRef.data().anonymous
                                        : false,
                                    publishDate: postRef.data().publishDate
                                        ? postRef.data().publishDate
                                        : firestore.Timestamp.now(),
                                    editDate: postRef.data().editDate
                                        ? postRef.data().editDate
                                        : firestore.Timestamp.now(),
                                    inviteID: postRef.data().inviteID
                                        ? postRef.data().inviteID
                                        : '',
                                    promise: postRef.data().promise
                                        ? postRef.data().promise
                                        : false,
                                    promiseSatisfied: postRef.data()
                                        .promiseSatisfied
                                        ? postRef.data().promiseSatisfied
                                        : false,
                                    title: postRef.data()?.title
                                        ? postRef.data().title
                                        : '',
                                    text: postRef.data().text
                                        ? postRef.data().text
                                        : '',
                                    subPersonaID: postRef.data().subPersonaID
                                        ? postRef.data().subPersonaID
                                        : '',
                                    subPersona: postRef.data().subPersona
                                        ? postRef.data().subPersona
                                        : vanillaPersona,
                                    invitees: postRef.data().invitees
                                        ? postRef.data().invitees
                                        : [],
                                    applications: postRef.data().applications
                                        ? postRef.data().applications
                                        : [],
                                    editDate: postRef.data().editDate
                                        ? postRef.data().editDate
                                        : firestore.Timestamp.now(),
                                    publishDate: postRef.data().publishDate
                                        ? postRef.data().publishDate
                                        : firestore.Timestamp.now(),
                                    // TODO recurse on subcollections applications edits endorsements
                                    // TODO clean personas document too
                                });
                        });
                    });
            });
        });
}

// if (Platform.OS === 'android') {
//   // HACK
//   // TOOD - update firestore once resolved https://github.com/firebase/firebase-js-sdk/issues/1674
//   firestore().settings({experimentalForceLongPolling: true});
//   LogBox.ignoreLogs(['Setting a timer']);
// }

/**
 * Firebase's native delete operation on client only removes a single document. To delete
 * an object and all its subcollections is also a potentially time-consuming and memory-
 * intensive task. Instead, a firebase cloud function is called that deletes recursively
 * starting from a particular object.
 * @param {firestore.DocumentReference} docRef
 */
export async function deleteRecursive(docRef) {
    let deleteFn = functions().httpsCallable('recursiveDelete');
    warn(
        'Are you sure you should be using this delete function - the answer is most likely no',
    );
    try {
        const result = await deleteFn({path: '/' + docRef.path});
        log('Delete success: ' + JSON.stringify(result));
    } catch (err) {
        error('Delete failed, see firebase console,');
        error(err.toString());
    }
}

/**
 * Recursively mark documents to be deleted
 * @param {firestore.DocumentReference} docRef
 */
export async function recursiveMarkDelete(docRef) {
    let deleteFn = functions().httpsCallable('recursiveMarkDelete');
    try {
        const result = await deleteFn({docPath: '/' + docRef.path});
        log('Delete success: ' + JSON.stringify(result));
    } catch (err) {
        error('Delete failed, see firebase console,');
        error(err.toString());
    }
}

/**
 * Delete all ghost children of a collection group without a parent
 * @param {String} collectionGroupName
 */
export function deleteGhostRefs(collectionGroupName) {
    firestore()
        .collectionGroup(collectionGroupName)
        .get()
        .then(snap => {
            snap.docs.map(snapDoc => {
                const parentRef = snapDoc.ref.parent.parent;
                parentRef.get().then(parentDoc => {
                    if (!parentDoc.exists) {
                        log('deleting ghost reference');
                        snapDoc.ref.delete();
                    }
                });
            });
        });
}

// Remove soon
function backfillPostSeenStatuses() {
    firestore()
        .collection('feed')
        .get()
        .then(feedCol => {
            feedCol.docs.map(async feedDoc => {
                const seenIDs = Object.entries(feedDoc.get('seen'))
                    .filter(([k, v]) => v)
                    .map(([k]) => k);
                const timeStamp =
                    feedDoc.get('post.data.publishDate') || new Date();
                const seen = Object.fromEntries(
                    seenIDs.map(id => [id, timeStamp]),
                );
                await feedDoc.get('post.ref').set({seen}, {merge: true});
            });
        });
}

export function backfillPersonaCaches() {
    firestore()
        .collection('personas')
        .get()
        .then(personasSnap => {
            personasSnap.docs.map(async personaSnap => {
                let personaCache = {
                    authors: personaSnap.get('authors') || [],
                    communityMembers: personaSnap.get('communityMembers') || [],
                };
                let latestPost = await personaSnap.ref
                    .collection('posts')
                    .where('publishDate', '!=', '')
                    .orderBy('publishDate', 'desc')
                    .limit(1)
                    .get();
                if (latestPost.docs.length === 1) {
                    personaCache.latestPostPublishDate =
                        latestPost.docs[0].get('publishDate');
                }
                let latestEdit = await personaSnap.ref
                    .collection('posts')
                    .where('editDate', '!=', '')
                    .orderBy('editDate', 'desc')
                    .limit(1)
                    .get();
                if (latestEdit.docs.length === 1) {
                    personaCache.latestPostEditDate =
                        latestEdit.docs[0].get('editDate');
                }
                await firestore()
                    .collection('personaCaching')
                    .doc(personaSnap.id)
                    .set(personaCache, {merge: true});
                console.log('backfilled cache', personaSnap.id, personaCache);
            });
        });
}

export function backfillChatCache() {
    firestore()
        .collection('personas')
        .doc('NKDmMFWHDIRP4IMjOw5y')
        .collection('chats')
        .get()
        .then(chatDocs => {
            chatDocs.docs.map(async chatDoc => {
                const chatId = chatDoc.id;
                const latestMessages = await chatDoc.ref
                    .collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                    .get();
                if (latestMessages.docs.length === 0) {
                    return;
                }
                const snapshot = latestMessages.docs[0];
                const involved = (chatDoc.get('attendees') || []).map(
                    attendee => attendee.id,
                );
                const chatCachingDocRef = firestore()
                    .collection('chatChaching')
                    .doc(chatId);
                const newChatCachingData = {
                    chatId,
                    involved,
                    latestMessage: {
                        timestamp:
                            snapshot.get('timestamp') ||
                            firestore.Timestamp.now(),
                        data: snapshot.data(),
                        id: snapshot.id,
                    },
                };
                await firestore().runTransaction(transaction => {
                    return transaction
                        .get(chatCachingDocRef)
                        .then(chatCachingDoc => {
                            if (chatCachingDoc.exists) {
                                const existingTimestamp = chatCachingDoc.get(
                                    'latestMessage.timestamp',
                                );
                                if (
                                    existingTimestamp.seconds <
                                    newChatCachingData.latestMessage.timestamp
                                        .seconds
                                ) {
                                    transaction.set(
                                        chatCachingDocRef,
                                        newChatCachingData,
                                    );
                                    console.log(
                                        `Updating message cache for ${chatCachingDocRef.path} from ${snapshot.ref.path}`,
                                    );
                                } else {
                                    console.log(
                                        `Skip updating message cache, not latest, for ${chatCachingDocRef.path} from ${snapshot.ref.path}`,
                                    );
                                }
                            } else {
                                transaction.set(
                                    chatCachingDocRef,
                                    newChatCachingData,
                                );
                                console.log(
                                    `Updating message cache for ${chatCachingDocRef.path} from ${snapshot.ref.path}`,
                                );
                            }
                        });
                });
            });
        });
}
