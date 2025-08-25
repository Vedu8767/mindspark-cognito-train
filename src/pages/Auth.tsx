import { useState } from 'react';
import AuthLayout from '@/components/Auth/AuthLayout';
import LoginForm from '@/components/Auth/LoginForm';
import SignupForm from '@/components/Auth/SignupForm';
import { useToast } from '@/hooks/use-toast';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

const Auth = ({ onAuthSuccess }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Supabase authentication
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // Mock successful login
      const mockUser = {
        id: '1',
        email,
        name: 'Mrs. Sharma',
        avatar: null,
        createdAt: new Date().toISOString(),
      };
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in to your account.",
      });
      
      onAuthSuccess(mockUser);
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Supabase authentication
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Mock successful signup
      const mockUser = {
        id: '1',
        email: data.email,
        name: data.name,
        avatar: null,
        createdAt: new Date().toISOString(),
      };
      
      toast({
        title: "Account created!",
        description: "Welcome to MCI Cognitive Care. Your journey to better brain health starts now.",
      });
      
      onAuthSuccess(mockUser);
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isLogin ? "Welcome Back" : "Create Account"}
      subtitle={
        isLogin 
          ? "Sign in to continue your cognitive training journey"
          : "Join thousands improving their brain health with AI-powered training"
      }
    >
      {isLogin ? (
        <LoginForm
          onSubmit={handleLogin}
          onSwitchToSignup={() => setIsLogin(false)}
          isLoading={isLoading}
        />
      ) : (
        <SignupForm
          onSubmit={handleSignup}
          onSwitchToLogin={() => setIsLogin(true)}
          isLoading={isLoading}
        />
      )}
    </AuthLayout>
  );
};

export default Auth;