import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '../ui/Button';
import { Linkedin, AlertCircle } from 'lucide-react';

export const LoginForm = () => {
  const { loginWithRedirect, isLoading, error } = useAuth0();

  const handleLinkedInLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'linkedin',
        screen_hint: 'signin',
      },
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to NetworkF2
          </h2>
          <p className="text-gray-600">
            Connect with founders and entrepreneurs
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error.message}</span>
          </div>
        )}

        <Button
          type="button"
          className="w-full"
          onClick={handleLinkedInLogin}
          loading={isLoading}
          disabled={isLoading}
        >
          <Linkedin className="mr-2 h-4 w-4" />
          Sign in with LinkedIn
        </Button>

        <div className="text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our terms and privacy policy.
            Access is limited to verified founders and entrepreneurs.
          </p>
        </div>
      </div>
    </div>
  );
}; 