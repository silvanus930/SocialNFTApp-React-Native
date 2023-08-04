import React from 'react';
import {View, ScrollView} from 'react-native';

import BlurHeader from 'components/BlurHeader';
import MenuItem from 'screens/Profile/components/MenuItem';

import styles from './styles';

const ProfileAccountDetailsScreen = ({route, navigation}) => {
    const {user} = route.params;

    const onPressChangePassword = () => {
        alert('Coming soon!');
    };
    const onPressDeleteAccount = () => {
        alert('Coming soon!');
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.contentContainer}>
                <View style={styles.menuSection}>
                    <MenuItem header="Username" title={user?.userName} />
                    <MenuItem
                        header="Email address"
                        title={user?.email}
                        isLastItem={true}
                    />
                </View>
                <View style={styles.menuSection}>
                    <MenuItem
                        icon={'menuIconAccount'}
                        title="Change password"
                        onPress={onPressChangePassword}
                    />
                    <MenuItem
                        icon={'menuIconAccount'}
                        title="Delete account"
                        titleColor={'#B15F5F'}
                        isLastItem={true}
                        onPress={onPressDeleteAccount}
                    />
                </View>
            </ScrollView>
            <BlurHeader title="Account details" />
        </View>
    );
};

export default ProfileAccountDetailsScreen;
