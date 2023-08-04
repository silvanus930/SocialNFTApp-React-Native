import React from 'react';
import {requireNativeComponent} from 'react-native';

const RNTMapView = requireNativeComponent('RNTMap', null);

class MyMapView extends React.Component {
    serializeProps = obj => {
        const cache = new Set();
        const replacer = (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                    return '[Circular]';
                }
                cache.add(value);
            }
            return value;
        };
        const serialized = JSON.stringify(obj, replacer);
        cache.clear();
        return serialized;
    };

    render() {
        const {discussionProps: mapDiscussionProps, ...restProps} = this.props;
        const serializedProps = this.serializeProps(mapDiscussionProps);
        return <RNTMapView {...restProps} discussionProps={serializedProps} />;
    }
}

export default MyMapView;
