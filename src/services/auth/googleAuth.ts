/**
 * Google Authentication Service
 * 
 * Handles Google Sign-In for optional cloud backup functionality.
 * The app works fully offline without authentication.
 */

import {
  GoogleSignin,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
// Note: You need to configure these in your Google Cloud Console
// For iOS: Either add GoogleService-Info.plist to your project OR provide iosClientId
// For Android: Add google-services.json to android/app/
export const configureGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      scopes: [
        'https://www.googleapis.com/auth/drive.appdata',
      ],
      // Uncomment and replace with your actual client IDs from Google Cloud Console
      // webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      offlineAccess: true,
    });
  } catch (error) {
    // Google Sign-In configuration failed - this is okay for local-only usage
    // The app will work without cloud backup functionality
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
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    return {
      success: true,
      user: userInfo,
    };
  } catch (error: unknown) {
    const typedError = error as {code?: string; message?: string};
    
    if (typedError.code === statusCodes.SIGN_IN_CANCELLED) {
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
      return {
        success: false,
        error: 'Play services not available',
        errorCode: 'PLAY_SERVICES_UNAVAILABLE',
      };
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
  } catch {
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
  } catch {
    return null;
  }
};
