import React, { useContext, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import baseText from 'resources/text';
import {
    Keyboard,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    View,
    Text,
    SafeAreaView
} from 'react-native';
import { StatusBar } from 'react-native';
import colors from 'resources/colors';
import CheckBox from '@react-native-community/checkbox';

export const TermsAndConditionModal = (props) => {

    const [isAgree, setIsAgree] = useState(false);


    const license = `PersonaAlpha App End User License Agreement (EULA)

This End User License Agreement (“Agreement”, "EULA") is between you and PersonaAlpha and governs use of this app made available through TestFlight app distribution. By installing PersonaAlpha App, you agree to be bound by this Agreement and understand that there is no tolerance for Objectional Content (see section 5. below) uploaded to the Persona platform via the PersonaAlpha app, or by any other means. If you do not agree with the terms and conditions of this Agreement, you are not entitled to use the PersonaAlpha App.

In order to ensure PersonaAlpha provides the best experience possible for everyone, we strongly enforce a no tolerance policy for objectionable content. If you see inappropriate content, please use the "Report Content feature" in the profile section of the app.

1. Parties

This Agreement is between you and PersonaAlpha only, and not ${Platform.OS === 'ios' ? 'Apple' : 'Google'
        }, Inc. (“${Platform.OS === 'ios' ? 'Apple' : 'Google'
        }”). Notwithstanding the foregoing, you acknowledge that ${Platform.OS === 'ios' ? 'Apple' : 'Google'
        } and its subsidiaries are third party beneficiaries of this Agreement and ${Platform.OS === 'ios' ? 'Apple' : 'Google'
        } has the right to enforce this Agreement against you. PersonaAlpha, not ${Platform.OS === 'ios' ? 'Apple' : 'Google'
        }, is solely responsible for the PersonaAlpha App and its content.

2. Privacy

PersonaAlpha may collect and use information about your usage of the PersonaAlpha App, including certain types of information from and about your device. PersonaAlpha may use this information, as long as it is in a form that does not personally identify you, to measure the use and performance of the PersonaAlpha App as per the needs of the design and development of the Persona app and platform.

3. Limited License

PersonaAlpha grants you a limited, non-exclusive, non-transferable, revocable license to use thePersonaAlpha App for your personal, non-commercial purposes. You may only use the PersonaAlpha App on ${Platform.OS === 'ios' ? 'Apple' : 'Google'
        } devices that you own or control and as permitted by the App Store Terms of Service.

4. Age Restrictions

By using the PersonaAlpha App, you represent and warrant that (a) you are 19 years of age or older and you agree to be bound by this Agreement; (b) if you are under 19 years of age, you have obtained verifiable consent from a parent or legal guardian; and (c) your use of the PersonaAlpha App does not violate any applicable law or regulation. Your access to the PersonaAlpha App may be terminated without warning if PersonaAlpha believes, in its sole discretion, that you are under the age of 19 years and have not obtained verifiable consent from a parent or legal guardian. If you are a parent or legal guardian and you provide your consent to your child's use of the PersonaAlpha App, you agree to be bound by this Agreement in respect to your child's use of the PersonaAlpha App.

5. Objectionable Content Policy

Content may not be submitted to PersonaAlpha, who will moderate all content and ultimately decide whether or not to post a submission to the extent such content includes, is in conjunction with, aids or abets, or is alongside any Objectionable Content. Objectionable Content includes, but is not limited to: (i) sexually explicit materials; (ii) obscene, defamatory, libelous, slanderous, violent and/or unlawful content or profanity; (iii) content that infringes upon the rights of any third party, including copyright, trademark, privacy, publicity or other personal or proprietary right, or that is deceptive or fraudulent; (iv) content that promotes the use or sale of illegal or regulated substances, tobacco products, ammunition and/or firearms; and (v) gambling, including without limitation, any online casino, sports books, bingo or poker.

6. Warranty

PersonaAlpha disclaims all warranties about the PersonaAlpha App to the fullest extent permitted by law. To the extent any warranty exists under law that cannot be disclaimed, PersonaAlpha, not ${Platform.OS === 'ios' ? 'Apple' : 'Google'
        }, shall be solely responsible for such warranty.

7. Maintenance and Support

PersonaAlpha does provide minimal maintenance or support for it at the sole discretion determined by PersonaAlpha; to the extent that any maintenance or support is required by applicable law, PersonaAlpha, not ${Platform.OS === 'ios' ? 'Apple' : 'Google'
        }, shall be obligated to furnish any such maintenance or support.

8. Product Claims

PersonaAlpha, not ${Platform.OS === 'ios' ? 'Apple' : 'Google'
        }, is responsible for addressing any claims by you relating to the PersonaAlpha App or use of it, including, but not limited to: (i) any product liability claim; (ii) any claim that the PersonaAlpha App fails to conform to any applicable legal or regulatory requirement; and (iii) any claim arising under consumer protection or similar legislation. Nothing in this Agreement shall be deemed an admission that you may have such claims.

9. Third Party Intellectual Property Claims

PersonaAlpha shall not be obligated to indemnify or defend you with respect to any third party claim arising out or relating to the PersonaAlpha App. To the extent PersonaAlpha is required to provide indemnification by applicable law, PersonaAlpha, not ${Platform.OS === 'ios' ? 'Apple' : 'Google'
        }, shall be solely responsible for the investigation, defense, settlement and discharge of any claim that the PersonaAlpha App or your use of it infringes any third party intellectual property right.

By signing up for an account on Persona you agree to the above terms of service.`;

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', padding: 20, backgroundColor: colors.background }}>
                <Text style={{ ...baseText, color: colors.text, fontSize: 20 }}>Terms and Conditions</Text>
            </View>

            <ScrollView
                contentContainerStyle={{
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                <Text
                    style={{
                        ...baseText,
                        color: colors.text,
                        marginStart: 40,
                        marginEnd: 40,
                        marginTop: 50,
                        marginBottom: 50,
                    }}>
                    {license}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        margin: 20,
                        marginLeft: 40,
                    }}>
                    <CheckBox
                        tintColors={{ true: colors.text, false: colors.text }}
                        value={isAgree}
                        onValueChange={setIsAgree}
                    />
                    <Text style={{ ...baseText, color: colors.text, fontSize: 18, marginLeft: 10 }}>
                        Accept Terms and Conditions
                    </Text>
                </View>
                {isAgree ? <TouchableOpacity
                    style={{
                        disabled: true,
                        backgroundColor: '#202020',
                        width: '90%',
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: 10,
                        padding: 10,
                    }}
                    onPress={props.onAgree}
                >
                    <Text style={{ ...baseText, color: colors.text, fontSize: 20 }}>
                        Continue
                    </Text>
                </TouchableOpacity> : <View style={{ height: 70 }} />}
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: StatusBar.currentHeight || 0,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        fontSize: 20,
    },
});
