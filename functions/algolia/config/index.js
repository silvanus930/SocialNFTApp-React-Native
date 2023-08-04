
const algoliasearch = require("algoliasearch");
const { ALGOLIA_KEYS } = require("./constants");

const algolia = algoliasearch(ALGOLIA_KEYS.APP_ID, ALGOLIA_KEYS.API_KEY);
const algoliaIndex = algolia.initIndex(ALGOLIA_KEYS.INDEX_NAME);


module.exports = {
  algoliaIndex,
  algolia,
};
