import {dateFor, isSameDay} from 'utils/DateTime';
import {postTypes} from 'resources/constants';

export const addDateSeperators = data => {
    let dateSeparatedFilteredData = [];
    data.map((i, index) => {
        let item = {...i};
        const prevDate = dateFor(data[index - 1]);
        const date = dateFor(item);
        item.date = date;

        const same = isSameDay(date, prevDate);

        if (!same && date) {
            dateSeparatedFilteredData.push({
                postType: postTypes.DATE_SEPARATOR,
                date: date,
                fid: date.toString(),
            });
        }
        dateSeparatedFilteredData.push(item);
    });
    return dateSeparatedFilteredData;
};
