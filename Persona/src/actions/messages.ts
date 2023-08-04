import firestore from '@react-native-firebase/firestore';
import {SYSTEM_DM_PERSONA_ID} from 'config/personas';
import {getServerTimestamp} from './constants';

export const markDirectMessageAsSeen = async ({cachedChat, userId}: any) => {
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
        [userId]: getServerTimestamp(),
    };

    sourceDocRef.update({seen}, {merge: true});

    // The cached doc's `seen` will be updated automatically via the
    // `cacheLatestChatOnMessageUpdate` function, but it can be a bit
    // slow to update. Below we handle it manually:

    await firestore()
        .collection('draftchatCaching')
        .doc(chatId)
        .update({'latestMessage.data.seen': seen});
};
