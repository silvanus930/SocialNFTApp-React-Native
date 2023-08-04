/*
  App Localization

  `tr('string_key')` should be used for strings.

  For instance, if you want to utilize the "welcome" string in the app,
  you need to add the key to all language files (src/localization/languages/*).

  After that, you should import the Localization module into the files that will
  make use of these keys:

  ```
    import {tr} from 'localization'
    ...
    return (<Text>{tr('welcome')}</Text>);
  ```
*/

import {tr, setLanguage, initLocalization, getLanguage} from './config';

export {initLocalization, tr, setLanguage, getLanguage};
