let systemSettings = {
  autoBlacklistOnInjection: true
};

module.exports = {
  getSettings: () => systemSettings,
  updateSettings: (newSettings) => {
    systemSettings = { ...systemSettings, ...newSettings };
    return systemSettings;
  }
};
