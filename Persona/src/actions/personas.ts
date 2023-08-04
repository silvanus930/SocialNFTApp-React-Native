import firestore from '@react-native-firebase/firestore';
import {vanillaPost} from 'state/PostState';

export function getPersonaList(
    personaEntry,
    firstRender,
    postListRef,
    setPostList,
) {
    return firestore()
        .collection('personas')
        .doc(personaEntry.personaKey)
        .collection('posts')
        .where('deleted', '==', false)
        .where('type', '!=', 'transfer')
        .onSnapshot(postsSnap => {
            if (firstRender.current) {
                postListRef.current = postsSnap.docs
                    .map(postDoc => ({
                        persona: personaEntry.persona,
                        personaKey: personaEntry.personaKey,
                        post: postDoc.exists ? postDoc.data() : vanillaPost,
                        postKey: postDoc.id,
                        lastUpdated: Date.now(),
                    }))
                    .sort(
                        (a, b) =>
                            -(
                                a.post.publishDate?.seconds || Date.now() / 1000
                            ) +
                            (b.post.publishDate?.seconds || Date.now() / 1000),
                    );
                firstRender.current = false;

                setPostList([
                    ...postListRef.current.filter(x => x.post.pinned),
                    ...postListRef.current.filter(x => !x.post.pinned)
                ]);
            } else {
                postsSnap &&
                    postsSnap
                        .docChanges()
                        .reverse()
                        .forEach(change => {
                            if (change.type === 'added') {
                                const existingPost = postListRef.current.find(
                                    p => p.postKey === change.doc.id,
                                );
                                if (existingPost !== undefined) {
                                    return;
                                }
                                const newPost = {
                                    persona: personaEntry.persona,
                                    personaKey: personaEntry.personaKey,
                                    post: change.doc?.data
                                        ? change.doc.data()
                                        : vanillaPost,
                                    postKey: change.doc.id,
                                    lastUpdated: Date.now(),
                                };
                                postListRef.current = [newPost].concat(
                                    postListRef.current,
                                );
                                postListRef.current = postListRef.current.sort(
                                    (a, b) =>
                                        -(
                                            a.post.publishDate?.seconds ||
                                            Date.now() / 1000
                                        ) +
                                        (b.post.publishDate?.seconds ||
                                            Date.now() / 1000),
                                );
                            } else if (change.type === 'modified') {
                                const modifiedPost = {
                                    persona: personaEntry.persona,
                                    personaKey: personaEntry.personaKey,
                                    post: change.doc.data(),
                                    postKey: change.doc.id,
                                    lastUpdated: Date.now(),
                                };
                                const indexToChange =
                                    postListRef.current.indexOf(
                                        postListRef.current.find(
                                            p => p.postKey === change.doc.id,
                                        ),
                                    );
                                if (indexToChange !== -1) {
                                    postListRef.current[indexToChange] =
                                        modifiedPost;
                                }
                            } else if (change.type === 'removed') {
                                postListRef.current =
                                    postListRef.current.filter(
                                        ({postKey}) =>
                                            postKey !== change.doc.id,
                                    );
                                postListRef.current = postListRef.current.sort(
                                    (a, b) =>
                                        -(
                                            a.post.publishDate?.seconds ||
                                            Date.now() / 1000
                                        ) +
                                        (b.post.publishDate?.seconds ||
                                            Date.now() / 1000),
                                );
                            }
                        });
                setPostList([
                    ...postListRef.current.filter(x => x.post.pinned),
                    ...postListRef.current.filter(x => !x.post.pinned)
                ]);
            }
        });
}

export function updatePersonaAuthor(event) {
    return firestore()
        .collection('personas')
        .doc(event.persona_id)
        .update({
            authors: firestore.FieldValue.arrayUnion(event.createdByUser.id),
        });
}
