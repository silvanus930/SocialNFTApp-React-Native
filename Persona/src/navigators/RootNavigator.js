import * as React from 'react';
import {StackActions} from '@react-navigation/native';

/** Creates a reference for the current navigator that we can use to access the
 * navigator and associated methods outside of a navigator context
 * https://reactnavigation.org/docs/navigating-without-navigation-prop/
 *   */

export const navigationRef = React.createRef();

export function navigate(name, params) {
    navigationRef.current?.navigate(name, params);
}

export function push(...args) {
    navigationRef.current?.dispatch(StackActions.push(...args));
}
