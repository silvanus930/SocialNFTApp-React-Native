
export const timeMetrics = {
    MINUTE: 'min',
    HOUR: 'hr',
    DAY: 'day',
    WEEK: 'week',
};

export const targetTypes = {
    USER: 'user',
    CHANNEL: 'channel',
};

// Todo- do we want a closer to infinite number of selections?
export const proposalDurations = [
    {duration: 1, metric: 'min'},
    {duration: 60, metric: 'min'},
    {duration: 2, metric: 'hrs'},
    {duration: 12, metric: 'hrs'},
    {duration: 1, metric: 'day'},
    {duration: 2, metric: 'days'},
    {duration: 1, metric: 'week'},
];

/**
 * @param duration proposalDuration object
 * @returns Date endTime 
 */
export const getEndTimeFromDuration = (durationObj) => {
    let newDateObj;
    const diff = durationObj.duration;
    const metric = durationObj.metric;

    if (metric.includes(timeMetrics.MINUTE)) {
        newDateObj = new Date(new Date().getTime() + diff*60000);
    } else if (metric.includes(timeMetrics.HOUR)) {
        newDateObj = new Date(new Date().getTime() + diff*60000*60);
    } else if (metric.includes(timeMetrics.DAY)) {
        newDateObj = new Date(new Date().getTime() + diff*60000*60*24);
    } else if (metric.includes(timeMetrics.WEEK)) {
        newDateObj = new Date(new Date().getTime() + diff*60000*60*24*7);
    }
    return newDateObj;
}

export const currencyMap = {
    eth: 'ETH',
    usd: 'USD',
    usdc: 'USDC',
    cc: 'CC',
    nft: 'NFT',
};

export const currencyList = [
    'ETH', 'USD', 'USDC', 'CC', 'NFT',
];

export const getPriceStr = (amt, curr) => {
    const currency = curr.toLowerCase();
    switch (currency) {
        case 'usd':
            return `$${amt.toFixed(2)}`;
        default:
            return `${amt ?? 0} ${currencyMap[currency]}`;
    }
};
