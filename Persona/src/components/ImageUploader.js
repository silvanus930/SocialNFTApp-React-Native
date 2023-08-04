import ImagePicker from 'react-native-image-crop-picker';
import {openSettings} from 'react-native-permissions';
import {uploadMediaToS3, getS3UploadParams} from 'utils/s3/helpers';

export const uploadImages = async (
    source,
    options,
    preUploadCallback = () => {},
    postUploadCallback = () => {},
) => {
    let response = null;
    try {
        if (source === 'gallery') {
            response = await ImagePicker.openPicker({
                mediaType: 'any',
                multiple: true,
                maxFiles: 20,
                ...options,
            });
        } else if (source === 'photo') {
            response = await ImagePicker.openCamera({
                mediaType: 'photo',
                ...options,
            });
        } else if (source === 'video') {
            response = await ImagePicker.openCamera({
                mediaType: 'video',
                ...options,
            });
        }
    } catch (e) {
        const errorStr = e.toString();
        if (errorStr.includes('not grant') && errorStr.includes('permission')) {
            await openSettings();
        }
        console.log('image picker error', e);
    }
    if (response !== null) {
        try {
            preUploadCallback && preUploadCallback();
            let result = [];
            if (!Array.isArray(response)) {
                response = [response];
            }
            for (let i = 0; i < response.length; i++) {
                const asset = response[i];
                const mediaParams = await getS3UploadParams(asset);

                if (!mediaParams?.uri) {
                    console.log('ERROR: No uri found for asset');
                    postUploadCallback(
                        null,
                        Error('ERROR: No uri found for asset'),
                    );
                    return;
                }

                const mediaUrl = await uploadMediaToS3(
                    mediaParams,
                    null,
                    null,
                    null,
                );
                if (mediaParams.mediaType === 'photo') {
                    result.push({
                        uri: mediaUrl,
                        width: asset.width,
                        height: asset.height,
                    });
                } else {
                    // Set a value for width and height if not defined in the response
                    const width = asset.width ? asset.width : 20;
                    const height = asset.height ? asset.height : 20;

                    result.push({uri: mediaUrl, width, height});
                }
            }
            postUploadCallback(result, null);
            return result;
        } catch (e) {
            console.log(e);
            postUploadCallback(null, e);
        }
    }
};
