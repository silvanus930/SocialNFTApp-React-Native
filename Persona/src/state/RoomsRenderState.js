import React from 'react';
import _ from 'lodash';

const RoomsRenderStateContext = React.createContext({
    csetState: () => {},
    rerenderBit: false,
});

export {RoomsRenderStateContext};

export default class RoomsRenderState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rerenderBit: false,
        };
    }

    csetState = newState => {
        //console.log('RoomsRenderState', newState);
        this.setState(newState);
    };

    render() {
        /*console.log(
            '\n\n',
            '>>>>>>>>>>>>>>>>>>>>>>> RENDER RoomsRenderState:',
            '\n\n',
        );*/
        return (
            <RoomsRenderStateContext.Provider
                value={{
                    csetState: this.csetState,
                    rerenderBit: this.state.rerenderBit,
                }}>
                {this.props.children}
            </RoomsRenderStateContext.Provider>
        );
    }
}
