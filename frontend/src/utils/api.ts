import { getAuthSession } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-id.execute-api.us-east-1.amazonaws.com';

/**
 * Get authorization headers for API requests
 */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const session = await getAuthSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.tokens.idToken.toString()}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Make authenticated API request
 */
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Please sign in again.');
    } else if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to access this resource.');
    } else if (response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }
  }

  return response;
};

/**
 * Fetch S3 buckets
 */
export const fetchBuckets = async () => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/buckets`);
    const data = await response.json();
    return data.buckets || [];
  } catch (error: any) {
    console.error('Error fetching buckets:', error);
    throw new Error(error.message || 'Failed to fetch buckets');
  }
};

/**
 * Fetch S3 objects from a bucket
 */
export const fetchObjects = async (bucketName: string, prefix?: string) => {
  try {
    const params = new URLSearchParams();
    params.append('bucket', bucketName);
    if (prefix) {
      params.append('prefix', prefix);
    }

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/objects?${params.toString()}`
    );
    
    const data = await response.json();
    
    return {
      CommonPrefixes: data.commonPrefixes || [],
      Contents: data.contents || [],
    };
  } catch (error: any) {
    console.error('Error fetching objects:', error);
    throw new Error(error.message || 'Failed to fetch objects');
  }
};

/**
 * Get presigned URL for S3 object
 */
export const getPresignedUrl = async (bucket: string, key: string) => {
  try {
    const params = new URLSearchParams();
    params.append('bucket', bucket);
    params.append('key', key);

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/presigned-url?${params.toString()}`
    );
    
    const data = await response.json();
    
    if (!data.url) {
      throw new Error('No presigned URL received');
    }
    
    return {
      url: data.url,
    };
  } catch (error: any) {
    console.error('Error getting presigned URL:', error);
    throw new Error(error.message || 'Failed to get download URL');
  }
};