/* eslint-disable react-hooks/rules-of-hooks */
import React, {useCallback, useContext} from 'react';
import {Animated as RNAnimated} from 'react-native';

import auth from '@react-native-firebase/auth';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useNavigation} from '@react-navigation/native';

import FloatingHeader from 'components/FloatingHeader';
import ProfileMenuScreen from 'components/ProfileMenuScreen';
import TabBarTop from 'components/TabBarTop';

import {AnimatedHeaderContext} from 'state/AnimatedHeaderState';
import {PersonaStateContext} from 'state/PersonaState';
import {ProfilePublicScreen} from 'screens/Profile';

import ChatScreen from './ChatScreen';
import PortfolioScreen from './PortfolioScreen';
import TransferScreen from './TransferScreen';
import PostScreen from './PostScreen';

import styles from './styles';

const Tab = createMaterialTopTabNavigator();

function MyTabBar({
    animatedHeaderOptions,
    state,
    descriptors,
    navigation,
    ...rest
}) {
    return (
        <>
            {/* This is the top floating header of the chat screen */}
            <FloatingHeader
                Tabs={null}
                showCommunityHeader={true}
                fullHeaderVisible={true}
                animatedHeaderOptions={animatedHeaderOptions}
            />
            <RNAnimated.View
                style={styles.tabBarTopContainer(animatedHeaderOptions.tabTop)}>
                <TabBarTop
                    state={state}
                    descriptors={descriptors}
                    navigation={navigation}
                    {...rest}
                />
            </RNAnimated.View>
        </>
    );
}

const CommunityProjects = ({route}) => {
    const personaContext = useContext(PersonaStateContext);
    const navigation = useNavigation();

    const animatedHeaderContext = useContext(AnimatedHeaderContext);

    let homeSwitch = personaContext?.persona?.feed
        ? personaContext?.persona?.feed
        : false;
    if (homeSwitch) {
        if (homeSwitch === 'profile') {
            return (
                <ProfilePublicScreen
                    userID={auth().currentUser.uid}
                    navigation={navigation}
                />
            );
        } else if (homeSwitch === 'settings') {
            return <ProfileMenuScreen />;
        } else {
            return <PostScreen />;
        }
    }

    const TabBar = useCallback(
        props => {
            if (Platform.OS !== 'android'){
                            return (
                <MyTabBar
                    {...props}
                    animatedHeaderOptions={animatedHeaderContext}
                />
            );
            }

        },
        [animatedHeaderContext],
    );

    return (
        <Tab.Navigator
            tabBar={TabBar}
            screenOptions={{
                lazy: true,
                swipeEnabled: false,
                tabBarLabelStyle: styles.tabBarLabelStyle,
                tabBarStyle: styles.tabBarStyle,
            }}>
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                initialParams={{
                    route,
                    animatedHeaderOptions: animatedHeaderContext,
                }}
                listeners={({navigation: nav}) => ({
                    tabPress: e => {
                        animatedHeaderContext.onTabPress(e, nav);
                    },
                })}
            />
            <Tab.Screen
                name="Forum"
                component={PostScreen}
                initialParams={{offsetY: animatedHeaderContext.scrollY}}
                listeners={({navigation: nav}) => ({
                    tabPress: e => {
                        animatedHeaderContext.onTabPress(e, nav);
                    },
                })}
            />
            <Tab.Screen
                name="Transfers"
                component={TransferScreen}
                initialParams={{offsetY: animatedHeaderContext.scrollY}}
                listeners={({navigation: nav}) => ({
                    tabPress: e => {
                        animatedHeaderContext.onTabPress(e, nav);
                    },
                })}
            />
            <Tab.Screen
                name="Portfolio"
                component={PortfolioScreen}
                initialParams={{offsetY: animatedHeaderContext.scrollY}}
                listeners={({navigation: nav}) => ({
                    tabPress: e => {
                        animatedHeaderContext.onTabPress(e, nav);
                    },
                })}
            />
        </Tab.Navigator>
    );
};

export default CommunityProjects;
