import AppNavigator from './src/navigators/AppNavigator';
import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import CommunityState from './src/state/CommunityState';
import CommunityStateRef from './src/state/CommunityStateRef';
import GlobalStateRef from './src/state/GlobalStateRef';
import GlobalState from './src/state/GlobalState';
import {Platform, UIManager} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar} from 'react-native';
import '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import {navigationRef} from './src/navigators/RootNavigator';
import {enableMapSet} from 'immer';
import colors from './src/resources/colors';
import {loadVectorIconFonts} from './src/resources/vector-icon-fonts';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import * as Sentry from '@sentry/react-native';
import {initLocalization} from 'localization';
import {AppDarkTheme} from 'theme';

Sentry.init({
    dsn: 'https://6c7dd3baed2e4837ad76640fc846e5dc@o4504727591256064.ingest.sentry.io/4504727592828928',
    tracesSampleRate: 1.0,
    enableWatchdogTerminationTracking: false,
});

enableMapSet();

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

loadVectorIconFonts();

function App() {
    if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(colors.background);
        StatusBar.setTranslucent(true);
    }
    StatusBar.setBarStyle('light-content');
    StatusBar.setHidden(false);
    initLocalization();
    firestore().settings({
        cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
        persistence: true,
        ssl: true,
    });

        return (
            <GestureHandlerRootView style={{flex: 1}}>
                <SafeAreaProvider>
                    <GlobalState>
                        <GlobalStateRef>
                            <CommunityState>
                                <CommunityStateRef>
                                    <NavigationContainer
                                        ref={navigationRef}
                                        theme={AppDarkTheme}>
                                        <StatusBar
                                            translucent={true}
                                            backgroundColor={'transparent'}
                                        />
                                        <AppNavigator />
                                    </NavigationContainer>
                                </CommunityStateRef>
                            </CommunityState>
                        </GlobalStateRef>
                    </GlobalState>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        );
}

export default Sentry.wrap(App);
