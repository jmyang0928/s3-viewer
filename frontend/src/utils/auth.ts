import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession, SignInInput } from 'aws-amplify/auth';
import { toast } from 'react-toastify';
import amplifyConfig from '../amplifyconfiguration.json';

// Configure Amplify
Amplify.configure(amplifyConfig);

export interface AuthUser {
  username: string;
  email?: string;
  signInDetails: {
    loginId: string;
  };
}

export interface AuthSession {
  tokens: {
    accessToken: {
      toString(): string;
    };
    idToken: {
      toString(): string;
    };
  };
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

/**
 * Sign in user with email and password
 */
export const signInUser = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const signInInput: SignInInput = {
      username: email,
      password: password,
    };

    const { isSignedIn, nextStep } = await signIn(signInInput);

    if (isSignedIn) {
      const user = await getCurrentUser();
      return {
        username: user.username,
        email: email,
        signInDetails: {
          loginId: email
        }
      };
    } else {
      // Handle additional steps if needed (MFA, etc.)
      throw new Error(`Sign in requires additional steps: ${nextStep.signInStep}`);
    }
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Sign in failed';
    
    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Invalid email or password';
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = 'Please confirm your email address';
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'User not found';
    } else if (error.name === 'TooManyRequestsException') {
      errorMessage = 'Too many attempts. Please try again later';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Sign out current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut();
    toast.success('🚀 Signed out successfully!');
  } catch (error: any) {
    console.error('Sign out error:', error);
    toast.error('❌ Failed to sign out');
    throw error;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentAuthUser = async (): Promise<AuthUser | null> => {
  try {
    const user = await getCurrentUser();
    return {
      username: user.username,
      email: user.signInDetails?.loginId,
      signInDetails: {
        loginId: user.signInDetails?.loginId || user.username
      }
    };
  } catch (error) {
    console.log('No authenticated user found');
    return null;
  }
};

/**
 * Get current auth session with tokens and credentials
 */
export const getAuthSession = async (): Promise<AuthSession | null> => {
  try {
    const session = await fetchAuthSession();
    
    if (!session.tokens || !session.credentials) {
      throw new Error('Invalid session');
    }
    
    return {
      tokens: {
        accessToken: session.tokens.accessToken!,
        idToken: session.tokens.idToken!,
      },
      credentials: {
        accessKeyId: session.credentials.accessKeyId!,
        secretAccessKey: session.credentials.secretAccessKey!,
        sessionToken: session.credentials.sessionToken,
      }
    };
  } catch (error) {
    console.error('Failed to get auth session:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await getCurrentAuthUser();
    return user !== null;
  } catch (error) {
    return false;
  }
};