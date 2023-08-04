import React, {useRef, useCallback, useContext} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';

import FloatingHeader from 'components/FloatingHeader';
import fonts from 'resources/fonts';
import {PersonaStateRefContext} from 'state/PersonaStateRef';
import baseText from 'resources/text';
import firestore from '@react-native-firebase/firestore';
import colors from 'resources/colors';
import {GlobalStateContext} from 'state/GlobalState';
import {
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Animated as RNAnimated,
} from 'react-native';
import {CommunityStateRefContext} from 'state/CommunityStateRef';

export default function EditScreen({field = 'name'}) {
    console.log('rendering EditScreen');
    let navigation = useNavigation();
    const {personaMap} = useContext(GlobalStateContext);
    const {
        current: {communityMap, currentCommunity},
    } = useContext(CommunityStateRefContext);
    const {
        current: {persona},
    } = useContext(PersonaStateRefContext);

    const entityType = persona?.pid ? 'project' : 'community';
    const entityID = persona?.pid || currentCommunity;
    const entityName = persona?.name || communityMap[currentCommunity]?.name;
    const animatedOffset = useRef(new RNAnimated.Value(0)).current;
    const entity =
        entityType === 'project'
            ? personaMap[entityID]
            : communityMap[entityID];

    const [fieldValue, setFieldValue] = React.useState(entity[field]);
    const [fieldTempValue, setFieldTempValue] = React.useState(entity[field]);

    const save = React.useCallback(async () => {
        console.log('called save', entityType, entityID, fieldValue);
        const doc =
            entityType === 'project'
                ? firestore().collection('personas').doc(entityID)
                : firestore().collection('communities').doc(entityID);
        await doc.set({[field]: fieldValue}, {merge: true});
        navigation.goBack();
    }, [entityType, entityID, fieldValue]);

    useFocusEffect(
        useCallback(() => {
            return save;
        }, [save]),
    );

    return (
        <View>
            <View style={{height: 80}} />
            <FloatingHeader back={true} animatedOffset={animatedOffset} />
            <View
                style={{
                    padding: 10,
                    marginStart: 40,
                    marginEnd: 40,
                    marginTop: 60,
                }}>
                <Text style={{...baseText}}>
                    Edit {field} for {entityType}{' '}
                    <Text style={{fontFamily: fonts.semibold}}>
                        {entityName}
                    </Text>
                </Text>
            </View>
            <View>
                <View
                    style={{
                        marginStart: 40,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginEnd: 40,
                        padding: 10,
                        borderRadius: 8,
                        marginTop: 20,
                        backgroundColor: colors.paleBackground,
                    }}>
                    <View
                        style={{
                            borderColor: 'orange',
                            borderWidth: 0,
                            flex: 1,
                            justifyContent: 'flex-start',
                        }}>
                        <TextInput
                            multiline={true}
                            editable={true}
                            keyboardAppearance={'dark'}
                            textAlignVertical={'top'}
                            justifyContext={'left'}
                            autoFocus={true}
                            style={{
                                fontFamily: fonts.regular,
                                borderRadius: 8,
                                padding: 10,
                                alignItems: 'center',
                                fontSize: 18,
                                color: colors.brightText,
                            }}
                            placeholder={field}
                            color={colors.textBright}
                            placeholderTextColor={colors.maxFaded}
                            value={fieldTempValue}
                            onChangeText={setFieldTempValue}
                        />
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        setFieldValue(fieldTempValue);
                        if (fieldTempValue === entity[field]) {
                            navigation.goBack();
                        }
                    }}
                    style={{
                        height: 52,
                        marginStart: 40,
                        marginEnd: 40,
                        alignItems: 'center',
                        padding: 15,
                        borderRadius: 8,
                        marginTop: 20,
                        backgroundColor: colors.paleBackground,
                    }}>
                    <Text
                        style={{
                            fontSize: 16,
                            color: colors.postAction,
                            fontFamily: fonts.bold,
                        }}>
                        Submit
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export const EditName = () => {
    return <EditScreen field={'name'} />;
};

export const EditBio = () => {
    return <EditScreen field={'bio'} />;
};
