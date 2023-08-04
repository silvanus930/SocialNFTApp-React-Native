import React from 'react';
import {clog, cwarn, iwarn} from 'hooks/useKeyboard';
import throttle from 'lodash.throttle';
const CUSTOM_LOG_WARN_HEADER = '!! hooks/useKeyboard';
const log = (...args) => clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) => cwarn(CUSTOM_LOG_WARN_HEADER, ...args);

export default function useRateLimit(
    func,
    deps,
    waitMs = 500,
    leading = true,
    trailing = false,
) {
    return React.useCallback(throttle(func, waitMs, {leading, trailing}), deps);
}
