// Enhanced verify-email.tsx with auto-redirect on verification
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Import shadcn components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, Mail } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isEmailVerified } = useAuth();
  const email = location.state?.email || (user?.email || '');
  
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Redirect if email verification is already completed
  useEffect(() => {
    if (isEmailVerified) {
      navigate('/dashboard');
    }
  }, [isEmailVerified, navigate]);

  // Redirect if no email is provided
  useEffect(() => {
    if (!email) {
      navigate('/');
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Periodically check if email has been verified
  useEffect(() => {
    // Only run this if we have an email and are not already verified
    if (!email || isEmailVerified) return;
    
    const checkVerification = async () => {
      if (isCheckingVerification) return;
      
      try {
        setIsCheckingVerification(true);
        
        // Try to refresh the session to check if email was verified
        const { data } = await supabase.auth.refreshSession();
        
        // If email is confirmed, the auth context will update and redirect
        if (data.user?.email_confirmed_at) {
          // Explicit navigate to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setIsCheckingVerification(false);
      }
    };
    
    // Check immediately on mount
    checkVerification();
    
    // Set up an interval to check every 5 seconds
    const interval = setInterval(checkVerification, 5000);
    
    return () => clearInterval(interval);
  }, [email, isEmailVerified, navigate, isCheckingVerification]);

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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">

      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent a verification link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Success message */}
          {resendSuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verification email has been sent again!
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {resendError && (
            <Alert className="bg-red-50 border-red-200 text-red-800">
              <AlertDescription>{resendError}</AlertDescription>
            </Alert>
          )}

          {/* Email verification instructions */}
          <div className="space-y-4 py-2">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <p className="text-sm text-blue-700">
                Please check your inbox (and spam folder) for an email from us and click the verification link.
                <br/><br/>
                This page will automatically redirect you once your email is verified.
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
            >
              {isResending 
                ? 'Sending...'
                : countdown > 0 
                  ? `Resend in ${countdown}s` 
                  : 'Resend verification email'}
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t pt-4">
          <Button 
            variant="link" 
            className="text-sm text-gray-500"
            onClick={() => navigate('/')}
          >
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}