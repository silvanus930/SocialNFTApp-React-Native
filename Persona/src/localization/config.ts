import {I18n} from 'i18n-js';

import en from './languages/en.json';

const DEFAULT_LANGUAGE = 'en';

const i18n = new I18n({
    ...en,
});

const translationGetters = {
    en: () => en,
};

const tr = (key: string) => {
    return i18n.t(key);
};

const initLocalization = () => {
    i18n.translations = {
        ['en']: translationGetters.en(),
    };
    i18n.locale = DEFAULT_LANGUAGE;
};

const setLanguage = (language: string) => {
    // Localization.cache.clear() in case multiple langauges
    i18n.locale = language;
};

const getLanguage = () => {
    return i18n.locale;
};

export {tr, initLocalization, setLanguage, getLanguage};
