interface Config {
  apiUrl: string;
  linkedinClientId: string;
  linkedinRedirectUri: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  linkedinClientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
  linkedinRedirectUri: import.meta.env.VITE_LINKEDIN_REDIRECT_URI || 'http://localhost:5173/auth/linkedin/callback',
  appName: import.meta.env.VITE_APP_NAME || 'NetworkF2',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config; 