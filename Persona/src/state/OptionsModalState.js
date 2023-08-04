import React from 'react';
import _ from 'lodash';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const OptionsModalStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
    showToggle: false,
});

export {OptionsModalStateContext};

export default class OptionsModalState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rerenderBit: false,
            showToggle: false,
            userID: '',
            postID: '',
            post: {},
            communityID: '',
            persona: {},
            personaID: '',
            isCurrentUserAuthor: false,
            closeRightDrawer: () => {},
        };
    }

    csetState = newState => {
        //console.log('OptionsModalState', newState);
        this.setState(newState);
    };

    toggleModalVisibility = async () => {
        /*console.log(
            'OptionsModalState: called toggleModalVisibility',
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
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER OptionsModalState:',
            '\n\n',
        );*/
        return (
            <OptionsModalStateContext.Provider
                value={{
                    csetState: this.csetState,
                    rerenderBit: this.state.rerenderBit,
                    closeRightDrawer: this.state.closeRightDrawer,
                    showToggle: this.state.showToggle,
                    communityID: this.state.communityID,
                    toggleModalVisibility: this.toggleModalVisibility,
                    userID: this.state.userID,
                    postID: this.state.postID,
                    personaID: this.state.personaID,
                    post: this.state.post,
                    persona: this.state.persona,
                    isCurrentUserAuthor: this.state.isCurrentUserAuthor,
                }}>
                {this.props.children}
            </OptionsModalStateContext.Provider>
        );
    }
}
