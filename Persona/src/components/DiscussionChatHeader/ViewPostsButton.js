import {BlurView} from '@react-native-community/blur';
import React from 'react';
import {TouchableOpacity} from 'react-native';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import {Text} from 'react-native';
import colors from 'resources/colors';

export default function ViewPostsButton({small = false, navigation}) {
    const navToPosts = () => {
        navigation.navigate('Forum');
    };

    return (
        <TouchableOpacity
            hitSlop={{top: 10, bottom: 10, left: 5, right: 5}}
            style={{borderColor: 'blue', borderWidth: 0}}
            onPress={navToPosts}>
            {Platform.OS === 'android' ? (
                <View
                    blurType={'chromeMaterialDark'}
                    blurRadius={11}
                    blurAmount={3}
                    reducedTransparencyFallbackColor="black"
                    style={{
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingLeft: small ? 10 : 12,
                        paddingRight: small ? 10 : 12,
                        padding: small ? 3 : 5,
                        backgroundColor: colors.paleBackground,
                        borderRadius: 12,
                        marginTop: small ? 0 : 10,
                        marginBottom: small ? 0 : 10,
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            fontSize: small ? 12 : 14,
                            color: colors.postAction,
                            fontFamily: fonts.semibold,
                            padding: small ? 0 : 2,
                        }}>
                        Posts
                    </Text>
                </View>
            ) : (
                <BlurView
                    blurType={'chromeMaterialDark'}
                    blurRadius={11}
                    blurAmount={8}
                    reducedTransparencyFallbackColor="black"
                    style={{
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingLeft: small ? 10 : 12,
                        paddingRight: small ? 10 : 12,
                        padding: small ? 3 : 5,
                        backgroundColor: colors.paleBackground,
                        borderRadius: 12,
                        marginTop: small ? 0 : 10,
                        marginBottom: small ? 0 : 10,
                    }}>
                    <Text
                        style={{
                            ...baseText,
                            fontSize: small ? 12 : 14,
                            color: colors.postAction,
                            fontFamily: fonts.semibold,
                            padding: small ? 0 : 2,
                        }}>
                        Posts
                    </Text>
                </BlurView>
            )}
        </TouchableOpacity>
    );
}
