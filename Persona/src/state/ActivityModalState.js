import React from 'react';
import _ from 'lodash';

const ActivityModalStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
    showToggle: false,
});

export {ActivityModalStateContext};

export default class ActivityModalState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rerenderBit: false,
            showToggle: false,
            chatID: '',
            post: {},
            persona: {},
        };
    }

    csetState = newState => {
        console.log('ActivityModalState', newState);
        this.setState(newState);
    };

    toggleModalVisibility = () => {
        console.log(
            'ActivityModalState: called toggleModalVisibility',
            this.state.showToggle,
            '->',
            !this.state.showToggle,
        );
        this.setState({showToggle: !this.state.showToggle});
    };

    render() {
        console.log(
            '\n\n',
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER ActivityModalState:',
            '\n\n',
        );
        return (
            <ActivityModalStateContext.Provider
                value={{
                    csetState: this.csetState,
                    rerenderBit: this.state.rerenderBit,
                    showToggle: this.state.showToggle,
                    toggleModalVisibility: this.toggleModalVisibility,
                    chatID: this.state.chatID,
                }}>
                {this.props.children}
            </ActivityModalStateContext.Provider>
        );
    }
}
