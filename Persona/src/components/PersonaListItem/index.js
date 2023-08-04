import React, {useEffect} from 'react';
import fonts from 'resources/fonts';
import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import Timestamp from 'components/Timestamp';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Animated, {Layout} from 'react-native-reanimated';
import colors from 'resources/colors';
import images from 'resources/images';
import getResizedImageUrl from 'utils/media/resize';
import {GlobalStateContext} from 'state/GlobalState';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {PostStateRefContext} from 'state/PostStateRef';
import {vanillaPersona} from 'state/PersonaState';
import {usePersonaCacheEditSeconds, selectLayout} from 'utils/helpers';
import {propsAreEqual} from 'utils/propsAreEqual';
import baseText from 'resources/text';
import CommunityChat from './components/CommunityChat';
import GettingStarted from './components/GettingStarted';
import styles from './styles';
import {updateProfileContext} from 'actions/profile';

let profileModeStyles = {
    marginLeft: 17,
    width: 30,
    height: 30,
    borderRadius: 30,
    borderColor: colors.darkSeperator,
    borderWidth: 0,
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PersonaListItem = ({
    closeLeftDrawer,
    navigation,
    large,
    shouldHighlight,
    persona,
    personaTouchedMap,
}) => {
    const myCurrentUserID = auth().currentUser.uid;
    const {personaMap} = React.useContext(GlobalStateContext);
    const [progressIndicator, setProgressIndicator] = React.useState('');
    const [response, setResponse] = React.useState(null);
    const [deleting, setDeleting] = React.useState(false);

    const unreadCount = persona?.unreadCount;
    let lastEditAt = Math.max(
        persona?.lastActive?.seconds ?? 0,
        usePersonaCacheEditSeconds(
            personaMap,
            persona.pid,
            persona?.publishDate?.seconds || 0,
            personaTouchedMap,
        ),
    );

    const personaProfileImgUrl = persona?.profileImgUrl
        ? getResizedImageUrl({
              width: styles.profileModeStyles({persona}).width,
              height: styles.profileModeStyles({persona}).height,
              origUrl: persona?.profileImgUrl
                  ? persona.profileImgUrl
                  : images.personaDefaultProfileUrl,
          })
        : images.personaDefaultProfileUrl;

    const personaContext = React.useContext(PersonaStateRefContext);
    const postContext = React.useContext(PostStateRefContext);

    const onPressPersona = React.useCallback(async () => {
        personaContext.current.csetState({
            openFromTop: false,
            persona: {...vanillaPersona, ...persona},
            identityPersona: {...vanillaPersona, ...persona},
            edit: true,
            new: false,
            posted: false,
            pid: persona?.pid,
            openToThreadID: null,
            scrollToMessageID: null,
            threadID: null,
        });

        navigation.goBack(); // what does this do?
        navigation.goBack(); // ensures we navigate away from any depth in the stack, say the settings screen or a post

        closeLeftDrawer();
        updateProfileContext(persona?.pid);
    }, [closeLeftDrawer, navigation, persona, persona?.pid]);

    if (persona?.pid === 'gettingstarted') {
        if (persona?.feed === 'profile') {
            return;
        }
        return (
            <GettingStarted
                closeLeftDrawer={closeLeftDrawer}
                shouldHighlight={shouldHighlight}
            />
        );
    }
    if (persona?.pid === 'communitychat') {
        if (persona?.feed === 'profile') {
            return;
        }
        return (
            <CommunityChat
                personaTouchedMap={personaTouchedMap}
                chatActivity={persona}
                closeLeftDrawer={closeLeftDrawer}
                shouldHighlight={shouldHighlight}
            />
        );
    }

    return (
        <AnimatedTouchable
            layout={selectLayout(Layout)}
            onPress={onPressPersona}
            style={styles.listItem({deleting})}>
            <>
                <Animated.View
                    style={styles.centerContainer}
                    layout={selectLayout(Layout)}>
                    <Animated.View
                        style={styles.listItemInnerContainer}
                        layout={selectLayout(Layout)}>
                        {progressIndicator === 'busy' && (
                            <View
                                style={{
                                    ...styles.loadingIndicator,
                                    top: large ? 20 : 6,
                                    left: large ? 75 : 57,
                                }}>
                                <ActivityIndicator
                                    size="large"
                                    color={colors.text}
                                />
                            </View>
                        )}

                        <FastImage
                            source={{
                                uri: personaProfileImgUrl,
                            }}
                            style={styles.profileModeStyles({persona})}
                        />
                        <Animated.View
                            style={styles.listItemContentContainer}
                            layout={selectLayout(Layout)}>
                            <Animated.Text
                                layout={selectLayout(Layout)}
                                style={[
                                    styles.textStyle,
                                    shouldHighlight
                                        ? styles.textStyleHighlight
                                        : null,
                                ]}>
                                {persona?.name !== '' ? (
                                    persona?.name
                                ) : (
                                    <Text style={styles.unnamed}>Unnamed</Text>
                                )}
                            </Animated.Text>
                            {persona?.private && (
                                <Animated.View
                                    style={styles.privateContainer}
                                    layout={selectLayout(Layout)}>
                                    <FontAwesome
                                        name={
                                            persona?.private
                                                ? 'eye-slash'
                                                : 'eye'
                                        }
                                        color={colors.timestamp}
                                        style={styles.privateIcon}
                                        size={16}
                                    />
                                </Animated.View>
                            )}
                            {unreadCount > 0 ? (
                                <Animated.View
                                    layout={selectLayout(Layout)}
                                    style={[
                                        styles.timestampContainer,
                                        [
                                            {
                                                backgroundColor: '#933D38',
                                            },
                                        ],
                                    ]}>
                                    <Text
                                        style={{
                                            ...baseText,
                                            fontSize: 12,
                                            fontFamily: fonts.timestamp,
                                            fontWeight: '500',
                                        }}>
                                        {unreadCount}
                                    </Text>
                                </Animated.View>
                            ) : null}
                            <Animated.View
                                style={styles.timestampContainer}
                                layout={selectLayout(Layout)}>
                                <Timestamp seconds={lastEditAt} />
                            </Animated.View>
                        </Animated.View>
                    </Animated.View>
                </Animated.View>
            </>
        </AnimatedTouchable>
    );
};

export default React.memo(PersonaListItem, propsAreEqual);
