/**
 * Optional Flipper bridge for custom debug events (dev only).
 * Install Flipper Desktop (same major version as FLIPPER_VERSION in android/build.gradle),
 * open your app, then add a sandbox plugin with id "SpendioGoogleSignInDebug" to see events,
 * or use Metro / adb logcat for [Spendio][GoogleSignIn] logs.
 */

import {Platform} from 'react-native';

type FlipperConnection = {
  send: (method: string, data: unknown) => void;
};

let flipperConnection: FlipperConnection | null = null;

export function setupSpendioFlipper(): void {
  if (!__DEV__) {
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {addPlugin} = require('react-native-flipper') as {
      addPlugin: (plugin: {
        getId: () => string;
        onConnect: (connection: FlipperConnection) => void;
        onDisconnect: () => void;
      }) => void;
    };
    addPlugin({
      getId: () => 'SpendioGoogleSignInDebug',
      onConnect(connection) {
        flipperConnection = connection;
        try {
          connection.send('startup', {
            platform: Platform.OS,
            message: 'Spendio debug plugin connected',
            at: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      },
      onDisconnect() {
        flipperConnection = null;
      },
    });
  } catch {
    // react-native-flipper not linked or native module unavailable
  }
}

export function logFlipperDebug(
  method: string,
  payload: Record<string, unknown>,
): void {
  if (!__DEV__ || !flipperConnection) {
    return;
  }
  try {
    flipperConnection.send(method, {
      ...payload,
      at: new Date().toISOString(),
      platform: Platform.OS,
    });
  } catch {
    // ignore
  }
}
