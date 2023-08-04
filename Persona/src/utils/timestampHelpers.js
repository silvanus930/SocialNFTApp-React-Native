import {DateTime} from 'luxon';

//
//  Returns a Luxon DateTime for a post
//
export const dateFor = item => {
    let date;
    const pub =
        item?.post?.data?.publishDate ||
        item?.post?.publishDate ||
        item?.publishDate ||
        item?.entry?.post?.publishDate;
    const seconds = pub?.seconds || pub?._seconds;

    if (seconds) {
        date = DateTime.fromSeconds(seconds);
    }

    return date;
};

//
// Naive date comparison, uses Luxon dates
//
export const isSameDay = (date1, date2) => {
    const d1 = `${date1?.month}-${date1?.day}-${date1?.year}`;
    const d2 = `${date2?.month}-${date2?.day}-${date2?.year}`;
    return d1 === d2;
};
