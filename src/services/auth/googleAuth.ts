/**
 * Google Authentication Service
 * 
 * Handles Google Sign-In for optional cloud backup functionality.
 * The app works fully offline without authentication.
 */

import {Platform} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';
import {logFlipperDebug} from '@/debug/setupFlipper';

const LOG_TAG = '[Spendio][GoogleSignIn]';

const WEB_CLIENT_ID =
  '422902641382-95ambgqur7e179tmtq7anuu6ml2fcu14.apps.googleusercontent.com';

function pickGoogleSignInError(error: unknown): Record<string, unknown> {
  const base: Record<string, unknown> = {typeofError: typeof error};
  if (error == null) {
    return {...base, detail: String(error)};
  }
  if (typeof error === 'string') {
    return {...base, message: error};
  }
  if (error instanceof Error) {
    return {
      ...base,
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  const e = error as Record<string, unknown>;
  const picked: Record<string, unknown> = {...base};
  for (const k of [
    'code',
    'message',
    'userInfo',
    'nativeStackAndroid',
    'domain',
  ]) {
    if (k in e && e[k] !== undefined) {
      picked[k] = e[k];
    }
  }
  try {
    picked.stringified = JSON.stringify(error);
  } catch {
    picked.keys = Object.keys(e as object);
  }
  return picked;
}

function devGoogleSignInLog(
  phase: string,
  payload: Record<string, unknown> = {},
): void {
  if (!__DEV__) {
    return;
  }
  const line = `${LOG_TAG} ${phase}`;
  console.warn(line, payload);
  logFlipperDebug(phase, payload);
}

// Configure Google Sign-In
// Note: You need to configure these in your Google Cloud Console
// For iOS: Either add GoogleService-Info.plist to your project OR provide iosClientId
// For Android: Android OAuth client (package + SHA-1) + this webClientId (Web app type)
export const configureGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      scopes: [
        'https://www.googleapis.com/auth/drive.appdata',
      ],
      webClientId: WEB_CLIENT_ID,
      // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      offlineAccess: true,
    });
    devGoogleSignInLog('configure_ok', {
      platform: Platform.OS,
      webClientIdSuffix: WEB_CLIENT_ID.slice(-40),
      offlineAccess: true,
      driveScope: true,
    });
  } catch (error) {
    const picked = pickGoogleSignInError(error);
    devGoogleSignInLog('configure_failed', picked);
    console.warn('Google Sign-In configuration skipped:', error);
  }
};

export interface GoogleAuthResult {
  success: boolean;
  user?: User;
  error?: string;
  errorCode?: string;
}

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  devGoogleSignInLog('signIn_start', {
    platform: Platform.OS,
    webClientIdSuffix: WEB_CLIENT_ID.slice(-40),
  });
  try {
    const playOk = await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
    devGoogleSignInLog('hasPlayServices_ok', {playOk});
    const userInfo = await GoogleSignin.signIn();
    devGoogleSignInLog('signIn_success', {
      hasUser: !!userInfo?.user,
      userIdLength: userInfo?.user?.id?.length ?? 0,
    });
    return {
      success: true,
      user: userInfo,
    };
  } catch (error: unknown) {
    const typedError = error as {code?: string; message?: string};
    const picked = pickGoogleSignInError(error);
    devGoogleSignInLog('signIn_error_raw', {
      statusCodeCancelled: statusCodes.SIGN_IN_CANCELLED,
      statusCodeInProgress: statusCodes.IN_PROGRESS,
      statusCodePlayServices: statusCodes.PLAY_SERVICES_NOT_AVAILABLE,
      ...picked,
    });

    if (typedError.code === statusCodes.SIGN_IN_CANCELLED) {
      devGoogleSignInLog('signIn_cancelled', {});
      return {
        success: false,
        error: 'Sign in was cancelled',
        errorCode: 'CANCELLED',
      };
    }

    if (typedError.code === statusCodes.IN_PROGRESS) {
      return {
        success: false,
        error: 'Sign in is already in progress',
        errorCode: 'IN_PROGRESS',
      };
    }

    if (typedError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      devGoogleSignInLog('signIn_play_services', picked);
      return {
        success: false,
        error: 'Play services not available',
        errorCode: 'PLAY_SERVICES_UNAVAILABLE',
      };
    }

    // Android DEVELOPER_ERROR often surfaces as code "10" or message containing "DEVELOPER_ERROR"
    const msg = String(typedError.message ?? picked.message ?? '');
    const isDeveloperError =
      msg.includes('DEVELOPER_ERROR') ||
      msg.includes('Developer error') ||
      typedError.code === '10';
    if (isDeveloperError) {
      devGoogleSignInLog('signIn_developer_error_hint', {
        hint:
          'Android: add OAuth client type Android with package com.spendio + debug SHA-1 in Google Cloud Console. webClientId must be Web application type.',
        ...picked,
      });
    }

    return {
      success: false,
      error: typedError.message || 'An unknown error occurred',
      errorCode: 'UNKNOWN',
    };
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async (): Promise<boolean> => {
  try {
    await GoogleSignin.signOut();
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if user is currently signed in
 */
export const isSignedIn = async (): Promise<boolean> => {
  try {
    const isSignedInResult = await GoogleSignin.isSignedIn();
    return isSignedInResult;
  } catch {
    return false;
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userInfo = await GoogleSignin.getCurrentUser();
    return userInfo;
  } catch {
    return null;
  }
};

/**
 * Get access token for API calls
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch (error) {
    devGoogleSignInLog('getAccessToken_failed', pickGoogleSignInError(error));
    return null;
  }
};

/**
 * Refresh access token silently
 */
export const silentSignIn = async (): Promise<User | null> => {
  try {
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo;
  } catch (error) {
    devGoogleSignInLog('silentSignIn_failed', pickGoogleSignInError(error));
    return null;
  }
};
