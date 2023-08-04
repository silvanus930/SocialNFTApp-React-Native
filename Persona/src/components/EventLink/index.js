import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import slugify from 'slugify';
import {baseText} from 'resources';
import styles from './styles';

const EventLink = ({title = '', postKey}) => {
    let link = `https://alpha.persona.nyc/purchase/${slugify(
        `${title} ${postKey}`,
    )}`;
    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <Text style={styles.titleText}>Public link</Text>
                <Text numberOfLines={1} style={styles.linkText}>
                    {link}
                </Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        Clipboard.setString(link);
                    }}>
                    <Text style={{...baseText}}>Copy</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default EventLink;
