import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import React from 'react';
import messaging from '@react-native-firebase/messaging';

const Root = props => {
    // Register background handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        return;
    });

    return <App />;
};

AppRegistry.registerComponent(appName, () => Root);
