# Component Development Guide

This guide serves as a map of best practices to developing components within the Persona codebase. As we grow, it becomes pertinent to establish conventions to streamline development and simplify onboarding of new developers.

Prior to this document, nearly everything was tossed into `src/components`. This included, you guessed it, components, but also screens, state, modals and the like. Ideally, I'd like to see us make the effort to clean this up and organize we go.

If you're writing a new component, or working on an existing one, please follow these suggestions moving forward.

---

### EXAMPLE COMPONENT

Clean, basic structure and organization.

```
import React, {useEffect, useState} from 'react';  // React imports first
import {Text, View} from 'react-native';  // React Native imports next

import {observer} from 'mobx-react-lite';  // Third party libs

import Component from "components/Component";  // Local imports
import GlobalRef from "state/GlobalStateRef";
import TokenStore from 'stores/TokenStore';

import SubComponent from "./components/SubComp";  // Relative imports
import styles from "./styles";

// ES6 style declration; **One Component Per File**
const ComponentName = ({propNameA, propNameB=1}) => {
  // Constants
  const ICON_WIDTH = 100;

  // Hooks: useStates, useContexts, useRefs, useCallbacks
  const [name, setName] = useState("");
  const [value, setValue] = useState(propNameB)

  const globalContext = useContext(GlobalRef);

  const ref = useRef(0);

  const onPress = useCallback(() => {}, [])

  // Variables
  const isVisible = true;

  // Singular return when possible.
  //	   Keep view logic simple, avoiding nested and multiple ternary operations
  //	   within the view itself as this can get difficult to discipher.
  //
  //     Avoid magic numbers, use constants instead.

  return (
    <View>
        <SubComponent name={propNameA} size={ICON_WIDTH} />

        {isVisible ? (
            <Text>Hello, {propNameA}</Text>
        ) : (
            <Text>Invisible</Text>
        )}

        { isVideo ?? <Video file={file} /> }
    </View>
   );
}

// Default export at the bottom of the file
export defaultComponentName;
```

### COMPONENT LOCATION

Global, reusable components should be located in `src/components` using the following convention:

#### DO

```
src/components/ComponentName
src/components/ComponentName/index.js
src/components/ComponentName/styles.js
```

Components which are used only by parent components, should be nested as such:

```
src/components/ComponentName/components
src/components/ComponentName/components/SubComponentOnlyUsedByParent/index.js
src/components/ComponentName/components/SubComponentOnlyUsedByParent/styles.js
```

For example, consider a legacy `UserBio` component that is used only within the `ProfileScreen` component, and located at `src/components/UserBio.js`. Following the above convention, that component should be restructured as such:

```
- src/components/UserBio.js

+ src/components/ProfileScreen/components/UserBio
+ src/components/ProfileScreen/components/UserBio/index.js
+ src/components/ProfileScreen/components/UserBio/styles.js
```

Organizing subcomponents in this fashion will keep our root component directory cleaner. If at some point in the future the `UserBio` component can be used more generally, then it should be moved back.

#### DON'T

Please don't put `ComponentName.js` right in `src/components`. If you're working on an existing component in this form (for which there are many), please take the time to reorganize it adhering to the new convention.

### COMPONENT STYLES

Please make every effort to avoid inline styles. Stylesheets should not be defined within the component itself, but instead in a `styles.js` outside of it and then imported.

```
import styles from "./styles";
const ComponentName = () => { <Text style={styles.text}>Hello</Text> }
export default ComponentName;
```

If your style class needs to be made aware of logic or a variable from the component, it can be written as a function:

```
import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    messageText: beenSeen => ({
        fontWeight: 400,
        fontSize: 14,
        color: !beenSeen ? '#E6E8EB' : '#AAAEB2',
    }),
});

export default styles;
```

Usage:

```
const beenSeen = message?.seen;

return (
  <Text style={styles.messageText(beenSeen)}>Hello, hello...</Text>
);
```

### COMPONENT BEST PRACTICES

-   One component per file
    -   Consider `src/components/FeedScreen.js` before it was refactored. This file was several thousand lines long 😨-- multiple components, styles, named and default exports. It was a lot to reason about. A single component per file reduces cognitive load and improves the developer experience. The refactor looked like:

```
src/components/FeedScreen
src/components/FeedScreen/index.js         // exports subcomponents by name
src/components/FeedScreen/components/Grid
src/components/FeedScreen/components/AnimaGrid
src/components/FeedScreen/components/FollowingGrid
src/components/FeedScreen/components/TransactionGrid
```

_Note: If you're using the wrapped memo pattern, then multiple components per file is acceptable._

-   Avoid complex/ternary pretzel logic in the render:

```
return (
    return (
        <View>
            {canBeSeen
                ? Grid
                : skyIsBlue
                ? AnimaGrid
                : hellIsHot
                ? null
                : TransactionGrid}
        </View>
    );
)
```

-   Avoid logic in the view when a clearer variable will do:

```
return (
	<View>
		{viewingPost?.mediaUrl?.slice(-3) === 'mp4' ? <Video /> : <Image />}
    </View>
);
```

```
const mediaExt =  viewingPost?.mediaUrl?.slice(-3);
const isVideo = mediaExt === 'mp4';
const isImage = mediaExt === 'jpg';

return (
	<View>
		{isVideo && <Video />}
		{isImage && <Image />}
	</View>
);
```

-   Remove unused variables, imports and other declarations in the components you work with. A by-product of moving fast is that many existing files are littered with this type of cruft that can be cleaned up. Let's all do our part.

-   Avoid excessive and/or unnecessary logging in your components. Our log files are already noisy enough. Prefix your log output:

```
const CommunityChat = () => {
   console.log("[CommunityChat] rendered at", new Date());
}
```

-   Consider moving Firebase logic into the appropriate `actions/*` file and importing into the component, instead of writing inline. This keeps the component even leaner and easier to read.

```
import {markMessageAsRead} from "actions/posts";

const DirectMessageItem = () => {
   const onPress = useCallback(() => markDirectMessageAsRead(), []);
}
```

-   Remove unnecessary comments and stale code.

### EXAMPLES

Components within `src/compnents/ComponentName` directories have already been converted to the new format and can be referenced. A few specific examples include:

```
src/components/FeedScreen
src/components/DirectMessages
src/components/ProfileScreen
src/components/WalletBalance
```
