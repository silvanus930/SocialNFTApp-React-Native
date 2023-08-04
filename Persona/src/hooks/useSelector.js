import React from 'react';

// NOTE: doesn't seem to be possible to memoize anything in a hook like this???
export default function useSelector(context, func) {
    const usedContext = React.useContext(context);
    return func(usedContext);
}
