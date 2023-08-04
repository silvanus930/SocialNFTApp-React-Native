import React from 'react';
import _ from 'lodash';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const InviteModalStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
    showToggle: false,
});

export {InviteModalStateContext};

export default class InviteModalState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            authors: [],
            rerenderBit: false,
            showToggle: false,
            view: false,
            userID: '',
            persona: {},
            closeRightDrawer: () => {},
            usePersona: null,
        };
    }

    csetState = newState => {
        //console.log('InviteModalState', newState);
        this.setState(newState);
    };

    toggleModalVisibility = async () => {
        /*console.log(
            'InviteModalState: called toggleModalVisibility',
            this.state.showToggle,
            '->',
            !this.state.showToggle,
        );*/
        let context = this.state.roomsPulloutContextRef?.current;
        let bounceBack = this.state.roomsPulloutBounceBack;
        //console.log('bounceback', bounceBack, 'context', context);
        this.setState({
            showToggle: !this.state.showToggle,
            roomsPulloutBounceBack: false,
        });
        if (bounceBack && context.csetState) {
            //console.log('trying to initiate bounceback routine!');
            this.state.closeRightDrawer && this.state.closeRightDrawer();
            //console.log('sleeping 122....');
            await sleep(122);
            //console.log('calling context.toggleModalVisibility()....');
            this.state.roomsPulloutContextRef?.current.csetState({
                showToggle: true,
            });
        }
    };

    render() {
        /*console.log(
            '\n\n',
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER InviteModalState:',
            '\n\n',
        );*/
        return (
            <InviteModalStateContext.Provider
                value={{
                    authors: this.state.authors,
                    view: this.state.view,
                    persona: this.state.persona,
                    csetState: this.csetState,
                    rerenderBit: this.state.rerenderBit,
                    closeRightDrawer: this.state.closeRightDrawer,
                    showToggle: this.state.showToggle,
                    toggleModalVisibility: this.toggleModalVisibility,
                    userID: this.state.userID,
                    usePersona: this.state.usePersona,
                }}>
                {this.props.children}
            </InviteModalStateContext.Provider>
        );
    }
}
