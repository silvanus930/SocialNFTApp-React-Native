import React from 'react';
import {clog, cwarn} from 'utils/log';
import _ from 'lodash';
const CUSTOM_LOG_WARN_HEADER = '!! state/NavState';
const log = (...args) =>
    global.LOG_STATE_GLOBAL && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_STATE_GLOBAL && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);
import {
    TextInput,
    ActivityIndicator,
    View,
    Image,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Animated,
    Dimensions,
    Easing,
    LayoutAnimation,
} from 'react-native';

const NavStateContext = React.createContext({
    audioManager: null,
    setRoomState: () => {},
    presenceObjPath: null,
});

export {NavStateContext};

export default class NavState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            screen: 'home',
        };
    }

    csetState = newState => {
        this.setState(newState);
    };

    render() {
        return (
            <NavStateContext.Provider
                value={{
                    screen: this.state.screen,
                    csetState: this.csetState,
                }}>
                {this.props.children}
            </NavStateContext.Provider>
        );
    }
}
