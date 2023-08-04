import React, { useState } from 'react';
import {
    View,
    Alert,
    Text,
    Modal,
    TouchableOpacity,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import CheckBox from '@react-native-community/checkbox';

import { colors } from 'resources';

import styles from './styles';

const ReportContentModal = ({ showReportModal, setShowReportModal }) => {

    const [isSelectedReport, setSelectionReport] = useState(false);
    const [isSelectedBlock, setSelectionBlock] = useState(false);

    const handleSelectionReport = () => {
        setSelectionReport(!isSelectedReport);
    };
    const handleSelectionBlock = () => {
        setSelectionBlock(!isSelectedBlock);
    };

    let newReport = '';
    const submitReport = () => {
        const reportsRef = firestore().collection('reports');
        if (isSelectedReport) {
            newReport =
                newReport +
                ' - Report objectionable user generated content \n';
        }
        if (isSelectedBlock) {
            newReport = newReport + ' - Request a block of this user \n';
        }

        if (newReport === '') {
            Alert.alert('Please describe the content you find concerning');
            return;
        }

        reportsRef
            .add({
                userID: auth().currentUser.uid,
                timestamp: firestore.Timestamp.now(),
                report: newReport,
                title: 'User Report',
            })
            .then(() => {
                setShowReportModal(false);
                Alert.alert(
                    "Report sent! We'll follow up with you by contacting you directl!",
                );
            });
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showReportModal}
            >
            <View
                style={styles.container}>
                <TouchableOpacity
                    onPress={() => setShowReportModal(false)}
                    style={styles.buttonContainer}>
                    <Icon
                        name="close"
                        size={20}
                        color={colors.text}
                        style={styles.buttonIcon}
                    />
                </TouchableOpacity>

                <Text
                    style={styles.headerTextStyle}>
                    Please describe to us the content you find concerning{' '}
                    about
                </Text>
                <View>
                    <View
                        style={styles.checkBoxContainer}>
                        <CheckBox
                            style={styles.checkBoxStyle}
                            boxType="square"
                            value={isSelectedReport}
                            onValueChange={handleSelectionReport}
                        />
                        <Text
                            style={styles.checkBoxText}>
                            {'Report objectionable user generated\ncontent'}
                        </Text>
                    </View>
                    <View
                        style={styles.checkBoxContainer}>
                        <CheckBox
                            style={styles.checkBoxStyle}
                            boxType="square"
                            value={isSelectedBlock}
                            onValueChange={handleSelectionBlock}
                        />
                        <Text
                            style={styles.checkBoxText}>
                            {
                                'Request a block of the user that posted\nthis content'
                            }
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={submitReport}
                    style={{
                        height: 40,
                    }}>
                    <View
                        style={[
                            styles.sendIcon,
                            styles.submitReport,
                        ]}>
                        <Icon
                            name="send"
                            size={24}
                            color={colors.actionText}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

export default ReportContentModal;