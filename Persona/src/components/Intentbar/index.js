import React, {useState, memo} from 'react';
import {Dimensions} from 'react-native';
import {TabView, TabBar} from 'react-native-tab-view';

import MemberRoute from './components/MemberRoute';
import InviteRoute from './components/InviteRoute';
import IntentHeader from './components/IntentHeader';

import {propsAreEqual} from 'utils/propsAreEqual';

function IntentList({navigation, parentNavigation, closeRightDrawer}) {
    const defaultNavState = {
        index: 0,
        routes: [
            {key: 'members', title: 'Members'},
            {key: 'invites', title: 'Invites'},
        ],
    };
    const [navigationState, setNavigationState] = useState(defaultNavState);

    const renderTabBar = props => (
        <TabBar
            {...props}
            indicatorStyle={{backgroundColor: 'white'}}
            style={{backgroundColor: '#292C2E'}}
        />
    );

    const renderScene = ({route}) => {
        switch (route.key) {
            case 'members':
                return (
                    <MemberRoute
                        navigation={navigation}
                        parentNavigation={parentNavigation}
                        closeRightDrawer={closeRightDrawer}
                    />
                );
            case 'invites':
                return <InviteRoute />;
            default:
                return null;
        }
    };

    return (
        <>
            <IntentHeader />
            <TabView
                navigationState={navigationState}
                renderScene={renderScene}
                onIndexChange={index =>
                    setNavigationState({...navigationState, index})
                }
                initialLayout={{width: Dimensions.get('window').width}}
                style={{marginTop: -48, width: '85%'}}
                swipeEnabled={true}
                renderTabBar={renderTabBar}
                animationEnabled={false}
            />
        </>
    );
}

export default memo(IntentList, propsAreEqual);
