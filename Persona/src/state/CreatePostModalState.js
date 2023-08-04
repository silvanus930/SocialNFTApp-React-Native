import React from 'react';
import _ from 'lodash';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const CreatePostModalStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
    showToggle: false,
});

export {CreatePostModalStateContext};

export default class CreatePostModalState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rerenderBit: false,
            showToggle: false,
            personaID: '',
            communityID: '',
            initWithMedia: null,
        };
    }

    csetState = newState => {
        this.setState(newState);
    };

    toggleModalVisibility = async () => {
        let context = this.state.roomsPulloutContextRef?.current;
        let bounceBack = this.state.roomsPulloutBounceBack;
        this.setState({
            showToggle: !this.state.showToggle,
            roomsPulloutBounceBack: false,
        });
        if (bounceBack && context.csetState) {
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
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER CreatePostModalState:',
            '\n\n',
        );*/
        return (
            <CreatePostModalStateContext.Provider
                value={{
                    csetState: this.csetState,
                    communityID: this.state.communityID,
                    showToggle: this.state.showToggle,
                    toggleModalVisibility: this.toggleModalVisibility,
                    personaID: this.state.personaID,
                    initWithMedia: this.state.initWithMedia,
                }}>
                {this.props.children}
            </CreatePostModalStateContext.Provider>
        );
    }
}
