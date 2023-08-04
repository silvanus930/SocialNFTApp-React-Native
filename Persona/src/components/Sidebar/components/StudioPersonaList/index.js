import React, {useEffect} from 'react';

import {
    Keyboard,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    StyleSheet,
    LayoutAnimation,
    Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {FlashList} from '@shopify/flash-list';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import Animated, {withTiming, Layout} from 'react-native-reanimated';

import PersonaListItem from 'components/PersonaListItem';
import {FullScreenMediaDispatchContext} from 'state/FullScreenMediaState';
import CreateNewPersona from 'components/CreateNewPersona';

import {vanillaPersona} from 'state/PersonaState';
import {PersonaStateContext} from 'state/PersonaState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {DrawerOpenStateContext} from 'state/DrawerState';

import {colors} from 'resources';

import CommunityProfileHeader from './components/CommunityProfileHeader';

import usePersonaList from 'hooks/usePersonaList';
import {selectLayout} from 'utils/helpers';

// Used in StudioPersonaList
const PersonaList = ({
    parentNavigation,
    navigation,
    currentCommunity,
    closeLeftDrawer,
    personaList,
    personaTouchedMap,
    showCommunityList,
}) => {
    console.log('[Render] PersonaList, ', personaList.length);

    const personaContext = React.useContext(PersonaStateContext);
    const {dispatch: mediaDispatch} = React.useContext(
        FullScreenMediaDispatchContext,
    );

    const persona = personaContext?.persona;
    const keyExtractor = React.useCallback(item => item?.pid);

    const closeLeftDrawerWrapped = React.useCallback(() => {
        mediaDispatch({type: 'clearMediaPost'});
        closeLeftDrawer();
    }, []);

    const listRef = React.useRef();

    useEffect(() => {
        listRef.current?.prepareForLayoutAnimationRender();
    }, [showCommunityList]);

    const renderItem = React.useCallback(
        ({item}) => {
            if (Platform.OS === 'android') {
                LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                );
            }
            return (
                <PersonaListItemContainer
                    closeLeftDrawer={closeLeftDrawerWrapped}
                    item={item}
                    parentNavigation={parentNavigation}
                    navigation={navigation}
                    personaTouchedMap={personaTouchedMap}
                />
            );
        },
        [
            closeLeftDrawerWrapped,
            parentNavigation,
            navigation,
            personaTouchedMap,
            personaList,
        ],
    );

    return React.useMemo(
        () =>
            persona?.feed !== 'settings' &&
            persona?.feed !== 'my' &&
            persona?.feed !== 'profile' ? (
                <View
                    style={[
                        {
                            flex: 1,
                        },
                    ]}>
                    <View
                        style={[
                            {
                                flex: 1,
                                marginRight: -60,
                            },
                        ]}>
                        <FlashList
                            ref={listRef}
                            estimatedItemSize={50}
                            data={personaList}
                            keyExtractor={keyExtractor}
                            renderItem={renderItem}
                            contentContainerStyle={{paddingRight: 60}}
                        />
                    </View>

                    <CreateNewPersona
                        closeLeftDrawer={closeLeftDrawer}
                        navigation={navigation}
                    />
                </View>
            ) : null,
        [
            persona?.feed,
            personaList,
            keyExtractor,
            renderItem,
            closeLeftDrawer,
            navigation,
            showCommunityList,
        ],
    );
};

// Used in StudioPersonaList
const PersonaListItemContainer = props => {
    const personaContext = React.useContext(PersonaStateContext);
    const shouldHighlight = personaContext.persona?.pid === props.item?.pid;
    return React.useMemo(
        () => (
            <WrappedPersonaListItem
                {...props}
                shouldHighlight={shouldHighlight}
                personaTouchedMap={props.personaTouchedMap}
            />
        ),
        [props, shouldHighlight],
    );
};

// Used in PersonaListItemContainer
const WrappedPersonaListItem = ({
    closeLeftDrawer,
    item,
    navigation,
    shouldHighlight,
    personaTouchedMap,
}) => {
    return (
        <View
            style={[
                {
                    paddingBottom: 0,
                    backgroundColor: null,
                },
            ]}>
            <Animated.View
                layout={selectLayout(Layout)}
                style={{
                    borderWidth: 0,
                    borderColor: 'red',
                    marginLeft: 0,
                }}>
                <Animated.View
                    layout={selectLayout(Layout)}
                    style={{
                        backgroundColor: shouldHighlight
                            ? colors.paleBackground
                            : null,
                    }}>
                    <PersonaListItem
                        closeLeftDrawer={closeLeftDrawer}
                        editable={true}
                        showAuthors={false}
                        navigation={navigation}
                        large={false}
                        persona={item}
                        showInviteSummary={true}
                        shouldHighlight={shouldHighlight}
                        personaTouchedMap={personaTouchedMap}
                    />
                </Animated.View>

                <View
                    style={{
                        flexDirection: 'row',
                        borderColor: 'blue',
                        borderWidth: 0,
                        zIndex: 800,
                        elevation: 800,
                    }}>
                    <View
                        style={{
                            borderColor: 'yellow',
                            borderWidth: 0,
                            flex: 1,
                            elevation: 1000,
                            zIndex: 1000,
                        }}
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const StudioPersonaList = ({
    closeLeftDrawer,
    navigation,
    parentNavigation,
    currentCommunity,
    showCommunityList,
}) => {
    const {personaList, personaTouchedMap} = usePersonaList();
    const CustomLayoutTransition = values => {
        'worklet';
        return {
            animations: {
                width: withTiming(values.targetWidth),
                originX: withTiming(values.targetOriginX),
                originY: withTiming(values.targetOriginY),
                height: withTiming(values.targetHeight),
            },
            initialValues: {
                originX: values.currentOriginX,
                originY: values.currentOriginY,
                width: values.currentWidth,
                height: values.currentHeight,
            },
        };
    };

    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [personaList]);

    return (
        <Animated.View
            style={[styles.container, {paddingBottom: useBottomTabBarHeight()}]}
            layout={selectLayout(Layout)}>
            <CommunityProfileHeader
                navigation={navigation}
                closeLeftDrawer={closeLeftDrawer}
                numChannels={personaList?.length - 2}
            />
            <View style={styles.listContainer}>
                <PersonaList
                    parentNavigation={parentNavigation}
                    navigation={navigation}
                    currentCommunity={currentCommunity}
                    closeLeftDrawer={closeLeftDrawer}
                    personaList={personaList}
                    personaTouchedMap={personaTouchedMap}
                    showCommunityList={showCommunityList}
                />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderLeftColor: colors.seperatorLineColor,
        borderLeftWidth: 0.4,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        flex: 1,
    },
    listContainer: {
        flex: 1,
    },
});

export default StudioPersonaList;
