import React from 'react';
import _ from 'lodash';

const RemixRenderStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
    showToggle: false,
});

export {RemixRenderStateContext};

export default class RemixRenderState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            draft: false,
            rerenderBit: false,
            showToggle: false,
            personaID: '',
            postID: '',
            post: {},
            persona: {},
        };
    }

    csetState = newState => {
        console.log('RemixRenderState', newState);
        this.setState(newState);
    };

    toggleModalVisibility = () => {
        /*console.log(
            'RemixRenderState: called toggleModalVisibility',
            this.state.showToggle,
            '->',
            !this.state.showToggle,
        );*/
        this.setState({showToggle: !this.state.showToggle});
    };

    render() {
        /*console.log(
            '\n\n',
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER RemixRenderState:',
            '\n\n',
        );*/
        return (
            <RemixRenderStateContext.Provider
                value={{
                    csetState: this.csetState,
                    rerenderBit: this.state.rerenderBit,
                    showToggle: this.state.showToggle,
                    toggleModalVisibility: this.toggleModalVisibility,
                    personaID: this.state.personaID,
                    postID: this.state.postID,
                    post: this.state.post,
                    persona: this.state.persona,
                    draft: this.state.draft,
                }}>
                {this.props.children}
            </RemixRenderStateContext.Provider>
        );
    }
}
