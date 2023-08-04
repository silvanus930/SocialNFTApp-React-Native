import palette from 'resources/palette';
import {StyleSheet, TouchableOpacity, Text, View} from 'react-native';
import images from 'resources/images';
import HeaderBackIcon from 'components/HeaderBackIcon';
import PostDiscussionScreen from 'components/PostDiscussionScreen';
import ActivityChatScreen from 'components/ActivityChatScreen';
import React from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import colors from 'resources/colors';

export function renderActivityChatScreen(Stack, route, parentNavigation) {
    let navigation = parentNavigation;

    return (
        <Stack.Screen
            name="Chat"
            children={({route}) => {
                return (
                    <ActivityChatScreen
                        personaKey={route?.params?.personaKey}
                        personaName={route?.params?.personaName}
                        personaProfileImgUrl={
                            route?.params?.personaProfileImgUrl
                        }
                        navigation={navigation}
                        chatDocPath={route?.params?.chatDocPath}
                        highlightCommentKey={route?.params?.highlightCommentKey}
                        showSeenIndicators={route?.params?.showSeenIndicators}
                        openToThreadID={route.params?.openToThreadID}
                    />
                );
            }}
            options={() => ({
                headerStyle: palette.header.style,
                headerTitleStyle: palette.header.title,
                headerTitle: <></>,
                headerLeft: () => (
                    <View style={{marginLeft: 15}}>
                        <TouchableOpacity
                            hitSlop={{left: 10, right: 30, bottom: 15, top: 10}}
                            onPress={() => {
                                navigation.navigate('Persona');
                            }}>
                            <HeaderBackIcon />
                        </TouchableOpacity>
                    </View>
                ),
                headerRight: () => <></>, // empty element for flexbox scaling
                headerShown: false,
            })}
        />
    );
}

export function renderPostDiscussionScreen(Stack, route, parentNavigation) {
    let navigation = parentNavigation;
    let parentRoute = route;
    return (
        <Stack.Screen
            name="PostDiscussion"
            children={({route}) => {
                return (
                    <PostDiscussionScreen
                        renderFromTop={route?.params?.renderFromTop || false}
                        navigation={navigation}
                        personaKey={
                            route.params?.personaKey
                                ? route?.params?.personaKey
                                : parentRoute?.params?.personaKey
                        }
                        postKey={
                            route.params?.postKey
                                ? route?.params?.postKey
                                : parentRoute?.params?.postKey
                        }
                        communityID={
                            route.params?.communityID
                                ? route?.params?.communityID
                                : parentRoute?.params?.communityID
                        }
                        scrollToMessageID={
                            route.params?.scrollToMessageID
                                ? route?.params?.scrollToMessageID
                                : parentRoute?.params?.scrollToMessageID
                        }
                        openToThreadID={
                            route.params?.openToThreadID
                                ? route?.params?.openToThreadID
                                : parentRoute?.params?.openToThreadID
                        }
                        threadView={
                            route.params?.threadView
                                ? route?.params?.threadView
                                : parentRoute?.params?.threadView
                        }
                    />
                );
            }}
            options={() => ({
                headerStyle: {...palette.header.style, height: 0},
                headerTitleStyle: palette.header.title,
                headerTitle: <></>,
                headerLeft: () => (
                    <View style={palette.header.leftContainer}>
                        <TouchableOpacity
                            hitSlop={{left: 10, right: 30, bottom: 15, top: 10}}
                            onPress={() => navigation.navigate('HomeScreen')}>
                            <AntDesign
                                name={'down'}
                                size={palette.header.icon.size}
                                color={colors.navSubProminent}
                            />
                        </TouchableOpacity>
                    </View>
                ),
                headerRight: () => <></>, // empty element for flexbox scaling
                headerShown: false,
            })}
        />
    );
}

export function renderAllDisplayStacks(Stack, route, parentNavigation) {
    return (
        <>
            {renderPostDiscussionScreen(Stack, route, parentNavigation)}
            {renderActivityChatScreen(Stack, route, parentNavigation)}
        </>
    );
}
