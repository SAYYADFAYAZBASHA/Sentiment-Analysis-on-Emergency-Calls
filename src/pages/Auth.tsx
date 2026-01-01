import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, Loader2, LogIn, UserPlus, KeyRound, ShieldCheck, User, Key } from 'lucide-react';
import { z } from 'zod';

type AuthMode = 'login' | 'register' | 'forgot';
type PortalType = 'user' | 'admin';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userRole, signIn, signUp, resetPassword, loading } = useAuth();

  const [portal, setPortal] = useState<PortalType>('user');
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; secretKey?: string }>({});

  // Redirect authenticated users based on role
  useEffect(() => {
    if (user && !loading && userRole) {
      if (userRole === 'admin') {
        navigate('/admin-portal');
      } else {
        navigate('/user-portal');
      }
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    const portalParam = searchParams.get('portal');
    const modeParam = searchParams.get('mode');
    
    if (portalParam === 'admin') setPortal('admin');
    else if (portalParam === 'user') setPortal('user');
    
    if (modeParam === 'register') setMode('register');
    else if (modeParam === 'forgot' || modeParam === 'reset') setMode('forgot');
    else setMode('login');
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode !== 'forgot') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === 'register' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate secret key for admin registration
    if (portal === 'admin' && mode === 'register' && !secretKey.trim()) {
      newErrors.secretKey = 'Admin secret key is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('promote-to-admin', {
        body: { user_id: userId, secret_key: secretKey }
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error promoting to admin:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please verify your email address');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
        }
      } else if (mode === 'register') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please login instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          // For admin registration, promote to admin
          if (portal === 'admin') {
            // Wait a moment for the user to be created and role assigned
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get the current user
            const { data: { user: newUser } } = await supabase.auth.getUser();
            
            if (newUser) {
              const result = await promoteToAdmin(newUser.id);
              if (result.success) {
                toast.success('Admin account created successfully!');
              } else {
                toast.error(result.error || 'Failed to assign admin role. Invalid secret key.');
                // Sign out if admin promotion failed
                await supabase.auth.signOut();
                return;
              }
            }
          } else {
            toast.success('Account created! You can now login.');
          }
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Password reset email sent! Check your inbox.');
          setMode('login');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPortalContent = () => {
    if (portal === 'admin') {
      return {
        icon: mode === 'register' ? <UserPlus className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />,
        title: mode === 'register' ? 'Register as Admin' : mode === 'forgot' ? 'Reset Password' : 'Admin Portal',
        description: mode === 'register' 
          ? 'Create a new administrator account with secret key' 
          : mode === 'forgot' 
          ? 'Enter your email to receive a reset link' 
          : 'Sign in with your administrator credentials',
        color: 'text-accent',
        bgColor: 'bg-accent/10'
      };
    }
    return {
      icon: mode === 'register' ? <UserPlus className="h-6 w-6" /> : mode === 'forgot' ? <KeyRound className="h-6 w-6" /> : <User className="h-6 w-6" />,
      title: mode === 'register' ? 'Create User Account' : mode === 'forgot' ? 'Reset Password' : 'User Portal',
      description: mode === 'register' 
        ? 'Register to access your emergency call dashboard' 
        : mode === 'forgot' 
        ? 'Enter your email to receive a reset link' 
        : 'Sign in to access your emergency call dashboard',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    };
  };

  const content = getPortalContent();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Portal Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={portal === 'user' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => {
              setPortal('user');
              setMode('login');
              setSecretKey('');
            }}
          >
            <User className="h-4 w-4 mr-2" />
            User Portal
          </Button>
          <Button
            variant={portal === 'admin' ? 'secondary' : 'outline'}
            className="flex-1"
            onClick={() => {
              setPortal('admin');
              setMode('login');
            }}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Admin Portal
          </Button>
        </div>

        <Card className="glass border-border/40">
          <CardHeader className="text-center space-y-4">
            <div className={`mx-auto w-12 h-12 rounded-xl ${content.bgColor} flex items-center justify-center ${content.color}`}>
              {content.icon}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{content.title}</CardTitle>
              <CardDescription className="mt-2">{content.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({ ...errors, email: undefined });
                  }}
                  className={`bg-background/50 ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({ ...errors, password: undefined });
                    }}
                    className={`bg-background/50 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    className={`bg-background/50 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Admin Secret Key Field */}
              {portal === 'admin' && mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="secretKey" className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-accent" />
                    Admin Secret Key
                  </Label>
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="Enter admin secret key"
                    value={secretKey}
                    onChange={(e) => {
                      setSecretKey(e.target.value);
                      setErrors({ ...errors, secretKey: undefined });
                    }}
                    className={`bg-background/50 ${errors.secretKey ? 'border-destructive' : ''}`}
                  />
                  {errors.secretKey && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.secretKey}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Contact your system administrator for the secret key
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                variant={portal === 'admin' ? 'secondary' : 'default'}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === 'forgot' ? 'Sending...' : mode === 'register' ? 'Creating...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {mode === 'forgot' ? 'Send Reset Link' : mode === 'register' ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </button>
                  <div className="border-t border-border/40 pt-4">
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-sm text-primary hover:underline"
                    >
                      Don't have an account? Register
                    </button>
                  </div>
                </>
              )}

              {mode === 'register' && (
                <div className="border-t border-border/40 pt-4">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-primary hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              )}

              {mode === 'forgot' && (
                <div className="border-t border-border/40 pt-4">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-primary hover:underline"
                  >
                    Back to login
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
