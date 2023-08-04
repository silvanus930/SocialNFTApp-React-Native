import React from 'react';
import {
    View,
    TouchableOpacity,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import images from 'resources/images';
import getResizedImageUrl from 'utils/media/resize';
import styles from './styles';

const EntityDisplay = ({entity}) => {
    return (
        <View
            style={styles.entityDisplayContainer}>
            <>
                <TouchableOpacity
                    hitSlop={{top: 10, bottom: 15, left: 15, right: 15}}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <FastImage
                        source={{
                            uri: getResizedImageUrl({
                                origUrl:
                                    entity?.profileImgUrl ||
                                    images.personaDefaultProfileUrl,
                                width: styles.profilePicture.width,
                                height: styles.profilePicture.height,
                            }),
                        }}
                        style={[styles.personaProfilePicture]}
                    />
                </TouchableOpacity>
            </>
        </View>
    );
};

export default EntityDisplay;