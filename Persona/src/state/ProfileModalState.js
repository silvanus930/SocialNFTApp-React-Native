import React from 'react';
import _ from 'lodash';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ProfileModalStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
    showToggle: false,
    closeRightDrawer: () => {},
    closeLeftDrawer: () => {},
});

export {ProfileModalStateContext};

export default class ProfileModalState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rerenderBit: false,
            showToggle: false,
            userID: '',
            post: {},
            persona: {},
            closeRightDrawer: () => {},
            closeLeftDrawer: () => {},
            onPressGoUpArrow: () => {},
            onPressGoDownArrow: () => {},
        };
    }

    csetState = newState => {
        //console.log('ProfileModalState', newState);
        console.log('profile modal state set state', newState);
        this.setState(newState);
    };

    toggleModalVisibility = async () => {
        /*console.log(
            'ProfileModalState: called toggleModalVisibility',
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
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER ProfileModalState:',
            '\n\n',
        );*/
        return (
            <ProfileModalStateContext.Provider
                value={{
                    csetState: this.csetState,
                    rerenderBit: this.state.rerenderBit,
                    closeRightDrawer: this.state.closeRightDrawer,
                    closeLeftDrawer: this.state.closeLeftDrawer,
                    onPressGoUpArrow: this.state.onPressGoUpArrow,
                    onPressGoDownArrow: this.state.onPressGoDownArrow,

                    showToggle: this.state.showToggle,
                    toggleModalVisibility: this.toggleModalVisibility,
                    userID: this.state.userID,
                }}>
                {this.props.children}
            </ProfileModalStateContext.Provider>
        );
    }
}
