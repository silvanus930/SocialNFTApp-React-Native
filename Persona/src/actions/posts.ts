import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {getServerTimestamp} from './constants';

export function markDraftAsSeen(draft, userId) {
    try {
        const seen = {
            ...draft?.data?.latestMessage?.data?.seen,
            [userId]: getServerTimestamp(),
        };

        firestore()
            .collection('draftchatCaching')
            .doc(draft?.data?.chatId)
            .update({
                'latestMessage.data.seen': seen,
            });
    } catch (e) {
        console.log('markDraftAsSeen: exception:', e);
    }
}

export function getCommunityForumPosts(communityId: string) {
    return firestore()
        .collection('feed')
        .where('community_and_persona_ids', 'array-contains', communityId)
        .where('post.data.deleted', '==', false)
        .where('post.data.published', '==', true)
        .orderBy('post.data.publishDate', 'desc');
}

export function getCommunityTransactionPosts(communityId: string) {
    return firestore()
        .collection('feed')
        .where('community_and_persona_ids', 'array-contains', communityId)
        .where('post.data.type', '==', 'transfer')
        .where('post.data.deleted', '==', false)
        .where('post.data.published', '==', true)
        .orderBy('post.data.publishDate', 'desc');
}

export function getLivePost(
    collection,
    personaKey,
    postKey,
    setNumComments,
    post,
) {
    return firestore()
        .collection(collection)
        .doc(personaKey)
        .collection('posts')
        .doc(postKey)
        .collection('live')
        .doc('discussion')
        .onSnapshot(discussionSnap => {
            setNumComments(
                discussionSnap.get('numCommentsAndThreads') ||
                    post?.numComments ||
                    0,
            );
        });
}

export function postVote(personaID, postID, voteOption) {
    const myUserID = auth().currentUser.uid;
    return firestore()
        .collection('personas')
        .doc(personaID)
        .collection('posts')
        .doc(postID)
        .set(
            {
                proposal: {
                    votes: {
                        [myUserID]: {
                            outcome: voteOption,
                            createdAt: getServerTimestamp(),
                        },
                    },
                },
            },
            {merge: true},
        );
}

export function updatePostSeen(item) {
    const myUserID = auth().currentUser.uid;
    return firestore()
        .collection('personas')
        .doc(item.entry.personaKey)
        .collection('posts')
        .doc(item.entry.postKey)
        .update({
            [`seen.${myUserID}`]: getServerTimestamp(),
        });
}

export function updatePost(personaID: string, postId: string, newPost) {
    return firestore()
        .collection('personas')
        .doc(personaID)
        .collection('posts')
        .doc(postId)
        .update(newPost);
}

export function updateCommunityPost(
    communityID: string,
    postId: string,
    newPost,
) {
    return firestore()
        .collection('communities')
        .doc(communityID)
        .collection('posts')
        .doc(postId)
        .update(newPost);
}
export function createCommunityPost(communityID: string, newPost) {
    return firestore()
        .collection('communities')
        .doc(communityID)
        .collection('posts')
        .add(newPost);
}
export function createPost(personaID: string, newPost) {
    return firestore()
        .collection('personas')
        .doc(personaID)
        .collection('posts')
        .add(newPost);
}

export function createPurchasables(postID: string, data: any) {
    return firestore().collection('purchasables').doc(postID).set(data);
}

export function updatePurchasables(postID: string, data: any) {
    return firestore().collection('purchasables').doc(postID).update(data);
}
