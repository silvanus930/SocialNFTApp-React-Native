import React from 'react';
import {ProfileModalStateContext} from './ProfileModalState';

export const ProfileModalStateRefContext = React.createContext();

const ProfileModalStateRef = React.memo(ProfileModalStateRefMemo, () => true);
export default ProfileModalStateRef;
function ProfileModalStateRefMemo({children}) {
    const state = React.useContext(ProfileModalStateContext);
    const stateRef = React.useRef(state);
    React.useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return (
        <ProfileModalStateRefContext.Provider value={stateRef}>
            {React.useMemo(() => children, [children])}
        </ProfileModalStateRefContext.Provider>
    );
}
