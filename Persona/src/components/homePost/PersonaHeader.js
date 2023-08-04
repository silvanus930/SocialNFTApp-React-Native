import isEqual from 'lodash.isequal';
import React from 'react';
import {Platform, StyleSheet, TextInput, View} from 'react-native';
import colors from 'resources/colors';
import baseText from 'resources/text';

const options = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
};

import firestore from '@react-native-firebase/firestore';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import fonts from 'resources/fonts';
import palette from 'resources/palette';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import {updateProfileName} from 'actions/profile';

export const AutoSaveName = React.memo(AutoSaveNameMemo);
function AutoSaveNameMemo({myPersona, initialName, personaID, editAllowed}) {
    const personaStateRefContext = React.useContext(PersonaStateRefContext);

    const [personaName, setPersonaName] = React.useState();
    /*
  const setPersonaName = React.useCallback((name) => {
    setPersonaNme(name);
    let persona = personaStateRefContext?.current?.persona ? personaStateRefContext?.current?.persona : {};
    personaStateRefContext.current.csetState({persona: {...persona, name: name}});

  }, [setPersonaNme,personaStateRefContext, personaStateRefContext.current]);

    */
    const defaultName = 'Unnamed Persona';
    React.useEffect(() => {
        if (initialName === defaultName) {
            setPersonaName('');
        } else {
            setPersonaName(initialName);
        }
    }, [initialName]);

    const updateBio = React.useCallback(() => {
        if (initialName !== personaName && editAllowed) {
            //console.log('set new name', personaID, personaName, initialName);
            let nameToSet = personaName;
            if (personaName === '') {
                nameToSet = defaultName;
            }
            updateProfileName(personaID, nameToSet);
        }
    }, [initialName, personaName, personaID, editAllowed]);

    return (
        <View style={{borderColor: 'orange', borderWidth: 0}}>
            <TextInput
                onFocus={() => {
                    if (editAllowed) {
                        ReactNativeHapticFeedback.trigger(
                            'impactLight',
                            options,
                        );
                    }
                }}
                scrollEnabled={false}
                onChangeText={setPersonaName}
                onBlur={updateBio}
                editable={editAllowed}
                placeholder={defaultName}
                placeholderTextColor={
                    myPersona ? colors.textFaded2 : colors.text
                }
                multiline
                value={personaName}
                paddingRight={0}
                paddingLeft={0}
                padding={0}
                style={{
                    ...baseText,
                    flex: 0,
                    flexWrap: 'wrap',
                    fontFamily: fonts.semibold,
                    fontSize: 20,
                    lineHeight: null,
                    marginTop: Platform.OS === 'ios' ? 0 : 0,
                    color: colors.text,
                    marginBottom: -5,
                    marginRight: -0.5,
                    padding: 0,
                    borderWidth: 0,
                    margin: 0,
                }}
            />
        </View>
    );
}

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

const FLOATING_HEADER_SIZE = 42;

const Styles = StyleSheet.create({
    floatingHeaderProfilePic: {
        height: 37,
        width: 37,
        borderRadius: 70,
        marginLeft: 2.5,
    },
    floatingHeaderTouch: {
        zIndex: 5,
        marginLeft: 1,
        height: FLOATING_HEADER_SIZE,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    floatingHeaderBackground: {
        height: FLOATING_HEADER_SIZE + (Platform.OS === 'android') * 0.5,
        marginTop: -FLOATING_HEADER_SIZE - (Platform.OS === 'android'),
        zIndex: 5,
        paddingRight: 10,
        elevation: 1,
    },
    timeline: {
        ...palette.timeline.line,
        left: -19,
        bottom: -80,
        height: 80,
        position: 'absolute',
    },
    blurView: {
        borderColor: 'blue',
        borderWidth: 0,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    centerContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    bioContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        marginLeft: 13,
        marginTop: Platform.OS === 'ios' ? 8 : 0,
        flex: 3.5,
    },
    prfilePicture: {
        borderRadius: 8,
        marginLeft: 2,
    },
    prfileParent: {
        borderRadius: 70,
        width: 14,
        height: 14,
        left: 0,
        borderColor: '#8d8d8d',
    },
    nameText: {
        color: 'white',
        fontFamily: fonts.medium,
        fontSize: 12,
    },
});
