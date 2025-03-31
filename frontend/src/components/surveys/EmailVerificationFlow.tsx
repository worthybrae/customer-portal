// components/surveys/EmailVerificationFlow.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { isValidEmail } from '../../lib/utils';

// Import shadcn components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LoadingSpinner } from '../ui/loading-spinner';

type EmailVerificationFlowProps = {
  onVerificationSuccess: (email: string) => void;
  onCancel: () => void;
};

export default function EmailVerificationFlow({ 
  onVerificationSuccess, 
  onCancel
}: EmailVerificationFlowProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  // Send OTP to email using Supabase
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
      // Use Supabase OTP sign-in
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          // Don't create a user session after verification
          shouldCreateUser: false,
          // Force OTP (6-digit code) instead of magic link
          emailRedirectTo: undefined,
          data: {
            otp_type: 'code'
          }
        }
      });
      
      if (error) throw error;
      
      // Move to code verification step
      setStep('code');
      startResendCooldown();
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start cooldown for resend button
  const startResendCooldown = () => {
    setResendDisabled(true);
    setCountdown(60);
  };

  // Verify the OTP entered by user using Supabase
  const handleVerifyOTP = async () => {
    setError(null);
    
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
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
      // Sign out immediately to not keep the session
      if (data.user) {
        await supabase.auth.signOut();
      }
      
      onVerificationSuccess(email);
    } catch (err: any) {
      console.error('Error verifying code:', err);
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          {step === 'email' 
            ? 'Enter your email to continue with the survey' 
            : 'Enter the 6-digit code sent to your email'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {step === 'email' ? (
          // Email input step
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <LoadingSpinner size="sm" />
                    <span>Sending...</span>
                  </span>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Verification code step
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
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
              />
              <p className="text-sm text-muted-foreground">
                A 6-digit verification code was sent to {email}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('email')}
                size="sm"
              >
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendOTP}
                disabled={resendDisabled}
              >
                {resendDisabled 
                  ? `Resend in ${countdown}s`
                  : 'Resend Code'}
              </Button>
              <Button
                className="flex-1"
                onClick={handleVerifyOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <LoadingSpinner size="sm" />
                    <span>Verifying...</span>
                  </span>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}