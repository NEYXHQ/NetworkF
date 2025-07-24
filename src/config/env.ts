interface Config {
  auth0Domain: string;
  auth0ClientId: string;
  auth0RedirectUri: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

const config: Config = {
  auth0Domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  auth0ClientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  auth0RedirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin,
  appName: import.meta.env.VITE_APP_NAME || 'NetworkF2',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config; 