// components/surveys/EmailVerification.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { isValidEmail } from '../../lib/utils';

// Import shadcn components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { LoadingSpinner } from '../ui/loading-spinner';

type EmailVerificationProps = {
  onVerificationSuccess: (email: string) => void;
};

export default function EmailVerification({ onVerificationSuccess }: EmailVerificationProps) {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Effect for countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send OTP to email
  const handleSendOTP = async () => {
    setError(null);
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use Supabase OTP sign-in with email option, not magic link
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          shouldCreateUser: false,
          // Use OTP instead of magic link
          emailRedirectTo: undefined,
          // Force OTP (6-digit code) instead of magic link
          data: {
            otp_type: 'code'
          }
        }
      });
      
      if (error) throw error;
      
      // Show code input field
      setShowCodeInput(true);
      
      // Start countdown for resend
      setCountdown(60);
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the OTP entered by user
  const handleVerifyOTP = async () => {
    setError(null);
    
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email'
      });
      
      if (error) throw error;
      
      // Verification successful
      // Sign out immediately since we only needed the verification
      if (data?.user) {
        await supabase.auth.signOut();
      }
      
      // Call the success callback with verified email
      onVerificationSuccess(email);
      
    } catch (err: any) {
      console.error('Error verifying code:', err);
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center gap-2">
        {!showCodeInput ? (
          // Email input with verify button
          <>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Sending...</span>
                </span>
              ) : (
                'Verify'
              )}
            </Button>
          </>
        ) : (
          // OTP code input with verify button
          <>
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => {
                // Allow only numbers and limit to 6 digits
                const input = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setVerificationCode(input);
              }}
              maxLength={6}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleVerifyOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Verifying...</span>
                </span>
              ) : (
                'Submit'
              )}
            </Button>
          </>
        )}
      </div>
      
      {showCodeInput && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            6-digit code sent to {email}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={handleSendOTP}
            disabled={countdown > 0 || isLoading}
            className="p-0 h-auto"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
          </Button>
        </div>
      )}
    </div>
  );
}