import React, {
    createContext,
    useMemo,
    useRef,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {Animated} from 'react-native';

export const AnimatedTabBarContext = createContext({
    setTabBarHeight: () => {},
    tabBarPosition: 0,
    tabBarStylePersona: {},
    tabBarStyleDMs: {},
    setTabBarStyles: () => {},
    hideTabBar: () => {},
});

export default function AnimatedTabBarState({children}) {
    const tabBarPosition = useRef(new Animated.Value(0)).current;
    const tabBarPositionDMs = useRef(new Animated.Value(0)).current;
    const [tabBarHeightPosition, setTabBarHeight] = useState({
        tabBarHeight: 0,
        TARGET_POSITION: 0,
        navigation: null,
    });
    const cachedTabBarHeight = useRef(0);
    const cachedTargetPosition = useRef(0);
    const tabBarVisible = useRef(new Animated.Value(0)).current;
    const offset = useRef(
        new Animated.Value(tabBarHeightPosition.TARGET_POSITION),
    );

    const tabBarStylePersona = useRef(null);

    const tabBarStyleDMs = useRef(null);

    useEffect(() => {
        cachedTabBarHeight.current = tabBarHeightPosition.tabBarHeight;
        cachedTargetPosition.current = tabBarHeightPosition.TARGET_POSITION;
        offset.current = tabBarHeightPosition.TARGET_POSITION;
        tabBarStylePersona.current = {
            transform: [
                {
                    translateY: Animated.add(
                        tabBarPosition,
                        Animated.multiply(tabBarVisible, offset.current),
                    ).interpolate({
                        inputRange: [
                            -cachedTargetPosition.current,
                            0,
                            cachedTargetPosition.current,
                        ],
                        outputRange: [
                            cachedTabBarHeight.current,
                            cachedTabBarHeight.current,
                            0,
                        ],
                        extrapolate: 'clamp',
                    }),
                },
            ],
            position: 'absolute',
        };

        tabBarStyleDMs.current = {
            transform: [
                {
                    translateY: tabBarPositionDMs,
                },
            ],
            position: 'absolute',
        };
        const navigation = tabBarHeightPosition.navigation;
        if (navigation) {
            if (navigation.getState().index === 0) {
                tabBarHeightPosition.navigation?.setOptions({
                    tabBarStyle: tabBarStylePersona.current,
                });
            } else if (navigation.getState().index === 1) {
                tabBarHeightPosition.navigation?.setOptions({
                    tabBarStyle: tabBarStyleDMs.current,
                });
            }
        }
    }, [
        tabBarHeightPosition,
        tabBarPosition,
        tabBarPositionDMs,
        tabBarVisible,
    ]);

    const setTabBarStyles = useCallback(
        (val, nav) => {
            if (nav.getState().index > 1) {
                nav.setOptions({tabBarStyle: {display: val ? 'flex' : 'none'}});
            } else if (nav.getState().index === 1) {
                nav.setOptions({
                    tabBarStyle: tabBarStyleDMs.current,
                });
                Animated.timing(tabBarPositionDMs, {
                    toValue: !val * cachedTabBarHeight.current,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            } else {
                tabBarVisible.setValue(val ? 1 : 0);
                nav.setOptions({
                    tabBarStyle: tabBarStylePersona.current,
                });
            }
        },
        [tabBarPositionDMs, tabBarVisible],
    );

    const state = useMemo(() => {
        return {
            setTabBarHeight,
            tabBarPosition,
            tabBarStylePersona: tabBarStylePersona.current,
            tabBarStyleDMs: tabBarStyleDMs.current,
            setTabBarStyles,
        };
    }, [setTabBarStyles, tabBarPosition]);

    return (
        <AnimatedTabBarContext.Provider value={state}>
            {children}
        </AnimatedTabBarContext.Provider>
    );
}
