interface Config {
  web3AuthClientId: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

const config: Config = {
  web3AuthClientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID || '',
  appName: import.meta.env.VITE_APP_NAME || 'NetworkF2',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config; 