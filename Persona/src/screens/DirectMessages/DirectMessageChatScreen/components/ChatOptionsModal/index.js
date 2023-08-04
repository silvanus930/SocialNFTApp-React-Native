import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {observer} from 'mobx-react-lite';
import {useNavigation} from '@react-navigation/native';
import BottomSheet from 'components/BottomSheet';
import Button from 'components/Button';
import {ReportContentBox} from 'components/ProfileMenuScreen';

import {blockUser} from 'actions/users';

import styles from './styles';

const ChatOptionsModal = observer(
    ({cachedChat, userToDM, showModal, setShowModal}) => {
        const [showReportContentBox, setShowReportContentBox] = useState(false);
        const myUserID = auth().currentUser.uid;
        const navigation = useNavigation();

        const confirmBlockUser = () => {
            Alert.alert(
                'Block User',
                `Do you want to block user, ${userToDM.userName}?`,
                [
                    {text: 'Yes', onPress: doBlockUser},
                    {text: 'No', onPress: () => {}, style: 'cancel'},
                ],
            );
        };

        const doBlockUser = async () => {
            await blockUser(userToDM);
            setShowModal(!showModal);
            navigation.popToTop();
        };
        return (
            <BottomSheet
                snapPoints={['40%']}
                toggleModalVisibility={setShowModal}
                showToggle={showModal}>
                <View style={styles.container}>
                    <TouchableOpacity
                        onPress={confirmBlockUser}
                        style={styles.button}>
                        <Text>Block {userToDM.userName}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowReportContentBox(true)}
                        style={styles.button}>
                        <Text>Report Content</Text>
                    </TouchableOpacity>

                    {showReportContentBox && (
                        <ReportContentBox
                            onComplete={() => setShowReportContentBox(false)}
                        />
                    )}
                </View>
            </BottomSheet>
        );
    },
);

export default ChatOptionsModal;
