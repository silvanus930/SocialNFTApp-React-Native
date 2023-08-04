import React, {useState} from 'react';
import {Text, TouchableOpacity, View, Alert, Modal} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';

import auth from '@react-native-firebase/auth';

import colors from 'resources/colors';
import styles from './styles';

export default function ReportContentModal({
    post,
    showUserName,
    postUserName,
    persona,
    setShowReportModal,
    showReportModal,
}) {
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
                newReport + ' - Report objectionable user generated content \n';
        }
        if (isSelectedBlock) {
            newReport =
                newReport +
                ' - Request a block of the user that posted this content \n';
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
                post: post,
                title: 'Post Report',
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
            visible={showReportModal}>
            <View style={styles.container}>
                <TouchableOpacity
                    onPress={() => setShowReportModal(false)}
                    style={{
                        marginBottom: 20,
                    }}>
                    <Icon
                        name="close"
                        size={20}
                        color={colors.text}
                        style={styles.icon}
                    />
                </TouchableOpacity>

                <Text style={styles.text1}>
                    {
                        'Please describe to us the content you find concerning about'
                    }
                </Text>
                <Text style={styles.text2}>
                    {showUserName ? postUserName : persona.name}'s Post
                </Text>
                <View>
                    <View style={styles.row}>
                        <CheckBox
                            value={isSelectedReport}
                            onValueChange={handleSelectionReport}
                        />
                        <Text style={styles.text3}>
                            {'Report objectionable user generated\ncontent'}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <CheckBox
                            value={isSelectedBlock}
                            onValueChange={handleSelectionBlock}
                        />
                        <Text style={styles.text3}>
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
                    <View style={styles.sendIcon}>
                        <Icon name="send" size={24} color={colors.actionText} />
                    </View>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}
