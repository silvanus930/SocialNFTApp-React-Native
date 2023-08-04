import React from 'react';

export const HomeScrollContextState = React.createContext(false);
export const HomeScrollContextControl = React.createContext(() => {});

export default React.memo(HomeScrollState, () => true);
function HomeScrollState({children}) {
    const [scrollToTopToggle, setScrollToTopToggle] = React.useState(false);
    const scrollToTopToggleRef = React.useRef();
    React.useEffect(() => {
        scrollToTopToggleRef.current = scrollToTopToggle;
    }, [scrollToTopToggle]);
    const toggleScrollToTop = React.useCallback(
        () => setScrollToTopToggle(!scrollToTopToggleRef.current),
        [],
    );
    return (
        <HomeScrollContextState.Provider value={scrollToTopToggle}>
            <HomeScrollContextControl.Provider value={toggleScrollToTop}>
                {children}
            </HomeScrollContextControl.Provider>
        </HomeScrollContextState.Provider>
    );
}
