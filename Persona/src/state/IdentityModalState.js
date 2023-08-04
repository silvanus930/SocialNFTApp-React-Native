import React from 'react';
import _ from 'lodash';

const IdentityModalStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
    showToggle: false,
});

export {IdentityModalStateContext};

export default class IdentityModalState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rerenderBit: false,
            showToggle: false,
            pcs: false,
            personaID: '',
            postID: '',
            post: {},
            persona: {},
        };
    }

    csetState = newState => {
        //console.log('IdentityModalState', newState);
        this.setState(newState);
    };

    toggleModalVisibility = () => {
        /*console.log(
            'IdentityModalState: called toggleModalVisibility',
            this.state.showToggle,
            '->',
            !this.state.showToggle,
        );*/
        this.setState({showToggle: !this.state.showToggle});
    };

    render() {
        /*console.log(
            '\n\n',
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER IdentityModalState:',
            this.state.showToggle,
            '\n\n',
        );*/
        return (
            <IdentityModalStateContext.Provider
                value={{
                    csetState: this.csetState,
                    rerenderBit: this.state.rerenderBit,
                    showToggle: this.state.showToggle,
                    pcs: this.state.pcs,
                    toggleModalVisibility: this.toggleModalVisibility,
                    personaID: this.state.personaID,
                    postID: this.state.postID,
                    post: this.state.post,
                    persona: this.state.persona,
                }}>
                {this.props.children}
            </IdentityModalStateContext.Provider>
        );
    }
}
