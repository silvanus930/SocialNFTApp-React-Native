import dynamicLinks from '@react-native-firebase/dynamic-links';
import firestore from '@react-native-firebase/firestore';
import Share from 'react-native-share';
import Clipboard from '@react-native-clipboard/clipboard';

// Firebae Dynamic link configurations
// these configurations should be placed on .env file
// which is not created on this project!
const FIRESTORE_LINK_CODE_COLLECTION_NAME = 'linkCodes';
const DYNAMIC_LINK_URL = 'https://alpha.persona.nyc/?inviteCode=';
const DYNAMIC_LINK_PREFIX = 'https://persona.page.link'; //
const ANDROID_PCKAGE_NAME = 'com.persona.personaalpha';
const ANDROUD_MINUMU_VERSION = '1.0.0';
const ANDROID_STORE_FALLBACK_URL =
    'https://play.google.com/store/apps/details?id=com.persona.personaalpha&pcampaignid=fdl_short&url=https://alpha.persona.nyc&pli=1';
const IOS_APP_BUNDLE = 'com.Persona.PersonaAlpha';
const IOS_APP_STORE_FALLBACK_URL = 'https://testflight.apple.com/join/XxFGOuxf';
const IOS_APP_STORE_ID = '1553014737';

// Strings should be save on localization and use the keys for future translations
const SOCIAL_MEDIA_INVITE_TITLE = 'Persona invite via Link';
const SOCIAL_MEDIA_INVITE_DESCRIPTION = 'Join Persona community';
const SHARE_MESSAGE_TITLE = 'Share via';

export type LinkCodeType = {
    destinations: any[];
    usedBy: string[];
    createdBy: string;
    isValid: boolean;
    expiryDate: string;
    personaId: string | undefined;
    communityId: string | undefined;
};

const genarateCode = () => {
    const inviteCode = Array.from(Array(5), () =>
        Math.floor(Math.random() * 36).toString(36),
    )
        .join('')
        .toUpperCase();

    return inviteCode;
};

const checkForUserInviteCode = async (
    userId: string,
    perosnaId: string | undefined,
    communityId: string | undefined,
) => {
    let query = firestore()
        .collection(FIRESTORE_LINK_CODE_COLLECTION_NAME)
        .where('createdBy', '==', userId)
        .where('isValid', '==', true)
        .where('expiryDate', '>=', new Date().toISOString().split('T')[0])
        .where('communityId', '==', communityId)
        .where('personaId', '==', perosnaId);

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
        console.log('codeQuerySnapshot is empty');
        return null;
    } else {
        console.log('codeQuerySnapshot values');
        console.log(querySnapshot.docs);
        return querySnapshot.docs[0];
    }
};

const createUserInviteCode = async (inviteCodeObject: LinkCodeType) => {
    const code = genarateCode();
    await firestore()
        .collection(FIRESTORE_LINK_CODE_COLLECTION_NAME)
        .doc(code)
        .set({
            ...inviteCodeObject,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    return code;
};

const updateUserInviteCode = async (
    inviteCodeId: string,
    inviteCodeObject: Partial<LinkCodeType>,
) => {
    return await firestore()
        .collection(FIRESTORE_LINK_CODE_COLLECTION_NAME)
        .doc(inviteCodeId)
        .update({
            ...inviteCodeObject,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
};

const revokeInviteCode = async (inviteCodeId: string) => {
    return await firestore()
        .collection(FIRESTORE_LINK_CODE_COLLECTION_NAME)
        .doc(inviteCodeId)
        .update({
            isValid: false,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
};

const buildLink = (code: string): Promise<string> => {
    console.log('buildLink');
    const link = dynamicLinks().buildShortLink({
        // this is the deep link with parameters
        link: `${DYNAMIC_LINK_URL}${code}`,
        // domainUriPrefix is created in your Firebase console
        domainUriPrefix: DYNAMIC_LINK_PREFIX,
        // optional setup which updates Firebase analytics campaign
        android: {
            packageName: ANDROID_PCKAGE_NAME,
            fallbackUrl: ANDROID_STORE_FALLBACK_URL,
            minimumVersion: ANDROUD_MINUMU_VERSION,
        },
        ios: {
            bundleId: IOS_APP_BUNDLE,
            fallbackUrl: IOS_APP_STORE_FALLBACK_URL,
            appStoreId: IOS_APP_STORE_ID,
        },
        social: {
            title: SOCIAL_MEDIA_INVITE_TITLE,
            descriptionText: SOCIAL_MEDIA_INVITE_DESCRIPTION,
        },
    });
    return link;
};

const addWeeks = (date: Date, weeks: number): Date => {
    date.setDate(date.getDate() + 7 * weeks);
    return date;
};

const shareLink = (link: string) => {
    const shareOptions = {
        title: SHARE_MESSAGE_TITLE,
        message: link,
    };
    Share.open(shareOptions)
        .then(res => {
            console.log(res);
        })
        .catch(err => {
            err && console.log(err);
        });
};

const copyLinkToClipboard = (link: string) => {
    Clipboard.setString(link);
};

export {
    buildLink,
    addWeeks,
    shareLink,
    revokeInviteCode,
    copyLinkToClipboard,
    updateUserInviteCode,
    createUserInviteCode,
    checkForUserInviteCode,
};
