import React, {useContext, useCallback} from 'react';
import baseText from 'resources/text';
import {
    FlatList,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    LayoutAnimation,
    Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {UserAutocompleteContext} from 'state/UserAutocompleteState';
import images from 'resources/images';
import colors from 'resources/colors';
import getResizedImageUrl from 'utils/media/resize';
import auth from '@react-native-firebase/auth';
import {
    getRoomKeysFromPresencePath,
    isPersonaAccessible,
} from 'utils/helpers';
import {PresenceFeedStateRefContext} from 'state/PresenceFeedStateRef';
import {PresenceFeedStateContext} from 'state/PresenceFeedState';
import {PresenceStateContext} from 'state/PresenceState';
import { CommunityStateRefContext } from 'state/CommunityStateRef';
import { CommunityStateContext } from 'state/CommunityState';

export default ({numResults = 3, style, showPings = false, isDM, personaID}) => {
    const {
        current: {userMap,personaMap},
    } = useContext(GlobalStateRefContext);
    const communityContextRef = React.useContext(CommunityStateRefContext);
    let people
    let currentCommunity = communityContextRef?.current.currentCommunity
    // let userMap = communityContextRef?.current?.userMap;
    if(personaID){
        let persona = personaMap[personaID];
        if(persona?.private){
            people = persona?.authors
        }else{
            people = communityContextRef?.current.communityMap[currentCommunity]?.members
        }
    } else{
        people = communityContextRef?.current.communityMap[currentCommunity]?.members
    }
    const communityContext = React.useContext(CommunityStateContext);
    let communityUserMap = {}
    for (let i = 0; i < people?.length; i++) {
        if(userMap[people[i]]?.human){
            communityUserMap[people[i]] = userMap[people[i]]
        }
    }
    // remove all elements which do not have human
    const {dialogAllowed, query, setQuery, setSelectedUser} = useContext(
        UserAutocompleteContext,
    );

    const filterData = _query => {
        if (_query === null) {
            return null;
        }
        const cleanedQuery = _query
            .replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^`{|}~']/g, '')
            .trim();
        const regex = new RegExp(`^${cleanedQuery}`, 'i');
        const result = Object.values(communityUserMap)
            .filter(user => {
                return user.human && !user.test && regex.test(user?.userName);
            })
            .slice(0, numResults);
        return result;
    };

    const keyExtractor = useCallback(item => {
        return item.id;
    }, []);

    const renderItem = useCallback(
        ({item}) => (
            <UserItem
                item={item}
                setQuery={setQuery}
                setSelectedUser={setSelectedUser}
                showPings={showPings}
            />
        ),
        [setQuery, setSelectedUser, showPings],
    );

    const data = filterData(query);

    const showAutoComplete =
        dialogAllowed && query !== null && data?.length > 0;
    if (Platform.OS === 'ios' && showAutoComplete) {
        // todo - for some reason on android layout animation fails when items are remvoed
        //  and crashes the app :(
        LayoutAnimation.configureNext(
            LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'),
        );
    }
    return showAutoComplete ? (
        <FlatList
            style={{
                backgroundColor: colors.studioBackground,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: colors.seperatorLineColor,
                ...style,
                marginTop: -80,
            }}
            keyboardShouldPersistTaps="always"
            scrollEnabled={false}
            data={filterData(query)}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
        />
    ) : null;
};

function UserItem({item, setSelectedUser, setQuery, showPings}) {
    const myUserID = auth().currentUser?.uid;
    const presenceState = React.useContext(PresenceStateContext);
    const presenceFeed = React.useContext(PresenceFeedStateContext);

    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);

    const presenceFeedStateContextRef = React.useContext(
        PresenceFeedStateRefContext,
    );
    //const intents = presenceFeedStateContextRef.current.intents;
    const handleOnPress = () => {
        setSelectedUser(item?.userName);
        setQuery(null);
    };
    const presenceObjPath = presenceState.presenceObjPath;
    const {roomPostID, roomPersonaID} = getRoomKeysFromPresencePath({
        presenceObjPath,
    });
    /*const userIsLive = getUserIsLive({
        userHeartbeat: intents[item.id]?.heartbeat,
    });*/
    const userIsLive = true;
    const persona = personaMap[roomPersonaID];
    const shouldHaveAccess = isPersonaAccessible({persona, userID: item.id});
    const myUser = myUserID === item.id;
    return (
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity onPress={handleOnPress} style={Styles.container}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <FastImage
                        style={Styles.profilePicture}
                        source={{
                            uri: item.profileImgUrl
                                ? getResizedImageUrl({
                                      origUrl:
                                          item.profileImgUrl ||
                                          images.userDefaultProfileUrl,
                                      height: Styles.profilePicture,
                                      width: Styles.profilePicture,
                                  })
                                : images.userDefaultProfileUrl,
                        }}
                    />

                    <Text style={{...baseText, color: 'white', fontSize: 13}}>
                        {item?.userName}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const Styles = StyleSheet.create({
    container: {
        backgroundColor: colors.studioBackground,
        borderColor: colors.seperatorLineColor,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 15,
        paddingRight: 15,
        flex: 1,
    },
    profilePicture: {
        height: 25,
        width: 25,
        borderRadius: 38,
        marginRight: 5,
        borderColor: colors.profileImageOutline,
        borderWidth: 0.1,
    },
});
