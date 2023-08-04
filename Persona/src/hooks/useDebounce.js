import React from 'react';

import {clog, cwarn, iwarn} from 'hooks/useKeyboard';
import {debounce} from 'lodash';
const CUSTOM_LOG_WARN_HEADER = '!! hooks/useKeyboard';
const log = (...args) => clog(CUSTOM_LOG_WARN_HEADER, ...args);
const warn = (...args) => cwarn(CUSTOM_LOG_WARN_HEADER, ...args);

export default function useDebounce(func, deps, waitMs = 80) {
    return React.useCallback(
        debounce(func, waitMs, {leading: true, trailing: false}),
        deps,
    );
}
