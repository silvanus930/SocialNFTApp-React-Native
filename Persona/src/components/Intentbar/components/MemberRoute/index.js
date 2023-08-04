import React from 'react';
import {View} from 'react-native';
import WrappedMemberList from './components/MemberList';
import WrappedRoomList from './components/RoomList';

function MembersRouteMemo({navigation, parentNavigation, closeRightDrawer}) {
    return (
        <>
            <View style={{flex: 0}}>
                <WrappedRoomList
                    small={true}
                    navigation={navigation}
                    parentNavigation={parentNavigation}
                    closeRightDrawer={closeRightDrawer}
                    nonReactive={false}
                />
            </View>
            <View style={{flex: 1}}>
                <WrappedMemberList
                    navigation={navigation}
                    parentNavigation={parentNavigation}
                    closeRightDrawer={closeRightDrawer}
                />
            </View>
        </>
    );
}

export default MembersRouteMemo;
