import React, {
    createContext,
    useMemo,
    useRef,
    useCallback,
    useContext,
    useEffect,
} from 'react';
import {Animated, Platform} from 'react-native';
import {CommunityStateContext} from './CommunityState';
import {PersonaStateContext} from './PersonaState';
import {useNavigation} from '@react-navigation/native';

export const HEADER_HEIGHT = Platform.OS === 'ios' ? 182 : 187;

export const AnimatedHeaderContext = createContext({
    tabTop: 0,
    scrollY: 0,
    resetHeader: () => {},
    hideHeader: () => {},
    onTabPress: () => {},
});

export default function AnimatedHeaderState({children}) {
    const scrollYs = useRef([0, 0, 0, 0]).current;

    const currentTabIndex = React.useRef(0);

    const tabAnimating = React.useRef(false);
    const isOffset = React.useRef(false);

    const scrollY = React.useRef(new Animated.Value(0)).current;
    scrollY.addListener(({value}) => {
        if (!tabAnimating.current) {
            scrollYs[currentTabIndex.current] =
                value -
                (isOffset.current
                    ? (Platform.OS === 'android' ? 2 : 1) * 100
                    : 0);
        }
    });

    const communityContext = useContext(CommunityStateContext);
    const prevCommunityContext = useRef(communityContext);
    const personaContext = useContext(PersonaStateContext);
    const prevPersonaContext = useRef(personaContext);

    const navigation = useNavigation();

    useEffect(() => {
        tabAnimating.current = true;
        isOffset.current = false;
        const prevScrollY = scrollYs[currentTabIndex.current];
        scrollY.setValue(Math.min(100, prevScrollY));
        scrollY.flattenOffset();
        currentTabIndex.current =
            navigation.getState().routes[0].state?.index || 0;
        if (
            prevCommunityContext.current.currentCommunity !==
                communityContext.currentCommunity ||
            prevPersonaContext.current.persona?.pid !==
                personaContext.persona?.pid
        ) {
            for (let i = 0; i < scrollYs.length; i++) {
                scrollYs[i] = 0;
            }
        }
        let toValue = 0;
        if (navigation.getState().index === 0 && currentTabIndex.current > 0) {
            toValue = scrollYs[currentTabIndex.current];
        }
        Animated.timing(scrollY, {
            toValue: toValue,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            tabAnimating.current = false;
            prevCommunityContext.current = communityContext;
            prevPersonaContext.current = personaContext;
        });
    }, [communityContext, personaContext, scrollYs, scrollY, navigation]);

    const onTabPress = React.useCallback(
        (e, navigation) => {
            tabAnimating.current = true;
            isOffset.current = false;
            const prevScrollY = scrollYs[currentTabIndex.current];
            scrollY.setValue(Math.min(100, prevScrollY));
            scrollY.flattenOffset();
            currentTabIndex.current =
                navigation.getState().routes.findIndex(elem => {
                    return elem.key === e.target;
                }) || 0;
            Animated.timing(scrollY, {
                toValue: Math.min(100, scrollYs[currentTabIndex.current]),
                duration: 250,
                useNativeDriver: true,
            }).start(() => {
                tabAnimating.current = false;
            });
        },
        [scrollY, scrollYs],
    );

    const tabTop = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -60],
        extrapolate: 'clamp',
    });

    const resetHeader = useCallback(() => {
        if (tabAnimating.current) {
            return;
        }
        scrollY.flattenOffset();
        isOffset.current = false;
        Animated.timing(scrollY, {
            toValue: scrollYs[currentTabIndex.current],
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [scrollY, scrollYs]);

    const hideHeader = useCallback(() => {
        if (tabAnimating.current) {
            return;
        }
        tabAnimating.current = true;
        Animated.timing(scrollY, {
            toValue: 100,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            scrollY.extractOffset();
            isOffset.current = true;
            tabAnimating.current = false;
        });
    }, [scrollY]);

    const state = useMemo(
        () => ({
            tabTop,
            scrollY,
            resetHeader,
            hideHeader,
            onTabPress,
        }),
        [tabTop, scrollY, resetHeader, hideHeader, onTabPress],
    );

    return (
        <AnimatedHeaderContext.Provider value={state}>
            {children}
        </AnimatedHeaderContext.Provider>
    );
}
