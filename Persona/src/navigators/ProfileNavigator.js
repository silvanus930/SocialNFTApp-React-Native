import React, {useEffect, useState, useContext} from 'react';
import {View, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {UserCommunityCompleteDialogStateContext} from 'state/UserAutoCompleteDialogContext';
import BookmarksScreen from 'components/BookmarksScreen';

import {
    ProfileMainScreen,
    ProfileAccountDetailsScreen,
    ProfilePublicScreen,
    ProfileWalletScreen,
    ProfileReportContentScreen,
} from 'screens/Profile';

const Stack = createNativeStackNavigator();

const ProfileNavigator = ({route, navigation, children}) => {
    const setToggleBottom = route?.params?.setToggleBottom;

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}>
            <Stack.Screen
                name="ProfileMain"
                component={ProfileMainScreen}
                initialParams={{
                    tabNavigation: navigation,
                    setToggleBottom: setToggleBottom,
                }}
            />
            <Stack.Screen
                name="ProfileAccountDetails"
                component={ProfileAccountDetailsScreen}
                initialParams={{
                    tabNavigation: navigation,
                    setToggleBottom: setToggleBottom,
                }}
            />
            <Stack.Screen
                name="ProfilePublic"
                component={ProfilePublicScreen}
                initialParams={{
                    tabNavigation: navigation,
                    setToggleBottom: setToggleBottom,
                }}
            />
            <Stack.Screen
                name="ProfileWallet"
                component={ProfileWalletScreen}
                initialParams={{
                    tabNavigation: navigation,
                    setToggleBottom: setToggleBottom,
                }}
            />

            <Stack.Screen
                name="Bookmarks"
                component={BookmarksScreen}
                initialParams={{
                    tabNavigation: navigation,
                    setToggleBottom: setToggleBottom,
                }}
                options={{
                    headerShown: true,
                    headerTitle: 'My Bookmarks',
                }}></Stack.Screen>

            <Stack.Screen
                name="ProfileReportContent"
                component={ProfileReportContentScreen}
                initialParams={{
                    tabNavigation: navigation,
                    setToggleBottom: setToggleBottom,
                }}
            />
        </Stack.Navigator>
    );
};

export default ProfileNavigator;
