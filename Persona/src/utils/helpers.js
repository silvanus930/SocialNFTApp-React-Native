import React from 'react';
import {TouchableOpacity, Platform} from 'react-native';
import {DateTime} from 'luxon';

export function PlatformAwareTouchableOpacity(props) {
    return Platform.OS === 'ios' ? (
        <TouchableOpacity {...props} />
    ) : (
        <TouchableOpacity {...props} />
    );
}

export function getUserIsLive({userHeartbeat}) {
    if (userHeartbeat) {
        let now = new Date();
        let heartbeat = new Date(userHeartbeat?.seconds * 1000);
        return (now - heartbeat) / 1000 < 60;
    } else {
        return false;
    }
}

export function uniqAdd(list, item) {
    // TODO make fast
    if (!list.includes(item)) {
        list.push(item);
    }
}

export function isPersonaAccessible({persona, userID}) {
    return (
        persona &&
        (persona?.authors?.includes(userID) ||
            persona?.communityMembers?.includes(userID) ||
            !persona?.private)
    );
}

export function getRoomKeysFromPresencePath({presenceObjPath}) {
    const roomPostID = presenceObjPath ? presenceObjPath.split('/')[3] : '';
    const roomPersonaID = presenceObjPath ? presenceObjPath.split('/')[1] : '';
    return {roomPostID, roomPersonaID};
}

export function getPersonaCacheTimestamp(
    personaID,
    personaCreateAtSeconds = 0,
    yourPersonaCacheMap,
    lastTouchedMap = null,
) {
    /*yourPersonaCacheMap &&
        console.log(
            'getPersonaCacheTimestamp',
            personaID,
            yourPersonaCacheMap[personaID].name,
        );*/
    if (yourPersonaCacheMap === undefined) {
        return 0;
    }
    const lastPublishTime =
        yourPersonaCacheMap[personaID]?.latestPostPublishDate?.seconds || 0;
    const lastEditTime =
        yourPersonaCacheMap[personaID]?.latestPostEditDate?.seconds || 0;
    const lastPostEditTime =
        lastPublishTime > lastEditTime ? lastPublishTime : lastEditTime;

    let lastChatTime = 0;

    if (lastTouchedMap && lastTouchedMap[personaID]) {
        lastChatTime =
            lastTouchedMap[personaID].seconds || lastTouchedMap[personaID];
        /*console.log(
            'setting lastChatTime',
            lastChatTime,
            lastTouchedMap[personaID],
        );*/
    }

    let times = [personaCreateAtSeconds, lastPostEditTime, lastChatTime];
    //console.log('running a Math.max on', times);
    return Math.max(...times);
}

export function usePersonaCacheEditSeconds(
    personaMap,
    personaID,
    personaCreateAtSeconds = 0,
    lastTouchedMap = null,
) {
    /*console.log(
        'running usePersonaCacheEditSeconds',
        personaID,
        personaMap[personaID].name,
        'w lastTouchedMap',
        lastTouchedMap,
    );*/
    let val = getPersonaCacheTimestamp(
        personaID,
        personaCreateAtSeconds,
        personaMap,
        lastTouchedMap,
    );
    /*console.log(
        'usePersonaCacheEditSeconds',
        personaID,
        personaMap[personaID].name,
        val,
    );*/
    return val;
}

export function uniqAddLists(lista, listb) {
    // TODO make fast
    const combinedList = [];
    lista.forEach(item => {
        uniqAdd(combinedList, item);
    });
    listb.forEach(item => {
        uniqAdd(combinedList, item);
    });
    return combinedList;
}

export function deduplicateList(list) {
    // TODO make fast
    const combinedList = [];
    list.forEach(item => {
        uniqAdd(combinedList, item);
    });
    return combinedList;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function timestampToDateString(timestampInSeconds, format = 'default') {
    const date = new Date(timestampInSeconds * 1000);
    const today = new Date();
    const secondsPast = (today - date) / 1000;
    const secondsInMin = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
    const secondsInWeek = 604800;
    const secondsInYear = 31540000;

    let timeString;
    let dateTime;
    if (timestampInSeconds) {
        dateTime = DateTime.fromSeconds(timestampInSeconds);
        timeString = dateTime.toFormat('h:mm a').toLowerCase();
    }

    if (secondsPast < secondsInHour) {
        if (format === 'directMessage') {
            return timeString;
        } else {
            return parseInt(secondsPast / secondsInMin).toString() + 'm';
        }
    } else if (secondsPast < secondsInDay) {
        if (format === 'directMessage') {
            if (DateTime.now().day > dateTime?.day) {
                return 'Yesterday';
            } else {
                return timeString;
            }
        } else {
            return parseInt(secondsPast / secondsInHour).toString() + 'h';
        }
    } else if (secondsPast < secondsInWeek) {
        return parseInt(secondsPast / secondsInDay).toString() + 'd';
    } else if (secondsPast < secondsInYear) {
        return parseInt(secondsPast / secondsInWeek).toString() + 'w';
    } else {
        return parseInt(secondsPast / secondsInYear).toString() + 'y';
    }
}

export function timestampToTime(timestampInSeconds) {
    let dateTime;
    if (timestampInSeconds) {
        dateTime = DateTime.fromSeconds(timestampInSeconds);
        return dateTime.toFormat('h:mm a').toUpperCase();
    }
}

export function timestampToDateString2(timestampInSeconds) {
    const today = new Date().getTime() / 1000;
    const secondsPast = timestampInSeconds - today;
    const secondsInMin = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
    const secondsInWeek = 604800;
    const secondsInYear = 31540000;
    if (secondsPast <= secondsInHour) {
        return parseInt(secondsPast / secondsInMin).toString() + ' minutes';
    } else if (secondsPast <= secondsInDay) {
        return parseInt(secondsPast / secondsInHour).toString() + ' hours';
    } else if (secondsPast <= secondsInWeek) {
        return parseInt(secondsPast / secondsInDay).toString() + ' days';
    } else if (secondsPast <= secondsInYear) {
        return parseInt(secondsPast / secondsInWeek).toString() + ' weeks';
    } else {
        return parseInt(secondsPast / secondsInYear).toString() + ' years';
    }
}

export function truncate(
    str,
    options = {maxLength: 40, useWordBoundary: true},
) {
    const {maxLength, useWordBoundary} = options;
    if (str.length <= maxLength) {
        return str;
    }
    const subString = str.substr(0, maxLength - 1); // the original check
    return (
        (useWordBoundary
            ? subString.substr(0, subString.lastIndexOf(' '))
            : subString) + '…'
    );
}

/**
 * Find the word located in the string with a numeric index.
 *
 * @return {Object} closestWord with location of start index in string
 */
export function getClosestWord(str, pos) {
    // Search for the word's beginning and end.
    var left = str.slice(0, pos).search(/\S+$/),
        right = str.slice(pos).search(/\s/);

    // The last word in the string is a special case.
    if (right < 0) {
        return {closestWord: str.slice(left), start: left};
    }
    // Return the word, using the located bounds to extract it from the string.
    return {closestWord: str.slice(left, right + pos), start: left};
}

export function mergeSort(array, /* optional */ cmp) {
    /*
        On average, two orders of magnitude faster than Array.prototype.sort() for
        large arrays, with potentially many equal elements.
    */

    if (cmp === undefined) {
        // Not the same as the default behavior for Array.prototype.sort(),
        // which coerces elements to strings before comparing them.
        cmp = function (a, b) {
            'use asm';

            return a < b ? -1 : a === b ? 0 : 1;
        };
    }

    function merge(begin, beginRight, end) {
        'use asm';

        // Create a copy of the left and right halves.
        var leftSize = beginRight - begin,
            rightSize = end - beginRight;
        var left = array.slice(begin, beginRight),
            right = array.slice(beginRight, end);

        // Merge left and right halves back into original array.
        var i = begin,
            j = 0,
            k = 0;
        while (j < leftSize && k < rightSize) {
            if (cmp(left[j], right[k]) <= 0) {
                array[i++] = left[j++];
            } else {
                array[i++] = right[k++];
            }
        }
        // At this point, at least one of the two halves is finished.
        // Copy any remaining elements from left array back to original array.
        while (j < leftSize) {
            array[i++] = left[j++];
        }
        // Copy any remaining elements from right array back to original array.
        while (k < rightSize) {
            array[i++] = right[k++];
        }
        return;
    }

    function mSort(begin, end) {
        'use asm';
        var size = end - begin;
        if (size <= 8) {
            // By experimentation, the sort is fastest when using native sort for
            // arrays with a maximum size somewhere between 4 and 16.
            // This decreases the depth of the recursion for an array size where
            // O(n^2) sorting algorithms are acceptable.
            var subArray = array.slice(begin, end);
            subArray.sort(cmp);
            // Copy the sorted array back to the original array.
            for (var i = 0; i < size; ++i) {
                array[begin + i] = subArray[i];
            }
            return;
        }

        var beginRight = begin + (size >>> 1);

        mSort(begin, beginRight);
        mSort(beginRight, end);
        merge(begin, beginRight, end);
    }

    mSort(0, array.length);

    return array;
}

// fast unique array function
export function uniqueArray(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for (var i = 0; i < len; i++) {
        var item = a[i];
        if (seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}

export function isNumeric(str) {
    if (typeof str !== 'string') {
        return false;
    } // we only process strings!
    return (
        !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))
    ); // ...and ensure strings of whitespace fail
}

export function determineUserRights(communityID, personaKey, user, right) {
    // find roles that match current persona, community.
    let personaRoles = [];
    let communityRoles = [];
    user.roles.forEach(role => {
        const rolePathArray = role.ref.path.split('/');
        const rolePath = rolePathArray[rolePathArray.length - 1];

        if (rolePath === communityID) {
            communityRoles.push(role);
        }

        if (rolePath === personaKey) {
            personaRoles.push(role);
        }
    });

    let hasRight = false;
    personaRoles.forEach(role => {
        if (role?.rights?.[right]) {
            hasRight = true;
        }
    });

    communityRoles.forEach(role => {
        if (role?.rights?.[right]) {
            hasRight = true;
        }
    });

    // Hardcoding all rights for Raeez everywhere:
    if(user.id === 'PHobeplJLROyFlWhXPINseFVkK32') {
        hasRight = true;
    }

    return hasRight;
}

export function determineLowestTier(communityID, personaKey, user) {
    // find roles that match current persona, community.
    let userTiers = [];
    user.roles.forEach(role => {
        const rolePathArray = role.ref.path.split('/');
        const rolePath = rolePathArray[rolePathArray.length - 1];

        if (rolePath === communityID) {
            userTiers.push(role.tier);
        }

        if (rolePath === personaKey) {
            userTiers.push(role.tier);
        }
    });

    userTiers = userTiers.filter(x => x !== undefined);
    return Math.min(...userTiers);
}

export const isSuperAdmin = (user) => {
    return (
        user.id === 'PHobeplJLROyFlWhXPINseFVkK32'
        || user.id === '94hKmQP9DEhZICfZEebFq5rl8VZ2'
        || user.id === 'XoZqmMzuWCVonmIBVicV4Xf6qlH3'
        || user.id === 'dUh7RliICjYYPhLV6fCGVs2kVeA2'
        || user.id === 'p2uI1mLNh4ZDEYmeljLAIVMv1QR2'
        || user.id === 'd4ggKisGIbY0T836xFpA3MoAa0z2'
    )
}


export const selectLayout = animation => {
    if (Platform.OS === 'ios') {
        return animation;
    }
    return null;
};
