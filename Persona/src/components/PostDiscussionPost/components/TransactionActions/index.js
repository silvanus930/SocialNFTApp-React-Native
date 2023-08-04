import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';

import FontAwesome from 'react-native-vector-icons/FontAwesome';

import baseText from 'resources/text';
import colors from 'resources/colors';

import {refundStripeTransfer} from 'actions/transfers';
import {CommunityStateContext} from 'state/CommunityState';
import auth from '@react-native-firebase/auth';

import styles from './styles';

const TransactionActions = ({transfer}) => {
    const {stripeChargeId, refundStatus} = transfer;
    const communityContext = React.useContext(CommunityStateContext);
    const communityMap = communityContext?.communityMap;
    const currentCommunity = communityContext?.currentCommunity;

    const isCurrentUserIsAMember = communityMap[
        currentCommunity
    ]?.members.includes(auth().currentUser?.uid);

    const onPress = () => {
        refundStripeTransfer(stripeChargeId);
    };

    if (isCurrentUserIsAMember && stripeChargeId) {
        if (refundStatus) {
            return (
                <View style={styles.button}>
                    <Text style={{...baseText, marginLeft: 5}}>
                        Refund {refundStatus}
                    </Text>
                </View>
            );
        } else {
            return (
                <TouchableOpacity
                    onPress={onPress}
                    hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                    style={{
                        alignSelf: 'flex-end',
                    }}>
                    <View style={styles.button}>
                        <FontAwesome
                            name={'rotate-left'}
                            size={12}
                            color={colors.textBright}
                        />
                        <Text style={{...baseText, marginLeft: 5}}>Refund</Text>
                    </View>
                </TouchableOpacity>
            );
        }
    }
    return null;
};

export default TransactionActions;
