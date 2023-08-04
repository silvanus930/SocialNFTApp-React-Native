import ImagePicker from 'react-native-image-crop-picker';
import DocumentPicker from 'react-native-document-picker';
import {uploadMediaToS3, getS3UploadParams} from 'utils/s3/helpers';

export const uploadFiles = async (
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
        } else if (source === 'file') {
            response = await DocumentPicker.pickSingle({
                copyTo: 'cachesDirectory',
                presentationStyle: 'fullScreen',
                type: [
                    DocumentPicker.types.plainText,
                    DocumentPicker.types.pdf,
                    DocumentPicker.types.zip,
                    DocumentPicker.types.csv,
                    DocumentPicker.types.doc,
                    DocumentPicker.types.docx,
                    DocumentPicker.types.ppt,
                    DocumentPicker.types.pptx,
                    DocumentPicker.types.xls,
                    DocumentPicker.types.xlsx,
                ],
            });
            console.log(response);
        }
    } catch (e) {
        console.log('file picker error', e);
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
                console.log('mediaParams::::--->', mediaParams);
                if (mediaParams.mediaType === 'file') {
                    result.push({
                        uri: mediaUrl,
                        type: 'file',
                        name: asset.name,
                    });
                } else if (mediaParams.mediaType === 'photo') {
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
