import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import getResizedImageUrl from 'utils/media/resize';
import images from 'resources/images';

import styles from './styles';

interface ITranferTouchableProps {
    label: string;
    url?: string;
    navTo: () => void;
}

const TransferTouchable: React.FC<ITranferTouchableProps> = ({
    navTo,
    label,
    url,
}) => (
    <TouchableOpacity
        onPress={navTo}
        style={styles.transferTouchable}
        hitSlop={{
            top: 10,
            bottom: 10,
            left: 0,
            right: 0,
        }}
        disabled={false}>
        <FastImage
            source={{
                uri: !!url
                    ? getResizedImageUrl({
                          origUrl: url,
                          width: 20,
                          height: 20,
                      }) || images.userDefaultProfileUrl
                    : images.userDefaultProfileUrl,
            }}
            style={styles.iconTransferPersona}
        />
        <Text numberOfLines={2} style={styles.textTransfer}>
            {label || 'loading...'}
        </Text>
    </TouchableOpacity>
);

export default TransferTouchable;
