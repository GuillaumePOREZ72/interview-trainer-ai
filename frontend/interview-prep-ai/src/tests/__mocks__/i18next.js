let currentLanguage = "en";

module.exports = {
  use: () => ({ init: () => {} }),
  changeLanguage: (lang) => {
    currentLanguage = lang;
    return Promise.resolve();
  },
  t: (key) => key,
  get language() {
    return currentLanguage;
  },
};
