import { FFmpegKit } from 'ffmpeg-kit-react-native';
import fs from 'react-native-fs';

export const PROFILE_IMAGE_QUALITY = 0.31;
export const MEDIA_IMAGE_POST_QUALITY = 0.31;
export const MEDIA_VIDEO_POST_QUALITY = 0.1;

export const processVideoPromise = (videoUrl) => {
    return new Promise((resolve, reject) => {
        processVideo(videoUrl, (data) => {
            resolve(data);
        });
    });
};

const cacheResourcePath = async (sourcePath) => {
    const destPath = `${fs.CachesDirectoryPath}/uploadVideo.mp4`;
    let decodedDestPath = decodeURIComponent(destPath);
    const srcPath = decodeURIComponent(sourcePath);

    return await fs.exists(decodedDestPath).then(async (res) => {
        if (res) {
            fs.unlink(decodedDestPath);
        }
        await fs.copyFile(srcPath, decodedDestPath);
        return decodedDestPath;
    }).catch((err) => {
        console.log(`Error with checking if filename: ${decodedDestPath} already exists: ${err}`);
    });
};

const processVideo = async (videoUrl, callback) => {
    const finalVideo = `${fs.CachesDirectoryPath}/audioVideoFinal.mp4`;
    const rVideoUrl = await cacheResourcePath(videoUrl);

    // https://trac.ffmpeg.org/wiki/Scaling
    // use -2 for mp4 and mov codec's
    const str_cmd = `-i ${rVideoUrl} -vf "scale=684:-2" -preset faster -y ${finalVideo}`;

    FFmpegKit.execute(
        str_cmd,
    ).then(async (result) => {
        fs.unlink(rVideoUrl);

        callback({
            videoPath:
            Platform.OS === 'android' ? 'file://' + finalVideo : finalVideo,
        });

        if (result === 0) {
            fs.unlink(rVideoUrl);

            callback({
                videoPath:
                Platform.OS === 'android' ? 'file://' + finalVideo : finalVideo,
            });
        }
    }).catch((err) => {
        console.log(`FFmpegKit execution on media uri (${rVideoUrl}) went wrong: ${err}`);
    });
};
