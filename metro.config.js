const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const projectRoot = __dirname;
const config = {
  projectRoot,
  watchFolders: [projectRoot],
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
