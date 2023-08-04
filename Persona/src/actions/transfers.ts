import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import {BASE_API_URL} from '../../config/urls';

export const getWalletActivityForUser = userRef => {
    return firestore()
        .collection('transfers')
        .where('refs', 'array-contains', userRef)
        .orderBy('createdAt', 'desc');
};

export const refundStripeTransfer = async (stripeChargeId: string) => {
    try {
        const token = await auth().currentUser?.getIdToken(true);

        const response = await fetch(`${BASE_API_URL}/api/stripe/refund`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `${token}`,
            },
            body: JSON.stringify({
                stripeChargeId,
            }),
        });
        const responseJson = await response.text();
        return responseJson;
    } catch (error) {
        console.error(error);
    }
};
