import parsePhoneNumber from 'libphonenumber-js';
import React, {useState} from 'react';
import {Platform, Text, TextInput, View} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from 'resources/colors';
import flags from 'resources/flags';
import fonts from 'resources/fonts';
import {BaseText} from 'resources/text';

const flagsByCountryCode = {};
flags.map(flag => {
    flagsByCountryCode[flag.code] = flag;
});

const flagsByDialingCode = {};
flags.map(flag => {
    flagsByDialingCode[flag.dial_code.replace('+', '')] = flag;
});

export default function PhoneNumberInput({onChangePhoneNumberCallback}) {
    const [phoneNumber, setPhoneNumber] = useState(null);
    const [countryCode, setCountryCode] = useState('US');
    const [numCountryCode, setNumCountryCode] = useState(1);

    const onChangePhoneNumber = val => {
        setPhoneNumber(val);
        const parsedNumber = parsePhoneNumber(val, countryCode);
        if (!val) {
            setCountryCode('US');
        } else if (
            parsedNumber?.countryCallingCode &&
            parsedNumber?.countryCallingCode !==
                flagsByCountryCode[countryCode].dial_code
        ) {
            setCountryCode(
                flagsByDialingCode[parsedNumber?.countryCallingCode]?.code,
            );
        }

        if (parsedNumber?.number && onChangePhoneNumberCallback) {
            onChangePhoneNumberCallback(parsedNumber?.number);
        }
    };

    const onChangeCountryCode = val => {
        setNumCountryCode(val);
        setCountryCode(flagsByDialingCode[val]?.code);
    };

    return (
        <View
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderColor: '#262626',
                borderWidth: 1,
                backgroundColor: colors.loginInputBackground,
                borderRadius: 8,
                paddingLeft: 10,
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 5,
                    borderColor: 'red',
                    borderWidth: 0,
                }}>
                {Platform.OS === 'android' ? (
                    <>
                        <Text
                            style={{
                                fontSize: 20,
                            }}>
                            +
                        </Text>
                        <TextInput
                            placeholderTextColor={colors.textFaded2}
                            // placeholder="1"
                            keyboardAppearance={'dark'}
                            defaultValue={'1'}
                            // textContentType="telephoneNumber"
                            keyboardType="number-pad"
                            style={{
                                width: 50,
                                fontFamily: fonts.regular,
                                fontSize: 18,
                                color: colors.textBright,
                                backgroundColor: colors.loginInputBackground,
                                padding: 15,
                                paddingLeft: 5,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderLeftWidth: 0,
                                borderColor: 'blue',
                                borderWidth: 0,
                            }}
                            value={numCountryCode.toString()}
                            onChangeText={onChangeCountryCode}
                        />
                    </>
                ) : (
                    <RNPickerSelect
                        // fixAndroidTouchableBug={true}
                        // useNativeAndroidPickerStyle={false}
                        onValueChange={setCountryCode}
                        placeholder={{}}
                        style={{fontFamily: fonts.mono}}
                        touchableWrapperProps={{activeOpacity: 0.2}}
                        items={flags.map(flag => {
                            return {
                                label: `${flag.flag} ${flag.name}`,
                                value: flag.code,
                                color: '#000',
                            };
                        })}>
                        <View
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                borderColor: 'red',
                                borderWidth: 0,
                            }}>
                            <BaseText style={{fontSize: 30, paddingTop: 20}}>
                                {flagsByCountryCode[countryCode]?.flag}
                            </BaseText>
                            <MaterialCommunityIcons
                                name="menu-down"
                                size={22}
                                color={colors.navSubProminent}
                                style={{marginLeft: 2}}
                            />
                        </View>
                    </RNPickerSelect>
                )}
            </View>
            <TextInput
                placeholderTextColor={colors.textFaded2}
                placeholder="Phone number"
                textContentType="telephoneNumber"
                keyboardType="number-pad"
                style={{
                    width: 175,
                    fontFamily: fonts.regular,
                    fontSize: 18,
                    color: colors.textBright,
                    backgroundColor: colors.loginInputBackground,
                    padding: 15,
                    paddingLeft: 5,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderLeftWidth: 0,
                    borderColor: 'blue',
                    borderWidth: 0,
                }}
                value={phoneNumber}
                onChangeText={onChangePhoneNumber}
            />
        </View>
    );
}
