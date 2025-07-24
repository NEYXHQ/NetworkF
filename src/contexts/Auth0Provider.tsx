import { Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react';
import type { ReactNode } from 'react';
import config from '../config/env';

interface Auth0ProviderProps {
  children: ReactNode;
}

export const Auth0Provider = ({ children }: Auth0ProviderProps) => {
  if (!config.auth0Domain || !config.auth0ClientId) {
    console.error('Auth0 configuration missing. Please check your environment variables.');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-600">
            Auth0 configuration is missing. Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Auth0ProviderBase
      domain={config.auth0Domain}
      clientId={config.auth0ClientId}
      authorizationParams={{
        redirect_uri: config.auth0RedirectUri,
        connection: 'linkedin', // Force LinkedIn connection
        scope: 'openid profile email',
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0ProviderBase>
  );
}; 