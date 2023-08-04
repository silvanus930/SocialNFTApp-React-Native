import React from 'react';
import {clog} from 'utils/log';
const CUSTOM_LOG_WARN_HEADER = '!! state/StudioTextState';
const log = (...args) =>
    global.LOG_DEBUG && clog(CUSTOM_LOG_WARN_HEADER, ...args);

const vanillaPostText = {title: '', text: ''};
const vanillaPersonaText = {name: '', bio: ''};

const StudioTextStateContext = React.createContext({
    persona: vanillaPersonaText,
    post: vanillaPostText,
    setPersona: () => {},
    restoreVanilla: () => {},
    setPost: () => {},
});

export {StudioTextStateContext};

export default class StudioTextState extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            persona: JSON.parse(JSON.stringify(vanillaPersonaText)),
            post: JSON.parse(JSON.stringify(vanillaPostText)),
        };
    }

    componentDidMount() {}

    componentWillUnmount() {}

    setPersona = u => {
        log('setPersona', u);
        this.setState({persona: Object.assign(this.state.persona, u)});
    };

    setPost = u => {
        log('setPost', u);
        this.setState({post: Object.assign(this.state.post, u)});
    };

    restoreVanilla = () => {
        log('restoreVanilla');
        this.setState({
            persona: JSON.parse(JSON.stringify(vanillaPersonaText)),
            post: JSON.parse(JSON.stringify(vanillaPostText)),
        });
    };

    render() {
        return (
            <StudioTextStateContext.Provider
                value={{
                    persona: this.state.persona,
                    post: this.state.post,
                    setPersona: this.setPersona,
                    setPost: this.setPost,
                    restoreVanilla: this.restoreVanilla,
                }}>
                {this.props.children}
            </StudioTextStateContext.Provider>
        );
    }
}
