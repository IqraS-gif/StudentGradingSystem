let systemSettings = {
  autoBlacklistOnInjection: false
};

module.exports = {
  getSettings: () => systemSettings,
  updateSettings: (newSettings) => {
    systemSettings = { ...systemSettings, ...newSettings };
    return systemSettings;
  }
};
