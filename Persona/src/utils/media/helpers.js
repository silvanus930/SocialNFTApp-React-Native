import {iwarn, clog, cwarn} from 'utils/log';
const CUSTOM_LOG_WARN_HEADER = '!! utils/media/helpers';
const mlog = (...args) =>
    false && global.LOG_MEDIA && clog(CUSTOM_LOG_WARN_HEADER, ...args);
const mwarn = (...args) =>
    false && global.WARN_MEDIA && cwarn(CUSTOM_LOG_WARN_HEADER, ...args);

export const makeRegisterMediaPlayer =
    (
        mediaArtifactRegistry,
        setMediaArtifactRegistry,
        place,
        //) => ({player, stop, setPaused, togglePaused, index}) => {
    ) =>
    ({type, stop, start, startPaused, index}) => {
        mlog(
            `@${place}:// attempt at registering a(n) ${type} mediaArtifact at index ${index} with ${startPaused} startPaused value and functions stop=${stop} and start=${start}`,
        );
        if (stop || start) {
            mlog(
                `@${place}:// found a player; registering a(n) ${type} mediaArtifact at index ${index}`,
            );
            mediaArtifactRegistry[index] = {
                type: type,
                startPaused: startPaused,
                index: index,
                stop: stop,
                start: start,
            };

            if (setMediaArtifactRegistry) {
                setMediaArtifactRegistry(mediaArtifactRegistry);
            }

            mlog('');
        } else if (mediaArtifactRegistry[index]) {
            mwarn(
                `Attempting to overwrite a non-null mediaArtifact in the mediaArtifactRegistry with a null at index ${index}`,
            );
        }
    };
