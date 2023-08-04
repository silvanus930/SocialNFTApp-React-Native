import React from 'react';
import _ from 'lodash';

const ActivityShellStateContext = React.createContext({
    audioManager: null,
    setRoomState: () => {},
    presenceObjPath: null,
});

export {ActivityShellStateContext};

export default class ActivityShellState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activityScreenFlatListRef: null,
            setRenderActivityToggle: null,
            renderActivityToggle: true,
            renderActivityToggleRef: null,
            activitySnapshotRef: null,
            activityEventsByIdRef: null,
        };
    }

    csetState = newState => {
        this.setState(newState);
    };

    render() {
        return (
            <ActivityShellStateContext.Provider
                value={{
                    csetState: this.csetState,
                    activityScreenFlatListRef:
                        this.state.activityScreenFlatListRef,
                    setRenderActivityToggle: this.state.setRenderActivityToggle,
                    renderActivityToggle: this.state.renderActivityToggle,
                    renderActivityToggleRef: this.state.renderActivityToggleRef,
                    activitySnapshotRef: this.state.activitySnapshotRef,
                    activityEventsByIdRef: this.state.activityEventsByIdRef,
                }}>
                {this.props.children}
            </ActivityShellStateContext.Provider>
        );
    }
}
