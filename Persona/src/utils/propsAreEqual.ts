import isEqual from 'lodash.isequal';

export const propsAreEqual = (prevProps: any, nextProps: any) => {
    return isEqual(prevProps, nextProps);
};
