import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Import shadcn components
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LoadingSpinner } from '../ui/loading-spinner';

type EmailVerificationProps = {
  email: string;
  onChangeEmail?: () => void;
  customRedirect?: string;
};

export default function EmailVerification({ email, onChangeEmail, customRedirect }: EmailVerificationProps) {
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState('');
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    setResendError(null);
    setResendSuccess(false);
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setResendSuccess(true);
      setCountdown(60); // Set cooldown for 60 seconds
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      setResendError(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    setShowChangeEmail(true);
  };

  const handleBackToSignIn = () => {
    navigate(customRedirect ? customRedirect.split('/')[0] + '/auth/signin' : '/auth/signin');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We've sent a verification link to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success message */}
        {resendSuccess && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertDescription>Verification email has been sent again!</AlertDescription>
          </Alert>
        )}

        {/* Error message */}
        {resendError && (
          <Alert variant="destructive">
            <AlertDescription>{resendError}</AlertDescription>
          </Alert>
        )}

        {/* Email verification instructions */}
        <div className="space-y-4 py-2">
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <p className="text-sm text-blue-700">
              Please check your inbox (and spam folder) for an email from us and click the verification link.
            </p>
          </div>

          {!showChangeEmail ? (
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResendEmail}
                disabled={isResending || countdown > 0}
              >
                {isResending 
                  ? <span className="flex items-center gap-2 justify-center">
                      <LoadingSpinner size="sm" />
                      <span>Sending...</span>
                    </span>
                  : countdown > 0 
                    ? `Resend in ${countdown}s` 
                    : 'Resend verification email'}
              </Button>
              <Button 
                variant="link" 
                className="w-full text-gray-500"
                onClick={handleChangeEmail}
              >
                Change email address
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-email">New Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowChangeEmail(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // Call the onChangeEmail prop if provided
                    if (onChangeEmail) {
                      onChangeEmail();
                    }
                    // You could implement the actual email change logic here
                    // For now, just hide the form
                    setShowChangeEmail(false);
                  }}
                >
                  Update Email
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Button 
          variant="link" 
          className="text-sm text-gray-500"
          onClick={handleBackToSignIn}
        >
          Back to Sign In
        </Button>
      </CardFooter>
    </Card>
  );
}