import React, {useEffect, useState} from 'react';
import {TouchableWithoutFeedback, View} from 'react-native';
import FastImage from 'react-native-fast-image';

import images from 'resources/images';
import {parseAndGetRefMemo} from 'actions/refs';
import useDebounce from 'hooks/useDebounce';

import TransactionItem from 'components/TransactionItem';
import TransferTouchable from './components/TransferTouchable';

import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';

import styles from './styles';

interface ITransferProps {
    post: any;
    navToPost: any;
    postKey: any;
}

const Transfer: React.FC<ITransferProps> = ({post, navToPost, postKey}) => {
    const {amount, currency, refundStatus, sourceRef, targetRef, email} =
        post.transfer;

    const [source, setSource] = useState<any>({});
    const [target, setTarget] = useState<any>({});

    const getSourceAndTarget = async () => {
        const source = await parseAndGetRefMemo(sourceRef);
        const target = await parseAndGetRefMemo(targetRef);
        setTarget(target);
        setSource(source);
    };

    useEffect(() => {
        getSourceAndTarget();
    }, []);

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );

    const parseEntity = ({data, type, id}: any) => ({
        label: type === 'purchasables' ? email : data?.userName || data?.name,
        url: data?.profileImgUrl,
        navTo: useDebounce(() => {
            if (type !== 'purchasables') {
                profileModalContextRef.current.csetState({
                    userID: type === 'users' ? `${id}` : `PERSONA::${id}`,
                    showToggle: true,
                });
            }
        }, [id]),
    });

    const transferFrom = parseEntity(source);
    const transferTo = parseEntity(target);

    const transactionType = amount >= 0 ? 'Deposit' : 'Withdrawal';

    const title = refundStatus
        ? `${transactionType} - refund ${refundStatus}`
        : undefined;

    const timestamp = post?.publishDate?._seconds || post?.publishDate?.seconds;

    return (
        <TouchableWithoutFeedback delayPressIn={50} onPress={navToPost}>
            <View key={postKey} style={styles.container}>
                <TransactionItem
                    type={transactionType}
                    title={title}
                    amount={amount}
                    currency={currency}
                    timestamp={timestamp}
                />

                <View style={styles.bottomContainer}>
                    <View style={styles.buttomInnerContainer}>
                        <View style={styles.bottomContentContainerLeft}>
                            <TransferTouchable
                                {...(transactionType === 'Withdrawal'
                                    ? transferTo
                                    : transferFrom)}
                            />
                        </View>
                        <View style={styles.iconTransferArrowContainer}>
                            <FastImage
                                source={images.transfersArrow}
                                style={styles.iconTransferArrow}
                            />
                        </View>
                        <View style={styles.bottomContentContainerRight}>
                            <TransferTouchable
                                {...(transactionType === 'Withdrawal'
                                    ? transferFrom
                                    : transferTo)}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default Transfer;
