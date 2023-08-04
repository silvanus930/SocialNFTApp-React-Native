import React, {useContext, useState, useEffect, useCallback} from 'react';
import {
    View,
    Text,
    Platform,
    Appearance,
    Modal,
    ScrollView,
    Alert,
    FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DatePicker from 'react-native-date-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import {format} from 'date-fns';

import {CommunityStateContext} from 'state/CommunityState';
import {PersonaStateContext} from 'state/PersonaState';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {PostStateContext} from 'state/PostState';
import {PostStateRefContext} from 'state/PostStateRef';
import ChannelSelector from '../BaseComponents/ChannelSelector';
import {uploadFiles} from '../BaseComponents/FileUploader';
import {
    MEDIA_IMAGE_POST_QUALITY,
    MEDIA_VIDEO_POST_QUALITY,
} from 'utils/media/compression';
import {POST_MEDIA_TYPE_GALLERY, vanillaPost} from 'state/PostState';
import {colors, baseText} from 'resources';
import styles from './styles';

import ToggleItem from '../BaseComponents/ToggleItem';
import SubTitleText from '../BaseComponents/SubTitleText';
import Header from '../BaseComponents/Header';
import Button from '../BaseComponents/Button';
import TextInputBox from '../BaseComponents/TextInputBox';
import RoundIconButton from '../BaseComponents/RoundIconButton';
import EventReviewModal from '../BaseComponents/EventReviewModal';

import {
    createCommunityPost,
    createPost,
    updatePost,
    updateCommunityPost,
    createPurchasables,
    updatePurchasables,
} from 'actions/posts';
import PostGalleryItem from './components/PostGalleryItem';

const CreatePostEventModal = ({isPost = false}) => {
    const communityContext = useContext(CommunityStateContext);
    const personaContext = useContext(PersonaStateContext);
    const {
        current: {user},
    } = useContext(GlobalStateRefContext);
    const postContext = useContext(PostStateContext);
    const postContextRef = useContext(PostStateRefContext);
    const navigation = useNavigation();
    let personaId = personaContext?.persona?.pid;
    let communityId = communityContext?.currentCommunity;

    const [eventTitle, setEventTitle] = useState('');
    const [eventLocation, setEventLocation] = useState(
        'Persona Studio, New York',
    );
    const [eventDescription, setEventDescription] = useState('');
    const [progressIndicator, setProgressIndicator] = useState('');
    const [channelSelectorValue, setChannelSelectorValue] = useState(
        personaId ? personaId : communityId,
    );
    const [s3GalleryUris, setS3GalleryUris] = useState([]);
    const [s3FileUris, setS3FileUris] = useState([]);

    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [timePickerOpen, setTimePickerOpen] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const now = new Date();
    const end = new Date(now.getTime() + 1000 * 60 * 60 * 4);

    const [startDate, setStartDate] = useState(now);
    const [endDate, setEndDate] = useState(end);
    const [startTime, setStartTime] = useState(now);
    const [endTime, setEndTime] = useState(end);
    const [isStart, setIsStart] = useState(true);

    const [toggleAnonymously, setAnonymously] = useState(false);
    const [toggleOnline, setToggleOnline] = useState(true);
    const [togglePaid, setTogglePaid] = useState(false);
    const [togglePublic, setTogglePublic] = useState(false);

    const [eventPaidValue, setEventPaidValue] = useState('');
    const [eventPaidUnit, setEventPaidUnit] = useState('USD');
    const [headerTitle, setHeaderTitle] = useState(
        isPost ? 'New Post' : 'New Event',
    );
    const [isSelectorDisabled, setIsSelectorDisabled] = useState(false);
    const [isCommunitySelected, setIsCommunitySelected] = useState(!personaId);

    const title = isPost ? 'Post title' : 'Event title';
    const descriptionTitle = isPost ? 'Post description' : 'Event description';
    const descriptionPlaceholder = isPost
        ? 'A few words about you post...'
        : 'A few words about you event...';

    useEffect(() => {
        setHeaderTitle(
            postContext?.edit
                ? headerTitle.replace('New', 'Edit')
                : headerTitle.replace('Edit', 'New'),
        );
        setIsSelectorDisabled(postContext?.edit);
    }, [headerTitle, postContext?.edit]);

    const handleVisible = useCallback(() => {
        postContextRef.current.csetState({
            visible: false,
            edit: false,
            event: false,
        });
    }, [postContextRef]);

    useEffect(() => {
        if (postContext?.visible || postContext?.event) {
            if (!postContext?.edit) {
                clearPostData();
            } else {
                const post = postContext?.post;
                setChannelSelectorValue(personaId || communityId);
                setEventTitle(post?.title);
                setAnonymously(post?.anonymous);
                setEventDescription(post?.text);
                post?.galleryUris && setS3GalleryUris(post?.galleryUris);
                setS3FileUris(post?.fileUris);
                if (postContext?.event) {
                    const _now = new Date();
                    const _end = new Date(_now.getTime() + 4 * 60 * 60 * 1000);
                    const startTimeTmp = post?.event?.eventStartTime?.seconds
                        ? new Date(post?.event?.eventStartTime.seconds * 1000)
                        : _now;
                    const endTimeTmp = post?.event?.eventEndTime?.seconds
                        ? new Date(post?.event?.eventStartTime.seconds * 1000)
                        : _end;
                    setEventPaidValue(post?.event?.basePrice);
                    setEventPaidUnit(post?.event?.basePriceUnit);
                    setToggleOnline(post?.event?.isOnline);
                    setStartTime(startTimeTmp);
                    setEndTime(endTimeTmp);
                    setStartDate(startTimeTmp);
                    setEndDate(endTimeTmp);
                }
            }
        }
    }, [
        clearPostData,
        communityId,
        personaId,
        postContext?.edit,
        postContext?.event,
        postContext?.post,
        postContext?.visible,
    ]);

    // Callback for file upload
    const prePhotoUploadCallback = () => setProgressIndicator('photo');
    const preGalleryUploadCallback = () => setProgressIndicator('gallery');
    const preVideoUploadCallback = () => setProgressIndicator('video');
    const preFileUploadCallback = () => setProgressIndicator('file');

    const postUploadCallback = useCallback(
        (result, error) => {
            setProgressIndicator('');
            if (error) {
                console.log(
                    'ERROR: unable to upload media: ',
                    JSON.stringify(error),
                );
                Alert.alert('Unable to upload media - please try again.');
                return;
            }
            if (result[0].type === 'file') {
                const oldFileUris = Object.assign([], s3FileUris);
                const newFileUris = oldFileUris.concat(result);
                setS3FileUris(newFileUris);
            } else {
                const oldGalleryUris = Object.assign([], s3GalleryUris);
                const newGalleryUris = oldGalleryUris.concat(result);
                setS3GalleryUris(newGalleryUris);
            }
        },
        [s3GalleryUris, s3FileUris],
    );

    const deleteMediaUrlFromGallery = uri => {
        Alert.alert('Delete media', 'Are you sure?', [
            {
                text: 'No',
                onPress: () => console.log('Pressed no'),
                style: 'cancel',
            },
            {
                text: 'Yes',
                onPress: () => {
                    const filteredData = s3GalleryUris.filter(
                        item => item.uri !== uri,
                    );

                    setS3GalleryUris(filteredData);
                },
            },
        ]);
    };

    const deleteFileUrlFromFileUrls = uri => {
        Alert.alert('Delete file', 'Are you sure?', [
            {
                text: 'No',
                onPress: () => console.log('Pressed no'),
                style: 'cancel',
            },
            {
                text: 'Yes',
                onPress: () => {
                    const filteredData = s3FileUris.filter(
                        item => item.uri !== uri,
                    );

                    setS3FileUris(filteredData);
                },
            },
        ]);
    };

    const handlePhotoPicker = useCallback(async () => {
        await uploadFiles(
            'photo',
            {
                mediaType: 'photo',
                compressImageQuality: MEDIA_IMAGE_POST_QUALITY,
                multiple: true,
            },
            prePhotoUploadCallback,
            postUploadCallback,
        );
    }, [postUploadCallback]);

    const handleGalleryPicker = useCallback(async () => {
        await uploadFiles(
            'gallery',
            {
                mediaType: 'any',
                compressImageQuality: MEDIA_IMAGE_POST_QUALITY,
                multiple: true,
            },
            preGalleryUploadCallback,
            postUploadCallback,
        );
    }, [postUploadCallback]);

    const handleVideoPicker = useCallback(async () => {
        await uploadFiles(
            'video',
            {
                mediaType: 'video',
                compressImageQuality: MEDIA_VIDEO_POST_QUALITY,
                multiple: true,
            },
            preVideoUploadCallback,
            postUploadCallback,
        );
    }, [postUploadCallback]);

    const handleFilePicker = useCallback(async () => {
        await uploadFiles(
            'file',
            null,
            preFileUploadCallback,
            postUploadCallback,
        );
    }, [postUploadCallback]);

    const handlePost = async () => {
        let newPost = Object.assign(
            {},
            {
                ...vanillaPost,
                anonymous: toggleAnonymously,
                text: eventDescription,
                title: eventTitle,
                editPublishDate: firestore.Timestamp.now(),
                createDate: firestore.Timestamp.now(),
                editDate: firestore.Timestamp.now(),
                publishDate: firestore.Timestamp.now(),
                deleted: false,
                userID: auth().currentUser.uid,
                userName: user.userName,
                published: true,
                type: 'media',
                galleryUris: s3GalleryUris,
                fileUris: s3FileUris,
                mediaType: POST_MEDIA_TYPE_GALLERY,
            },
        );
        if (postContext?.edit) {
            if (personaId) {
                await updatePost(personaId, postContext?.post?.pid, newPost);
            } else {
                await updateCommunityPost(
                    communityId,
                    postContext?.post?.pid,
                    newPost,
                );
            }
        } else {
            console.log(channelSelectorValue);
            if (!isCommunitySelected) {
                await createPost(channelSelectorValue, newPost);
            } else {
                await createCommunityPost(channelSelectorValue, newPost);
            }
        }
        clearPostData();
        handleVisible();
    };

    const handleEventReview = useCallback(
        () => setShowReviewModal(!showReviewModal),
        [showReviewModal],
    );

    const oneDay = 1000 * 60 * 60 * 24;
    const startDateTime = new Date(
        Math.floor(startDate.getTime() / oneDay) * oneDay +
            (startTime.getTime() % oneDay),
    );
    const endDateTime = new Date(
        Math.floor(endDate.getTime() / oneDay) * oneDay +
            (endTime.getTime() % oneDay),
    );

    const handleEvent = async () => {
        const inviteRef = personaId
            ? firestore().collection('personas').doc(channelSelectorValue)
            : firestore().collection('communities').doc(channelSelectorValue);
        const eventInfo = `${eventLocation}\n ${format(
            startDateTime,
            'MMM d, yyyy HH:mma',
        )} - ${format(endDateTime, 'MMM d, yyyy HH:mma')}`;
        let newEvent = Object.assign(
            {},
            {
                event: {
                    basePrice: Number(eventPaidValue),
                    info: eventInfo,
                    pricing: 'fixed',
                    inviteRef: inviteRef,
                    targetRef: inviteRef,
                    terms: '',
                },
                // --- we will use this schema on V1 event creation ---
                // event: {
                //     targetRef: inviteRef,
                //     inviteRef: inviteRef,
                //     inviteMessage: '',
                //     ticketTypesName: 'Tickets',
                //     address: '202b Plymouth St, Brooklyn, NY 11201',
                //     extra: '',
                //     terms: '',
                //     description: '',
                //     ticketTypes: {
                //         0: {
                //             id: 0,
                //             pricing: 'fixed',
                //             basePrice: Number(eventPaidValue),
                //             name: 'General Admission',
                //             active: true,
                //         },
                //     },
                //     dates: {
                //         0: {
                //             id: 0,
                //             date: '',
                //             startTime: startDateTime,
                //             startTimeTimestamp: endDateTime,
                //             endTime: endDateTime,
                //             endTimeTiemstamp: endDateTime,
                //         },
                //     },
                // },
                anonymous: toggleAnonymously,
                text: eventDescription,
                title: eventTitle,
                editPublishDate: firestore.Timestamp.now(),
                createDate: firestore.Timestamp.now(),
                editDate: firestore.Timestamp.now(),
                publishDate: firestore.Timestamp.now(),
                deleted: false,
                userID: auth().currentUser.uid,
                userName: user.userName,
                published: true,
                type: 'event',
                galleryUris: s3GalleryUris,
                fileUris: s3FileUris,
                mediaType: POST_MEDIA_TYPE_GALLERY,
            },
        );

        if (postContext?.edit) {
            let postRef;
            if (personaId) {
                postRef = await updatePost(
                    personaId,
                    postContext?.post?.pid,
                    newEvent,
                );
            } else {
                postRef = await updateCommunityPost(
                    communityId,
                    postContext?.post?.pid,
                    newEvent,
                );
            }
            await updatePurchasables(postContext?.post?.pid, {
                ...newEvent.event,
                name: newEvent.text,
                postRef: postRef,
            });
        } else {
            let postRef;
            if (!isCommunitySelected) {
                postRef = await createPost(channelSelectorValue, newEvent);
            } else {
                postRef = await createCommunityPost(
                    channelSelectorValue,
                    newEvent,
                );
            }
            await createPurchasables(postRef?.id, {
                ...newEvent.event,
                name: newEvent.text,
                postRef: postRef,
            });
        }
        clearPostData();
        handleVisible();
    };

    const handleWithdrawl = useCallback(() => {
        handleVisible();
        navigation && navigation.navigate('Propose Withdrawal');
    }, [handleVisible, navigation]);

    const clearPostData = useCallback(() => {
        const nowTmp = new Date();
        const endTmp = new Date(nowTmp.getTime() + 1000 * 60 * 60 * 4);
        setAnonymously(false);
        setEventTitle('');
        setEventLocation('Persona Studio, New York');
        setEventDescription('');
        setProgressIndicator(false);
        setS3GalleryUris([]);
        setS3FileUris([]);
        setTimePickerOpen(false);
        setStartDate(nowTmp);
        setEndDate(endTmp);
        setStartTime(nowTmp);
        setEndTime(endTmp);
        setIsStart(false);
        setAnonymously(false);
        setToggleOnline(true);
        setTogglePaid(false);
        setTogglePublic(false);
        setIsCommunitySelected(!personaId);
        setChannelSelectorValue(personaId || communityId);
    }, [personaId, communityId]);

    const renderItemForGallery = ({item}) => {
        if (!item?.uri) {
            return null;
        }
        return (
            <PostGalleryItem
                item={item}
                deleteMediaUrlFromGallery={deleteMediaUrlFromGallery}
                deleteFileUrlFromFileUrls={deleteFileUrlFromFileUrls}
            />
        );
    };

    const s3Uris = s3GalleryUris.concat(s3FileUris);

    return (
        <Modal
            animationType="slide"
            touchAnywhereToClose={true}
            visible={isPost ? postContext?.visible : postContext?.event}>
            <View style={styles.centeredView}>
                <View style={styles.container}>
                    <Header title={headerTitle} setVisible={handleVisible} />
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.scrollView}>
                            <SubTitleText title="Select Channel" />
                            <ChannelSelector
                                selectedValue={channelSelectorValue}
                                setSelectedValue={setChannelSelectorValue}
                                setIsCommunitySelected={setIsCommunitySelected}
                                isDisabled={isSelectorDisabled}
                            />
                            <SubTitleText title={title} />
                            <TextInputBox
                                value={eventTitle}
                                placeholder={'Enter a title'}
                                onChangeText={setEventTitle}
                            />
                            <SubTitleText title={descriptionTitle} />
                            <TextInputBox
                                value={eventDescription}
                                placeholder={descriptionPlaceholder}
                                onChangeText={setEventDescription}
                                multiline={true}
                                height={120}
                            />
                            {/* Component only for Event `Location` & `Pay` */}
                            {!isPost && (
                                <>
                                    <View style={{flexDirection: 'row'}}>
                                        <View style={{flex: 1}}>
                                            <SubTitleText title="Start date" />
                                            <Button
                                                onPress={() => {
                                                    setIsStart(true);
                                                    setDatePickerOpen(true);
                                                }}
                                                title={format(
                                                    startDate,
                                                    'MMM d, yyyy',
                                                )}
                                                noBorder
                                            />
                                        </View>
                                        <View style={{flex: 1}}>
                                            <SubTitleText title="Start time" />
                                            <Button
                                                onPress={() => {
                                                    setIsStart(true);
                                                    setTimePickerOpen(true);
                                                }}
                                                title={format(
                                                    startTime,
                                                    'HH:mma',
                                                )}
                                                noBorder
                                            />
                                        </View>
                                    </View>
                                    <View style={{flexDirection: 'row'}}>
                                        <View style={{flex: 1}}>
                                            <SubTitleText title="End date" />
                                            <Button
                                                onPress={() => {
                                                    setIsStart(false);
                                                    setDatePickerOpen(true);
                                                }}
                                                title={format(
                                                    endDate,
                                                    'MMM d, yyyy',
                                                )}
                                                noBorder
                                            />
                                        </View>
                                        <View style={{flex: 1}}>
                                            <SubTitleText title="End time" />
                                            <Button
                                                onPress={() => {
                                                    setIsStart(false);
                                                    setTimePickerOpen(true);
                                                }}
                                                title={format(
                                                    endTime,
                                                    'HH:mma',
                                                )}
                                                noBorder
                                            />
                                        </View>
                                    </View>
                                    <View>
                                        <DatePicker
                                            modal
                                            mode="date"
                                            minimumDate={
                                                isStart ? now : startDate
                                            }
                                            open={datePickerOpen}
                                            date={isStart ? startDate : endDate}
                                            onConfirm={date => {
                                                setDatePickerOpen(false);
                                                isStart
                                                    ? setStartDate(date)
                                                    : setEndDate(date);
                                            }}
                                            onCancel={() => {
                                                setDatePickerOpen(false);
                                            }}
                                            textColor={
                                                Platform.OS === 'android' ||
                                                Appearance.getColorScheme() ===
                                                    'dark'
                                                    ? baseText.color
                                                    : undefined
                                            }
                                        />
                                        <DatePicker
                                            modal
                                            mode="time"
                                            minimumDate={
                                                isStart ? now : startTime
                                            }
                                            open={timePickerOpen}
                                            date={isStart ? startTime : endTime}
                                            onConfirm={date => {
                                                setTimePickerOpen(false);
                                                isStart
                                                    ? setStartTime(date)
                                                    : setEndTime(date);
                                            }}
                                            onCancel={() => {
                                                setTimePickerOpen(false);
                                            }}
                                            textColor={
                                                Platform.OS === 'android' ||
                                                Appearance.getColorScheme() ===
                                                    'dark'
                                                    ? baseText.color
                                                    : undefined
                                            }
                                        />
                                    </View>
                                    <ToggleItem
                                        icon={'earth'}
                                        iconType="Ionicons"
                                        title="Is it an online event?"
                                        toggleSwitch={{
                                            value: toggleOnline,
                                            toggle: setToggleOnline,
                                        }}
                                    />
                                    {!toggleOnline && (
                                        <View style={{flex: 1}}>
                                            <SubTitleText title="Add location" />
                                            <TextInputBox
                                                value={eventLocation}
                                                placeholder={
                                                    'Persona studio, New York'
                                                }
                                                onChangeText={setEventLocation}
                                            />
                                        </View>
                                    )}
                                    <ToggleItem
                                        icon={'card'}
                                        iconType="Ionicons"
                                        title="Is it a paid event?"
                                        toggleSwitch={{
                                            value: togglePaid,
                                            toggle: setTogglePaid,
                                        }}
                                    />
                                    {togglePaid && (
                                        <View
                                            style={{
                                                flex: 1,
                                                borderColor: 'red',
                                                borderWidth: 0,
                                            }}>
                                            <SubTitleText title="Ticket price" />
                                            <View
                                                style={{flexDirection: 'row'}}>
                                                <TextInputBox
                                                    value={eventPaidValue}
                                                    placeholder={'0.00'}
                                                    onChangeText={
                                                        setEventPaidValue
                                                    }
                                                />
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}
                            {/* Start Media & file picker */}
                            <SubTitleText title="Attach files" />
                            <View style={{flexDirection: 'row'}}>
                                <RoundIconButton
                                    icon={'camera'}
                                    onPress={handlePhotoPicker}
                                    isLoading={progressIndicator === 'photo'}
                                />
                                <RoundIconButton
                                    icon={'image'}
                                    onPress={handleGalleryPicker}
                                    isLoading={progressIndicator === 'gallery'}
                                />
                                <RoundIconButton
                                    icon={'video-camera'}
                                    onPress={handleVideoPicker}
                                    isLoading={progressIndicator === 'video'}
                                />
                                <RoundIconButton
                                    icon={'file'}
                                    onPress={handleFilePicker}
                                    isLoading={progressIndicator === 'file'}
                                />
                            </View>
                            {s3Uris.length > 0 && (
                                <View
                                    style={{
                                        flex: 1,
                                        height: 210,
                                        marginTop: 10,
                                        marginBottom: 10,
                                    }}>
                                    <FlatList
                                        showsHorizontalScrollIndicator={false}
                                        bounces={false}
                                        data={s3Uris}
                                        keyExtractor={item => {
                                            return item?.uri;
                                        }}
                                        renderItem={renderItemForGallery}
                                        horizontal
                                    />
                                </View>
                            )}
                            {/* End Media & file picker */}

                            <SubTitleText title="More" />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginBottom: 10,
                                }}>
                                <Button
                                    onPress={() => {
                                        handleVisible();
                                        postContextRef.current.csetState({
                                            visible: !isPost,
                                            edit: false,
                                            event: isPost,
                                        });
                                    }}
                                    title={
                                        isPost
                                            ? 'Create an event'
                                            : 'Create an post'
                                    }
                                />
                                <Button
                                    onPress={handleWithdrawl}
                                    title="Create an proposal"
                                />
                            </View>
                            <View>
                                <ToggleItem
                                    icon={'eye'}
                                    title="Post anonymously"
                                    toggleSwitch={{
                                        value: toggleAnonymously,
                                        toggle: setAnonymously,
                                    }}
                                />
                                <ToggleItem
                                    icon={'link'}
                                    title="Create public event"
                                    toggleSwitch={{
                                        value: togglePublic,
                                        toggle: setTogglePublic,
                                    }}
                                />
                                <View style={styles.publicURL}>
                                    <Icon
                                        name={'alert-circle'}
                                        color={colors.postAction}
                                        size={25}
                                    />
                                    <Text style={styles.publicURLText}>
                                        This will allow you to create a public
                                        link accessible by everyone across the
                                        internet
                                    </Text>
                                </View>
                                <View style={styles.postButton}>
                                    <Button
                                        onPress={
                                            isPost
                                                ? handlePost
                                                : handleEventReview
                                        }
                                        title={
                                            eventDescription.length
                                                ? isPost
                                                    ? 'Post'
                                                    : 'Proceed to review'
                                                : 'Enter details to proceed'
                                        }
                                        style={{
                                            borderWidth: 0,
                                            backgroundColor:
                                                eventDescription.length
                                                    ? '#375E8A'
                                                    : '#203349',
                                        }}
                                        textStyle={{
                                            color: eventDescription.length
                                                ? 'white'
                                                : '#375E8A',
                                        }}
                                        disable={eventDescription.length === 0}
                                    />
                                </View>
                                <EventReviewModal
                                    visible={showReviewModal}
                                    setVisible={setShowReviewModal}
                                    onCloseModal={handleEvent}
                                    title={eventTitle}
                                    description={eventDescription}
                                    galleryUris={s3GalleryUris.concat(
                                        s3FileUris,
                                    )}
                                    startTime={startDateTime}
                                    endTime={endDateTime}
                                    location={eventLocation}
                                    price={eventPaidValue}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default CreatePostEventModal;
