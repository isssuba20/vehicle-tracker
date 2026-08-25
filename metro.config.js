const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Several RN ecosystem packages (react-native-tab-view's use-latest-callback
// dependency among them) ship a package.json "exports" map that Metro's
// experimental exports resolution interprets differently than Node/Babel,
// producing "X.default is not a function" at runtime. Disabling it falls
// back to Metro's classic main-field resolution, which these packages work
// correctly under.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
