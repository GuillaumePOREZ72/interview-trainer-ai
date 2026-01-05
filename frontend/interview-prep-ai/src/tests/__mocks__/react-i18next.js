module.exports = {
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: () => Promise.resolve(),
      language: "en",
    },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
};
