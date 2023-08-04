import React from 'react';
import {View, Platform, LayoutAnimation} from 'react-native';

import {DrawerOpenStateContext} from 'state/DrawerState';

import {CommunityStateContext} from 'state/CommunityState';
import {GlobalStateContext} from 'state/GlobalState';

import CommunityList from './components/CommunityList';
import StudioPersonaList from './components/StudioPersonaList';

import {propsAreEqual} from 'utils/propsAreEqual';

import {NativeModules} from 'react-native'; //running native iOS module resignFirstResponder

export function StudioPersonaListProfiled(props) {
    const {showCommunityList, useNativeModuleChat} =
        React.useContext(GlobalStateContext);
    const {
        state: {open},
    } = React.useContext(DrawerOpenStateContext);

    React.useEffect(() => {
        if (Platform.OS === 'ios' && useNativeModuleChat) {
            const swiftUserManager = NativeModules.UserManager;
            if (open) {
                swiftUserManager.sideBarRendered();
            } else {
                swiftUserManager.sideBarRemoved();
            }
        }
    }, [open]);

    return React.useMemo(
        () => (
            <React.Profiler
                id={'StudioPersonaListWrapped'}
                onRender={(id, phase, actualDuration) => {
                    if (actualDuration > 2) {
                        console.log(
                            '========>(StudioPersonaListWrapped.Profiler)',
                            id,
                            phase,
                            actualDuration,
                        );
                    }
                }}>
                <StudioPersonaListWrapped
                    showCommunityList={showCommunityList}
                    {...props}
                />
            </React.Profiler>
        ),
        [props, showCommunityList],
    );
}

function StudioPersonaListWrapped(props) {
    const communityContext = React.useContext(CommunityStateContext);
    const currentCommunity = communityContext?.currentCommunity;

    console.log('[Render] StudioPersonaListWrapped');

    React.useEffect(() => {
        //cancel pending animations for ios
        if (Platform.OS === 'ios') {
            LayoutAnimation.configureNext({});
        } else {
            LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
            );
        }
    }, [props.showCommunityList]);

    return (
        <View
            style={{
                flex: 1,
                flexDirection: 'row',
            }}>
            {props.showCommunityList ? (
                <CommunityList
                    navigation={props.navigation}
                    closeLeftDrawer={props.closeLeftDrawer}
                />
            ) : null}
            <StudioPersonaList {...props} currentCommunity={currentCommunity} />
        </View>
    );
}

export default React.memo(StudioPersonaListProfiled, propsAreEqual);
