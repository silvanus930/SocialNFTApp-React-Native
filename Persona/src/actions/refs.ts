import memoize from 'memoizee';

export const getDisplayNameForRef = async ref => {
    const [type, id] = ref.path.split('/');
    let name = `${type}:${id.slice(0, 8)}`;

    try {
        const refObjRef = await ref.get();
        const refObjData = refObjRef.data();

        switch (type) {
            case 'users':
                name = refObjData.userName;
                break;
            case 'communities':
                name = refObjData.name;
                break;
            case 'purchasables':
                name = refObjData.name;
                break;
            case 'personas':
                name = refObjData.name;
                break;
            default:
                break;
        }
    } catch (e) {
        //
    }

    return name;
};

export const parseAndGetRef = async ref => {
    const [type, id] = ref.path.split('/');

    try {
        const refObjRef = await ref.get();
        const data = refObjRef.data();

        return {
            type,
            id,
            data,
        };
    } catch (e) {
        return {};
    }
};

export const parseAndGetRefMemo = memoize(parseAndGetRef, {promise: true});
