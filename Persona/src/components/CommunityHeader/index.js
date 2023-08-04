import React, {useContext, useState, useEffect, memo, useMemo} from 'react';
import {Animated as RNAnimated, View} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import firestore from '@react-native-firebase/firestore';

import {PersonaStateContext} from 'state/PersonaState';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {colors} from 'resources';

import CommunityDetails from './components/CommunityDetails';
import CommunityBack from './components/CommunityBack';
import CommunityMembership from './components/CommunityMemberShip';
import {propsAreEqual} from 'utils/propsAreEqual';

import styles from './styles';

function CommunityHeader({
    animatedHeaderOptions,
    gap = true,
    communityID,
    chat = false,
    style = {},
    heightMod = 0,
    fullHeaderVisible = true,
}) {
    const personaContext = useContext(PersonaStateContext);
    const personaID = personaContext?.persona?.pid;
    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);
    const communityContextRef = useContext(CommunityStateRefContext);
    let communityMap = communityContextRef?.current?.communityMap;

    const containerHeight = (chat ? 230 : 280) + heightMod;

    const containerTranslateY = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -60],
        extrapolate: 'clamp',
    });

    const AnimatedMaskedView = RNAnimated.createAnimatedComponent(MaskedView);

    const maskTranslate = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -60],
        extrapolate: 'clamp',
    });

    const blurAmount = animatedHeaderOptions.scrollY.interpolate({
        inputRange: [50, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const personaHeaderImg =
        personaMap[personaID]?.headerImgUrl ||
        personaMap[personaID]?.profileImgUrl;

    const communityHeaderImg =
        communityMap[communityID]?.headerImgUrl ||
        communityMap[communityID]?.profileImgUrl;

    const personaTmp = personaID
        ? personaContext?.persona
        : communityMap[communityID];

    const [persona, setPersona] = useState({
        name: personaTmp?.name,
        members: personaTmp?.members,
        authors: personaTmp?.authors,
        open: personaTmp?.open,
        private: personaTmp?.private,
        profileImgUrl: personaTmp?.profileImgUrl,
        headerImgUrl: personaTmp?.headerImgUrl,
    });

    useEffect(() => {
        const isCommunity = !personaContext?.persona?.pid;
        const unsubscribe = firestore()
            .collection(isCommunity ? 'communities' : 'personas')
            .doc(isCommunity ? communityID : personaContext.persona?.pid)
            .onSnapshot(async snap => {
                const data = snap.data();
                setPersona({
                    name: data?.name,
                    members: data?.members,
                    authors: data?.authors,
                    open: data?.open,
                    private: data?.private,
                    profileImgUrl: data?.profileImgUrl,
                    headerImgUrl: data?.headerImgUrl,
                });
            });
        return () => {
            unsubscribe();
        };
    }, [communityID, personaContext.persona?.pid]);

    return useMemo(
        () => (
            <RNAnimated.View
                style={{
                    backgroundColor: colors.gridBackground,
                    flexDirection: 'column',
                    marginTop: gap ? 0 : 6,
                    alignItems: 'center',
                    height: containerHeight,
                    ...style,
                    borderColor: 'white',
                    borderWidth: 0,
                    transform: [{translateY: containerTranslateY}],
                }}>
                <CommunityBack
                    blurAmount={blurAmount}
                    image={personaID ? personaHeaderImg : communityHeaderImg}
                />
                <AnimatedMaskedView
                    androidRenderingMode="software"
                    style={[
                        styles.animatedMaskViewStyle,
                        {
                            transform: [
                                {
                                    translateY: RNAnimated.multiply(
                                        containerTranslateY,
                                        new RNAnimated.Value(-1),
                                    ),
                                },
                            ],
                        },
                    ]}
                    maskElement={
                        <RNAnimated.View
                            style={{
                                height: 120,
                                backgroundColor: 'transparent',
                                transform: [{translateY: maskTranslate}],
                            }}>
                            <LinearGradient
                                colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)']}
                                style={{flex: 1}}
                            />
                        </RNAnimated.View>
                    }>
                    <View style={styles.detailContainer}>
                        <CommunityDetails
                            persona={persona}
                            personaID={personaID}
                            communityID={communityID}
                            fullHeaderVisible={fullHeaderVisible}
                            animatedHeaderOptions={animatedHeaderOptions}
                        />
                        {fullHeaderVisible && (
                            <CommunityMembership
                                persona={persona}
                                animatedHeaderOptions={animatedHeaderOptions}
                            />
                        )}
                    </View>
                </AnimatedMaskedView>
            </RNAnimated.View>
        ),
        [
            persona?.name,
            persona?.open,
            persona?.private,
            persona?.profileImgUrl,
            persona?.headerImgUrl,
            persona?.authors?.length,
            persona?.members?.length,
        ],
    );
}

export default memo(CommunityHeader, propsAreEqual);
