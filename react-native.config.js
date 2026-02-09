module.exports = {
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {
      sourceDir: './android',
    },
  },
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null, // Use CocoaPods for iOS
      },
    },
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
};
