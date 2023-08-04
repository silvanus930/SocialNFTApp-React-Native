import React from 'react';
import {BlurView} from '@react-native-community/blur';
import isEqual from 'lodash.isequal';
import colors from 'resources/colors';
import {PersonaCreateStateRefContext} from 'state/PersonaCreateStateRef';
import {useNavigation} from '@react-navigation/native';
import {PersonaStateContext} from 'state/PersonaState';
import {PostStateContext} from 'state/PostState';
import Icon from 'react-native-vector-icons/Feather';
import palette from 'resources/palette';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {PresenceStateRefContext} from 'state/PresenceStateRef';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default React.memo(AddPostButton, propsAreEqual);
function AddPostButton({
    disabled = false,
    style = {},
    size = palette.icon.size,
    onLongPress = () => {},
    callbackOnPress = () => {},
    color = colors.text,
}) {
    const presenceContext = React.useContext(PresenceStateRefContext);
    //const presenceContext = React.useContext(PresenceStateContext);
    const personaContext = React.useContext(PersonaStateContext);
    const personaCreateContext = React.useContext(PersonaCreateStateRefContext);
    let persona = personaContext.persona;
    const postContext = React.useContext(PostStateContext);
    let navigation = useNavigation();
    const addPostMemoized = React.useCallback(
        disabled
            ? () => {}
            : async () => {
                  //const addPostMemoized = async () => {
                  //const addPostMemoized = async () => {

                  personaCreateContext.current.csetState({
                      new: false,
                      edit: true,
                      remix: false,
                      persona: persona,
                      identityPersona: persona,
                      personaID: persona?.pid,
                      pid: persona?.pid,
                  });

                  postContext.restoreVanilla({
                      sNew: true,
                      sInit: true,
                  });

                  // NOTE: setting presence context here has a weird effect
                  // on Android that turns HomeScreen black when nav'ing back
                  // from PostCreationScreen.

                  // presenceContext.current.csetState({
                  //   presenceIntent:
                  //     'Creating a new post' +
                  //     (persona?.name ? ` • ${persona.name}` : ''),
                  // });

                  callbackOnPress();

                  navigation &&
                      navigation.navigate('Persona', {
                          screen: 'StudioPostCreation',
                          persona: persona,
                          personaID: persona?.pid,
                          newPost: true,
                          editPost: false,
                          newInvite: true,
                          editInvite: false,
                          screenInit: true,
                          inputPost: null,
                          inputPostID: null,
                      });
              },
        [
            postContext,
            presenceContext,
            personaCreateContext,
            personaContext,
            persona,
            persona?.pid,
        ],
    );
    //};

    if (!personaContext?.persona?.pid) {
        return <></>;
    }

    return Platform.OS === 'android' ? (
        <View
            blurType={'chromeMaterialDark'}
            blurRadius={11}
            blurAmount={1}
            reducedTransparencyFallbackColor="black"
            style={{...Styles.optionsButton, ...style, borderRadius: 12}}>
            <TouchableOpacity
                hitSlop={{
                    top: size * 0.3,
                    bottom: size * 0.3,
                    left: size * 0.3,
                    right: size * 0.3,
                }}
                disabled={disabled}
                onPress={addPostMemoized}
                onLongPress={onLongPress}
                style={{
                    padding: 2,
                    borderRadius: size + 3,
                }}>
                <Icon color={color} name={'plus'} size={size} />
            </TouchableOpacity>
        </View>
    ) : (
        <BlurView
            blurType={'chromeMaterialDark'}
            blurRadius={48}
            blurAmount={1}
            reducedTransparencyFallbackColor="black"
            style={{...Styles.optionsButton, ...style, borderRadius: 12}}>
            <TouchableOpacity
                hitSlop={{
                    top: size * 0.3,
                    bottom: size * 0.3,
                    left: size * 0.3,
                    right: size * 0.3,
                }}
                disabled={disabled}
                onPress={addPostMemoized}
                onLongPress={onLongPress}
                style={{
                    padding: 2,
                    borderRadius: size + 3,
                }}>
                <Icon color={color} name={'plus'} size={size} />
            </TouchableOpacity>
        </BlurView>
    );
}

export const Styles = StyleSheet.create({
    iconMore: {
        height: 15,
        width: 15,
    },
    selectPersonaForHomeIcon: {
        width: 25,
        height: 25,
    },
    optionsButton: {
        alignItems: 'center',
        alignSelf: 'center',
        flex: 0,
        marginLeft: 5,
    },
});
