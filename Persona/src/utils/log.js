
const LOG = false;

export const iwarn = (header, ...args) => {
    // flag features not yet implemented
    if (global.WARN_IMPLEMENT_ME) {
        customPrint(console.warn, header, ...args);
    }
};

export const customPrint = (lw, header, ...args) => {
    const message = [header]
        .concat(
            args.map(a => {
                try {
                    return JSON.stringify(a, undefined, 4);
                } catch (err) {
                    console.log(`error ${err} in customPrint jsonify:`);
                    return a;
                }
            }),
        )
        .join(' ');
    try {
        lw(`${message}`);
    } catch (err) {
        console.log(JSON.stringify(err));
    }
};

export const clog = (header, ...args) => {
    LOG && customPrint(console.log, header, ...args);
};

export const cwarn = (header, ...args) => {
    LOG && customPrint(console.warn, header, ...args);
};

export const cerror = (header, ...args) => {
    LOG && customPrint(console.error, header, ...args);
};
