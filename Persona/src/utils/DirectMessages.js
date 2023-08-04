import firestore from '@react-native-firebase/firestore';
import {getServerTimestamp} from 'actions/constants';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';

export const markDirectMessageAsSeen = async ({cachedChat, userId}) => {
    const chatId = cachedChat.id;
    const messageId = cachedChat.data.latestMessage.id;

    const sourceDocRef = await firestore()
        .collection('personas')
        .doc(SYSTEM_DM_PERSONA_ID)
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc(messageId);
    const sourceDoc = await sourceDocRef.get();

    const seen = {
        ...sourceDoc.data().seen,
        [userId]: getServerTimestamp(),
    };

    sourceDocRef.update({
        seen: seen,
    });

    // The cached doc's `seen` will be updated automatically via the
    // `cacheLatestChatOnMessageUpdate` function, but it can be a bit
    // slow to update. Below we handle it manually:

    await firestore()
        .collection('draftchatCaching')
        .doc(chatId)
        .update({'latestMessage.data.seen': seen});
};
