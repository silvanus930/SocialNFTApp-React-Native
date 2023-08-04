// Points to our main S3 bucket
const CLOUDFRONT_URL = 'https://d23xt42hsmbfbz.cloudfront.net';

/**
 * Converts an S3 url to a CloudFront URL
 */
export default function getMediaUrl(origUrl) {
    if (!origUrl || typeof origUrl !== 'string') {
        throw new Error('getMediaUrl requires a non-empty string');
    }
    const urlParts = origUrl.split('/');
    const key = urlParts.pop();
    return `${CLOUDFRONT_URL}/${key}`;
}
