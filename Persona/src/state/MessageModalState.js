import React from 'react';
import _ from 'lodash';

const MessageModalStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
    showToggle: false,
});

export {MessageModalStateContext};

export default class MessageModalState extends React.Component {
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
        console.log('MessageModalState', newState);
        this.setState(newState);
    };

    toggleModalVisibility = () => {
        console.log(
            'MessageModalState: called toggleModalVisibility',
            this.state.showToggle,
            '->',
            !this.state.showToggle,
        );
        this.setState({showToggle: !this.state.showToggle});
    };

    render() {
        console.log(
            '\n\n',
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER MessageModalState:',
            '\n\n',
        );
        return (
            <MessageModalStateContext.Provider
                value={{
                    csetState: this.csetState,
                    rerenderBit: this.state.rerenderBit,
                    showToggle: this.state.showToggle,
                    toggleModalVisibility: this.toggleModalVisibility,
                    chatID: this.state.chatID,
                }}>
                {this.props.children}
            </MessageModalStateContext.Provider>
        );
    }
}
