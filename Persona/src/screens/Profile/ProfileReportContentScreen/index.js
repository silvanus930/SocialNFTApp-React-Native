import React from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    Keyboard,
    TextInput,
    TouchableOpacity,
} from 'react-native';

import BlurHeader from 'components/BlurHeader';

//
// TODO: This component should be extracted!
//    Importing now to save time until a better design arrives
import {ReportContentBox} from 'components/ProfileMenuScreen';

import styles from './styles';

const ProfileReportContentScreen = ({route, navigation}) => {
    const onPressGoBack = () => {
        navigation.goBack();
    };

    const onPressShowOptions = () => {
        alert('nope');
    };

    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <ReportContentBox />
            </View>
            <BlurHeader title="Report content" />
        </View>
    );
};

export default ProfileReportContentScreen;
