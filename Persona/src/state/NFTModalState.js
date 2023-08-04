import React from 'react';
import _ from 'lodash';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const NFTModalStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
    showToggle: false,
});

export {NFTModalStateContext};

export default class NFTModalState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rerenderBit: false,
            showToggle: false,
            communityID: '',
            persona: {},
            userID: '',
            personaID: '',
        };
    }

    csetState = newState => {
        //console.log('NFTModalState', newState);
        this.setState(newState);
    };

    toggleModalVisibility = async () => {
        /*console.log(
            'NFTModalState: called toggleModalVisibility',
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
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER NFTModalState:',
            '\n\n',
        );*/
        return (
            <NFTModalStateContext.Provider
                value={{
                    csetState: this.csetState,
                    persona: this.state.persona,
                    rerenderBit: this.state.rerenderBit,
                    userID: this.state.userID,
                    communityID: this.state.communityID,
                    personaID: this.state.personaID,
                    showToggle: this.state.showToggle,
                    toggleModalVisibility: this.toggleModalVisibility,
                }}>
                {this.props.children}
            </NFTModalStateContext.Provider>
        );
    }
}
