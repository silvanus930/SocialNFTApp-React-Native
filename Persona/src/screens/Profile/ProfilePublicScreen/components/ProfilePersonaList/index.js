import React, {useContext, useRef, useCallback} from 'react';
import {TouchableOpacity, View, Animated} from 'react-native';
import auth from '@react-native-firebase/auth';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {NFTModalStateRefContext} from 'state/NFTModalStateRef';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {GlobalStateContext} from 'state/GlobalState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

import ProfilePersona from 'components/ProfilePersona';

import {getPersonaCacheTimestamp} from 'utils/helpers';
import {propsAreEqual} from 'utils/propsAreEqual';
import {useNavToPersonaChat} from 'hooks/navigationHooks';

import styles from './styles';

const ProfilePersonaList = ({
    personaVoice = false,
    navigation,
    userID,
    headerComponent,
}) => {
    const {personaList, personaMap} = useContext(GlobalStateContext);
    const {
        current: {personaCacheMap},
    } = useContext(GlobalStateRefContext);
    const personaContextRef = useContext(PersonaStateRefContext);
    const profileModalContextRef = useContext(ProfileModalStateRefContext);
    const {
        current: {csetState, showToggle},
    } = useContext(NFTModalStateRefContext);
    const communityContextRef = useContext(CommunityStateRefContext);
    const navToPersonaChat = useNavToPersonaChat(navigation);

    const ref = useRef();
    const animatedOffset = useRef(new Animated.Value(0)).current;
    const onScroll = Animated.event(
        [{nativeEvent: {contentOffset: {y: animatedOffset}}}],
        {
            useNativeDriver: true,
        },
    );

    let data =
        auth().currentUser?.uid === userID
            ? personaList
            : Object.values(personaMap).filter(
                  p => !p.deleted && p?.authors?.includes(userID),
              );

    data = data.filter(p => !p.deleted && !p?.private);
    if (personaVoice) {
        data = Object.keys(personaMap)
            .map(pid => personaMap[pid])
            .filter(persona => persona.parentPersonaID === userID)
            .filter(
                p => !p.deleted && (!p.private || p?.authors?.includes(userID)),
            );
    }

    data = data.sort((a, b) => {
        return (
            getPersonaCacheTimestamp(
                b?.pid,
                b?.publishDate?.seconds || 0,
                personaCacheMap,
            ) -
            getPersonaCacheTimestamp(
                a?.pid,
                a?.publishDate?.seconds || 0,
                personaCacheMap,
            )
        );
    });

    const onPressPersona = useCallback(
        item => {
            personaContextRef.current.csetState({
                persona: item,
                identityPersona: item,
            });
            navToPersonaChat({
                chatDocPath: `personas/${item?.pid}/chats/all`,
                personaName: item?.name,
                personaKey: item?.pid,
                communityID: communityContextRef.current.currentCommunity,
                personaProfileImgUrl: item.profileImgUrl,
            });

            profileModalContextRef.current.csetState({showToggle: false});
            try {
                profileModalContextRef.current.closeRightDrawer &&
                    profileModalContextRef.current.closeRightDrawer();
            } catch (e) {
                console.log('failed to close the right drawer');
            }
        },
        [navigation, communityContextRef?.current?.currentCommunity],
    );

    const showNFTModal = useCallback(
        item => {
            console.log('called showNFTModal', item);
            csetState({
                userID: userID,
                showToggle: !showToggle,
                persona: item,
                personaID: item?.pid,
                communityID: item.cid,
            });
        },
        [showToggle, csetState, userID],
    );

    const renderProfileItem = useCallback(
        ({item, index}) => {
            return (
                <View
                    style={styles.profileItemContainer(
                        index,
                        filteredPersonaList,
                    )}>
                    <TouchableOpacity
                        disabled={auth().currentUser.uid !== userID}
                        onPress={() => showNFTModal(item)}>
                        <ProfilePersona
                            userID={userID}
                            showName={true}
                            navigation={navigation}
                            persona={item}
                            personaID={item?.pid}
                            index={index}
                        />
                    </TouchableOpacity>
                </View>
            );
        },
        [
            userID,
            auth().currentUser?.uid,
            onPressPersona,
            navigation,
            showNFTModal,
        ],
    );

    let communityMap = communityContextRef?.current?.communityMap;
    const communityNFTs = communityMap
        ? Object.keys(communityMap)
              .filter(key => communityMap[key]?.members.includes(userID))
              .map(key => communityMap[key])
        : [];

    let filteredPersonaList = communityNFTs.concat(data);

    const keyExtractor = useCallback(item => item?.pid, []);

    const footerComponent = () => {
        return <View style={styles.flatListFooterContainer}></View>;
    };

    return (
        <Animated.FlatList
            ref={ref}
            columnWrapperStyle={styles.flatListColumnWrapper}
            style={styles.container}
            bounces={false}
            removeClippedSubviews={true}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            extraData={data}
            numColumns={2}
            data={filteredPersonaList}
            showsVerticalScrollIndicator={false}
            keyExtractor={keyExtractor}
            listKey={'ProfilePersonaList' + Date.now().toString()}
            renderItem={renderProfileItem}
            onScroll={onScroll}
            ListHeaderComponent={headerComponent}
            ListFooterComponent={footerComponent}
        />
    );
};

export default React.memo(ProfilePersonaList, propsAreEqual);
