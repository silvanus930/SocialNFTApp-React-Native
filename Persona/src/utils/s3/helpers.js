import 'react-native-get-random-values';
import {Platform} from 'react-native';
import {
    S3Client,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    PutObjectCommand,
    PutObjectRequest,
    AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import fs from 'react-native-fs';
import {decode} from 'base64-arraybuffer';
import {clog, cwarn, cerror} from 'utils/log';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {POST_MEDIA_TYPE_VIDEO} from 'state/PostState';
import {processVideoPromise} from 'utils/media/compression';

const CUSTOM_LOG_WARN_HEADER = '## s3/helpers';
const log = (...args) => global.LOG_S3 && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const error = (...args) => cerror(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) =>
    global.WARN_S3 && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);

export const bucketName = 'persona-content-store';
export const s3 = new S3Client({
    credentials: {
        secretAccessKey: 'jMa55kZHpeu0iwl+f6nB6dH4UlvpM6qWMwVuICog',
        accessKeyId: 'AKIARZGGW2YSUBK6V2NE',
    },
    Bucket: bucketName,
    region: 'us-east-2',
});

const extToMimes = {
    gif: 'image/gif',
    img: 'image/jpeg', // mediaType = 'photo'
    jpg: 'image/jpeg', // mediaType = 'photo'
    jpeg: 'image/jpeg', // mediaType = 'photo'
    png: 'image/png', // mediaType = 'photo'
    mp4: Platform.OS === 'android' ? 'video/mp4' : 'audio/mp4', // mediaType = 'audio'
    mov: 'video/quicktime', //mediaType = 'video'
};

export const getMimeByExt = ext => {
    let e = ext.toLowerCase();
    console.log('utils/s3/helpers getMimeByExt ext->', e);
    if (extToMimes.hasOwnProperty(e)) {
        console.log('utils/s3/helpers returning', extToMimes[e]);
        return extToMimes[e];
    } else {
        console.log('utils/s3/helpers unrecognized mime type', extToMimes[e]);
        return '';
    }
};

const mimesToExt = {
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'video/mp4': 'mp4',
    'audio/mp4': 'mp4',
    'video/quicktime': 'mov',
};

const getExtByMime = mime => {
    if (mimesToExt.hasOwnProperty(mime)) {
        return mimesToExt[mime];
    } else {
        return '';
    }
};

export const getS3UploadParams = async asset => {
    /**
     * All response objects should look like this:
     *  (mostly from ImagePickerResponse - react-native-image-picker)
     * {
     *  mediaType: <gallery|video>,
     *  source: <select|?>,
     *  assets: [
     *      fileName: <string>,
     *      uri: <string>,
     *      width: <number>,
     *      height: <number>
     *  ]
     * }
     *
     * Update this when we are upload files from DocumentFilePickerResponse - react-native-document-picker
     * {
     *  fileCopyUri: string,
     *  file: string,
     *  name: string,
     *  type: string, // 'application.msword'
     *  size: number,
     *  uri: string,
     * }
     */
    const {mime} = asset;
    const isFile = !mime;

    let ext = isFile ? asset.name.split('.').slice(-1)[0] : getExtByMime(mime);
    let mediaType = 'photo';
    if (isFile) {
        mediaType = 'file';
    } else if (ext === 'mp4' || ext === 'mov') {
        mediaType = 'video';
    }
    console.log(isFile, mime);

    let uri = isFile ? asset?.uri : decodeURI(asset.path);

    if (mediaType === POST_MEDIA_TYPE_VIDEO) {
        const fileInfo = await fs.stat(uri);
        const fileSizeMb = fileInfo.size / (1024 * 1024);
        // FIXME: Temporarily preventing files greater than 1000mb from being
        // uploaded because large videos crash clients. (~50mb post compression)
        if (fileSizeMb > 2000) {
            alert(
                'Max video upload size is currently 2000mb. Please choose a smaller video.',
            );
            return;
        }

        // console.log(`Uploading video of size: ${fileSizeMb}`);
        try {
            const mediaUri = asset.path;
            const data = await processVideoPromise(mediaUri);
            const newFileInfo = await fs.stat(data.videoPath);
            const newFileSizeMb = newFileInfo.size / (1024 * 1024);

            // console.log(`Processed video of new size: ${newFileSizeMb}`);

            uri = data.videoPath;
        } catch (e) {
            console.log('ERROR: unable to process video', JSON.stringify(e));
        }
    }

    const res = {
        uri: isFile ? asset.fileCopyUri : uri,
        ext: ext,
        type: isFile ? asset?.type : mime,
        name:
            Platform.OS === 'ios'
                ? isFile
                    ? asset?.name
                    : asset?.filename
                : '',
        mediaType: isFile ? 'file' : mediaType,
    };
    console.log(res);
    return res;
};

export const uploadMediaToS3 = async (
    f,
    setProgressIndicator = null,
    clearState = null,
    progressIndicator = null,
) => {
    if (!f.uri) {
        console.log('utils/s3/helpers uploadMediaToS3 passed a bad uri', f);
        setProgressIndicator && setProgressIndicator('');
        clearState && clearState();
        throw Error('utils/s3/helpers uploadMediaToS3 passed a bad uri', f);
    }
    if (progressIndicator !== 'busy') {
        setProgressIndicator && setProgressIndicator('busy');
    }

    let re = /[^/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/; // pull filename
    let ext = f.ext ? f.ext : f.uri.slice(-3); // TODO properly; only handles ios ImagePicker + SampleRecorder.js output for now
    let fname = f.name ? f.name : re.exec(f.uri)[0];

    console.log('f->', JSON.stringify(f, undefined, 4));

    const file = {
        ...f, // assume f.uri non-null
        name: fname,
        type: f.type ? f.type : getMimeByExt(ext),
        ext: ext,
        uri: decodeURI(f.uri),
    };

    const mediaRef = await firestore()
        .collection('media')
        .add({userID: auth().currentUser.uid, origFileName: file.name});
    let uniqName = mediaRef.id + '.' + ext;
    file.uniqName = uniqName;

    console.log('file', file);

    let contentType = file.type;
    let contentDeposition = 'inline;filename="' + file.uniqName + '"';

    try {
        const fileInfo = await fs.stat(file.uri);
        // Files larger than 75mb use multipart upload
        if (fileInfo.size / (1024 * 1024) > 75) {
            const params = {
                Bucket: bucketName,
                Key: file.uniqName,
            };
            try {
                var {UploadId} = await s3.send(
                    new CreateMultipartUploadCommand(params),
                );
                const CHUNK_SIZE = 25 * 1024 * 1024; // 25mb
                const numParts = Math.ceil(fileInfo.size / CHUNK_SIZE);
                const partsList = [];
                for (let i = 0; i < numParts; i++) {
                    const base64Chunk = await fs.read(
                        file.uri,
                        CHUNK_SIZE,
                        i * CHUNK_SIZE,
                        'base64',
                    );
                    const {ETag} = await s3.send(
                        new UploadPartCommand({
                            ...params,
                            Body: decode(base64Chunk),
                            PartNumber: i + 1,
                            UploadId,
                        }),
                    );
                    partsList.push({ETag, PartNumber: i + 1});
                }
                await s3.send(
                    new CompleteMultipartUploadCommand({
                        ...params,
                        MultipartUpload: {Parts: partsList},
                        UploadId,
                    }),
                );
            } catch (err) {
                if (UploadId) {
                    await s3.send(
                        new AbortMultipartUploadCommand({
                            ...params,
                            UploadId,
                        }),
                    );
                }
                alert(`${err.toString()}`);
                setProgressIndicator && setProgressIndicator('');
            }
        } else {
            const base64 = await fs.readFile(file.uri, 'base64');
            const arrayBuffer = decode(base64);
            console.log('arrayBuffer', base64.length);

            const params = {
                Bucket: bucketName,
                Key: file.uniqName,
                Body: arrayBuffer,
                ContentDisposition: contentDeposition,
                ContentType: contentType,
            };

            console.log(
                'utils/s3/helpers: params--->',
                JSON.stringify(params, undefined, 4),
            );
            try {
                const data = await s3.send(new PutObjectCommand(params));
                setProgressIndicator && setProgressIndicator('');
                console.log(
                    'utils/s3/helpers data--->',
                    JSON.stringify(data, undefined, 4),
                );
            } catch (err) {
                console.error('utils/s3/helpers error-|->: ', err);
                alert(`${err.toString()}`);
                setProgressIndicator && setProgressIndicator('');
            }
        }

        let mediaUrl = `https://persona-content-store.s3.us-east-2.amazonaws.com/${file.uniqName}`;
        // console.log(`s3/helpers returning URL: ${mediaUrl}`);
        return mediaUrl;
    } catch (err) {
        error(err.toString());
        throw err;
    }
};
