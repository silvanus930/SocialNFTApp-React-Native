import React from 'react';
import _ from 'lodash';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const HeaderRefStateContext = React.createContext({
    csetState: () => {},
    ref: null,
});

export {HeaderRefStateContext};

export default class HeaderRefState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ref: null,
        };
    }

    csetState = newState => {
        //console.log('HeaderRefState', newState);
        this.setState(newState);
    };

    render() {
        /*console.log(
            '\n\n',
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER HeaderRefState:',
            '\n\n',
        );*/
        return (
            <HeaderRefStateContext.Provider
                value={{
                    csetState: this.csetState,
                    ref: this.state.ref,
                }}>
                {this.props.children}
            </HeaderRefStateContext.Provider>
        );
    }
}
