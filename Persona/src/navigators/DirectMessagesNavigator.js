import React, {useEffect, useState, useContext} from 'react';
import {View, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

import {
    DirectMessageListScreen,
    DirectMessageChatScreen,
} from 'screens/DirectMessages';

const DirectMessageNavigator = ({route, navigation, children}) => {
    const setToggleBottom = route?.params?.setToggleBottom;
    const openToThreadID = route?.params?.openToThreadID;
    const scrollToMessageID = route?.params?.scrollToMessageID;

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}>
            <Stack.Screen
                name="DM_Home"
                component={DirectMessageListScreen}
                initialParams={{
                    tabNavigation: navigation,
                    setToggleBottom: setToggleBottom,
                    scrollToMessageID: scrollToMessageID,
                    openToThreadID: openToThreadID,
                }}
            />
            <Stack.Screen
                name="DM_Chat"
                component={DirectMessageChatScreen}
                initialParams={{
                    tabNavigation: navigation,
                    setToggleBottom: setToggleBottom,
                    scrollToMessageID: scrollToMessageID,
                    openToThreadID: openToThreadID,
                }}
            />
        </Stack.Navigator>
    );
};

export default DirectMessageNavigator;
