import React, {useState, createContext} from 'react';

// Create a new context object with default values
export const NativeChatModuleAppContext = createContext({
    isUsingNativeChatModule: false,
    setIsUsingNativeChatModule: () => {},
});
