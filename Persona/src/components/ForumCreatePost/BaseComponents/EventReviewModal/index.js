import React, {useEffect} from 'react';
import {
    Modal,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/Feather';
import {format} from 'date-fns';
import Button from '../Button';
import {colors} from 'resources';
import styles from './styles';
import getResizedImageUrl from 'utils/media/resize';

const EventReviewModal = props => {
    const {visible, setVisible, onCloseModal} = props;
    const {title, description, galleryUris, location, startTime, endTime} =
        props;

    const renderItemForGallery = ({item}) => {
        const maxHeight = 250;
        const maxWidth = Dimensions.get('window').width * 0.75;
        const isWide = item.width > item.height;
        const imageWidth = isWide
            ? maxWidth
            : (item.height / item.width) * maxWidth;
        const imageHeight = !isWide
            ? (item.width / item.height) * maxHeight
            : maxHeight;
        return (
            <View style={styles.itemContainer}>
                {item?.type === 'file' ? (
                    <View style={styles.fileContainerStyle}>
                        <Icon
                            name={'file'}
                            color={colors.postAction}
                            size={80}
                        />
                        <Text style={styles.fileNameText}>{item?.name}</Text>
                    </View>
                ) : item.uri.slice(-3) === 'mp4' ? (
                    <Video
                        source={{uri: item?.uri}}
                        style={{
                            marginLeft: 12,
                            width: imageWidth,
                            height: imageHeight,
                            borderRadius: 5,
                        }}
                        resizeMode="cover"
                        repeat={true}
                        paused={true}
                    />
                ) : (
                    <FastImage
                        resizeMode={'contain'}
                        style={{
                            width: imageWidth,
                            height: imageHeight,
                            zIndex: 0,
                            elevation: 0,
                            borderRadius: 5,
                            backgroundColor: colors.defaultImageBackground,
                        }}
                        source={{
                            uri: getResizedImageUrl({
                                origUrl: item.uri,
                                width: imageWidth,
                                height: imageHeight,
                            }),
                        }}
                    />
                )}
            </View>
        );
    };

    useEffect(() => {
        setReviewData({
            title: title,
            description: description,
            galleryUris: galleryUris,
            startTime: format(startTime, 'HH:mma, MMM d, yyyy'),
            endTime: format(endTime, 'HH:mma, MMM d, yyyy'),
            location: location,
        });
    }, [description, endTime, galleryUris, location, startTime, title]);

    const [reviewData, setReviewData] = React.useState({
        title: '',
        description: '',
        galleryUris: [],
        location: 'Persona Studio, New York',
        startTime: format(new Date(), 'HH:mma, MMM d, yyyy'),
        endTime: format(new Date(), 'HH:mma, MMM d, yyyy'),
        price: '$250',
    });

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onBackdropPress={() => setVisible(!visible)}
            touchAnywhereToClose>
            <View style={styles.container}>
                <View style={{flex: 1}} />
                <View style={styles.subContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            setVisible(!visible);
                        }}>
                        <Ionicons color={'white'} name="close" size={20} />
                    </TouchableOpacity>

                    <View>
                        <View
                            style={{
                                height: reviewData.galleryUris?.length
                                    ? 210
                                    : 0,
                                marginTop: 10,
                                marginBottom: 10,
                            }}>
                            <View style={{flex: 1}}>
                                <FlatList
                                    bounces={true}
                                    estimatedItemSize={10}
                                    showsVerticalScrollIndicator={false}
                                    data={reviewData.galleryUris}
                                    extraData={reviewData.galleryUris}
                                    keyExtractor={item => {
                                        return item.uri;
                                    }}
                                    renderItem={renderItemForGallery}
                                    horizontal
                                />
                            </View>
                        </View>
                        <Text
                            style={{color: 'white', margin: 10, fontSize: 25}}>
                            {reviewData.title}
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            <Ionicons
                                color={'white'}
                                name="location"
                                size={20}
                            />
                            <Text
                                style={{
                                    color: 'white',
                                    marginLeft: 5,
                                }}>
                                {reviewData.location}
                            </Text>
                        </View>
                        <View style={styles.iconContainer}>
                            <Ionicons
                                color={'white'}
                                name="calendar"
                                size={20}
                            />
                            <View>
                                <Text
                                    style={{
                                        color: 'white',
                                        marginLeft: 5,
                                    }}>
                                    {reviewData.startTime}
                                </Text>
                                <Text
                                    style={{
                                        color: 'white',
                                        marginLeft: 45,
                                    }}>
                                    {reviewData.startTime}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.desText}>
                            <Text
                                numberOfLines={2}
                                style={{
                                    color: 'white',
                                    marginLeft: 5,
                                }}>
                                {reviewData.description}
                            </Text>
                        </View>
                        <Text style={styles.priceText}>{reviewData.price}</Text>
                        <Button
                            onPress={() => {
                                onCloseModal();
                                setVisible(!visible);
                            }}
                            title="Confirm event creation"
                            style={styles.buttonContainer}
                            textStyle={{color: 'white'}}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default EventReviewModal;
