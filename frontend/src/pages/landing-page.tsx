// pages/landing-page.tsx - Updated with verification handling
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, getEmailDomain } from '../lib/utils';
import { checkCompanyDomain, supabase } from '../lib/supabase';

// Import shadcn components
import { Button } from '../components/ui/button';
import { CheckCircle, Mail } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function LandingPage() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const [showSignIn, setShowSignIn] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'work'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Email verification states
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // Periodically check if email has been verified when in verification mode
  useEffect(() => {
    // Only run this if we are in verification mode
    if (!verificationSent || !verificationEmail) return;
    
    const checkVerification = async () => {
      if (isCheckingVerification) return;
      
      try {
        setIsCheckingVerification(true);
        
        // Try to refresh the auth state to check for verification
        const { data } = await supabase.auth.refreshSession();
        
        // If email is confirmed, sign in and redirect
        if (data.user?.email_confirmed_at) {
          toast({
            title: "Email verified",
            description: "Your email has been verified successfully.",
          });
          
          // Navigate to dashboard (AuthContext will handle the session)
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
  }, [verificationSent, verificationEmail, navigate, toast, isCheckingVerification]);

  // Handle sign in form submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setIsLoading(true);
      await signIn(email, password);
      
      // The auth context will handle the redirect
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.message?.includes('verify your email')) {
        // Email verification error - switch to verification mode
        setVerificationSent(true);
        setVerificationEmail(email);
        toast({
          title: "Verification required",
          description: "Please verify your email before signing in.",
        });
      } else {
        // Other login errors
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign up form submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate inputs
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // If work account, check if the company domain exists
      if (accountType === 'work') {
        const domain = getEmailDomain(email);
        
        if (!domain) {
          setError('Invalid email domain');
          setIsLoading(false);
          return;
        }
        
        const { exists } = await checkCompanyDomain(domain);
        
        if (!exists) {
          // Company doesn't exist, redirect to company creation with email and domain info
          navigate('/auth/create-company', { 
            state: { 
              email,
              domain
            } 
          });
          return;
        }
      }
      
      // Create account
      const { user } = await signUp(email, password);
      
      // Check if the user needs to verify their email
      if (user && !user.email_confirmed_at) {
        // Switch to verification mode
        setVerificationSent(true);
        setVerificationEmail(email);
        toast({
          title: "Verification email sent",
          description: "Please check your inbox and verify your email address.",
        });
      } else {
        // This branch should rarely execute as usually email verification is required
        toast({
          title: "Account created",
          description: "Your account has been successfully created.",
        });
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      if (error.message?.includes('email already in use')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else {
        setError(error.message || 'Error creating account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resend verification email
  const handleResendEmail = async () => {
    setResendError(null);
    setResendSuccess(false);
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
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
  
  // Return back to login/signup form
  const handleBackToForm = () => {
    setVerificationSent(false);
    setVerificationEmail('');
    setResendSuccess(false);
    setResendError(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <div className="font-bold text-xl">enigma</div>
          
          {/* Auth Toggle Button - Only show when not in verification mode */}
          {!verificationSent && (
            <Button
              variant="ghost"
              onClick={() => setShowSignIn(!showSignIn)}
            >
              {showSignIn ? 'Create Account' : 'Sign In'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {verificationSent ? (
          // Email Verification UI
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Check your email</h2>
                <p className="text-gray-600">
                  We've sent a verification link to <strong>{verificationEmail}</strong>
                </p>
              </div>
              
              {/* Success message */}
              {resendSuccess && (
                <div className="mb-4 p-4 bg-green-50 text-green-700 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verification email has been sent again!
                  </div>
                </div>
              )}

              {/* Error message */}
              {resendError && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
                  {resendError}
                </div>
              )}

              {/* Instructions */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-sm text-blue-700">
                    Please check your inbox (and spam folder) for an email from us and click the verification link.
                    <br /><br />
                    This page will automatically redirect you once your email is verified.
                  </p>
                </div>

                {/* Actions */}
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
                
                <Button 
                  variant="link" 
                  className="w-full"
                  onClick={handleBackToForm}
                >
                  Back to {showSignIn ? 'Sign In' : 'Create Account'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Regular Auth UI (Sign In/Up)
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left column with copy */}
            <div className="lg:w-1/2 space-y-6">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
                Free for everyone
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                Create unlimited surveys with powerful analytics
              </h1>
              <p className="text-xl text-slate-600 max-w-xl">
                Build, share, and analyze surveys with our intuitive platform. Get insights faster with consent-based data collection that respects privacy.
              </p>
              
              <div className="pt-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 text-sm text-slate-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span>No credit card required</span>
                </div>
                <span className="hidden sm:inline mx-2">•</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span>Unlimited surveys</span>
                </div>
                <span className="hidden sm:inline mx-2">•</span>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span>GDPR compliant</span>
                </div>
              </div>
            </div>
            
            {/* Right column with auth form */}
            <div className="lg:w-1/2 w-full max-w-md">
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
                    {error}
                  </div>
                )}
              
                {showSignIn ? (
                  <form onSubmit={handleSignIn}>
                    <h2 className="text-2xl font-bold mb-1">Sign In</h2>
                    <p className="text-gray-600 mb-6">Enter your credentials to access your account</p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium">Email</label>
                        <input 
                          type="email" 
                          id="email" 
                          placeholder="you@example.com" 
                          className="w-full rounded-md border border-gray-300 p-2"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label htmlFor="password" className="block text-sm font-medium">Password</label>
                          <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
                        </div>
                        <input 
                          type="password" 
                          id="password" 
                          className="w-full rounded-md border border-gray-300 p-2"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-slate-900 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t text-center text-gray-600">
                      Don't have an account? <Button type="button" variant="link" className="p-0" onClick={() => {
                        setShowSignIn(false);
                        setError(null);
                      }}>Create an account</Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSignUp}>
                    <h2 className="text-2xl font-bold mb-1">Create Account</h2>
                    <p className="text-gray-600 mb-6">Get started with your free account</p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="signup-email" className="block text-sm font-medium">Email</label>
                        <input 
                          type="email" 
                          id="signup-email" 
                          placeholder="you@example.com" 
                          className="w-full rounded-md border border-gray-300 p-2"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Account Type</label>
                        <div className="space-y-2">
                          <div className="flex items-center p-3 border rounded-md">
                            <input 
                              type="radio" 
                              id="personal" 
                              name="account-type" 
                              className="mr-2" 
                              checked={accountType === 'personal'}
                              onChange={() => setAccountType('personal')}
                              disabled={isLoading}
                            />
                            <label htmlFor="personal" className="text-sm">Personal account</label>
                          </div>
                          <div className="flex items-center p-3 border rounded-md">
                            <input 
                              type="radio" 
                              id="work" 
                              name="account-type" 
                              className="mr-2" 
                              checked={accountType === 'work'}
                              onChange={() => setAccountType('work')}
                              disabled={isLoading}
                            />
                            <label htmlFor="work" className="text-sm">
                              Work account {email && getEmailDomain(email) ? `for ${getEmailDomain(email)}` : ''}
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="signup-password" className="block text-sm font-medium">Password</label>
                        <input 
                          type="password" 
                          id="signup-password" 
                          placeholder="At least 8 characters" 
                          className="w-full rounded-md border border-gray-300 p-2"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="confirm-password" className="block text-sm font-medium">Confirm Password</label>
                        <input 
                          type="password" 
                          id="confirm-password" 
                          placeholder="Re-enter your password" 
                          className="w-full rounded-md border border-gray-300 p-2"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-slate-900 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t text-center text-gray-600">
                      Already have an account? <Button type="button" variant="link" className="p-0" onClick={() => {
                        setShowSignIn(true);
                        setError(null);
                      }}>Sign in</Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}