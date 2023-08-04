import {encode} from 'base-64';
import {
    Easing,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Clipboard,
    StyleSheet,
    View,
    Text,
    Animated,
    LayoutAnimation,
    UIManager,
    Alert,
} from 'react-native';

/**
 * Returns a URL for a resized image according to the given specifications
 * @param {{width: number, height: number, fit?: string, origUrl: string}} requestObj
 *  Options for fit: cover, contain, fill, inside, outside
 * @return string - the URL of the resized image
 */
export default function getResizedImageUrl({
    maxHeight = false,
    width,
    height,
    fit = 'cover',
    origUrl,
    debugTag,
}) {
    //return origUrl;
    const S3_BUCKET = 'persona-content-store';
    const CLOUDFRONT_URL = 'https://d2snxo2mobtpb6.cloudfront.net';
    const MIN_DIMENSION = 300;
    const MAX_DIMENSION = Dimensions.get('window').height * 0.7;

    if (!origUrl || typeof origUrl !== 'string' || (!width && !height)) {
        if (debugTag) {
            console.log(
                '------------',
                'getResizedImageUrl',
                debugTag,
                'returning null',
            );
        }
        return null;
    }

    const urlParts = origUrl.split('/');

    if (urlParts.length === 1) {
        return origUrl;
    }

    const key = urlParts.pop();

    if (key.endsWith('gif')) {
        return origUrl;
    }

    if (key) {
        const request = {
            bucket: S3_BUCKET,
            key,
            edits: {
                resize: {
                    fit,
                },
                rotate: null,
            },
        };

        if (
            width &&
            height &&
            (width < MIN_DIMENSION || height < MIN_DIMENSION)
        ) {
            const aspectRatio = width / height;
            if (aspectRatio <= 1) {
                width = MIN_DIMENSION;
                height = width / aspectRatio;
            } else {
                height = MIN_DIMENSION;
                width = height * aspectRatio;
            }
        }

        if (width) {
            request.edits.resize.width = Math.max(width, MIN_DIMENSION);
        }

        if (height) {
            request.edits.resize.height = Math.max(height, MIN_DIMENSION);
            //if(maxHeight)request.edits.resize.height = Math.min(height, MAX_DIMENSION);
        }

        const encodedRequest = encode(JSON.stringify(request));

        if (debugTag) {
            console.log(
                '------------',
                'getResizedImageUrl: request: ',
                debugTag,
                request,
            );

            console.log(
                '------------',
                'getResizedImageUrl: new url: ',
                debugTag,
                `${CLOUDFRONT_URL}/${encodedRequest}`,
            );
        }

        return `${CLOUDFRONT_URL}/${encodedRequest}`;
    } else {
        return origUrl;
    }
}
