import React from 'react';
import _ from 'lodash';

const ActivityStateContext = React.createContext({
    activitySnap: null,
    setActivityList: () => {},
});

export {ActivityStateContext};
export default class ActivityState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activitySnap: [],
        };
    }

    setActivityList = al => {
        log('setActivityList', al.length, 'items');
        this.setState({activitySnap: al});
    };

    render() {
        return (
            <ActivityStateContext.Provider
                value={{
                    activitySnap: this.state.activitySnap,
                    setActivityList: this.setActivityList,
                }}>
                {this.props.children}
            </ActivityStateContext.Provider>
        );
    }
}
