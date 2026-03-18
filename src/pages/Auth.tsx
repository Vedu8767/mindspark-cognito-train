import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User } from 'lucide-react';
import AuthLayout from '@/components/Auth/AuthLayout';
import LoginForm from '@/components/Auth/LoginForm';
import SignupForm from '@/components/Auth/SignupForm';
import { useToast } from '@/hooks/use-toast';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

type Role = 'patient' | 'doctor' | null;

const Auth = ({ onAuthSuccess }: AuthProps) => {
  const [role, setRole] = useState<Role>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
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
      await new Promise(resolve => setTimeout(resolve, 2000));
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

  // Role selection screen
  if (!role) {
    return (
      <AuthLayout
        title="Welcome"
        subtitle="Select your role to continue"
      >
        <div className="space-y-4">
          <button
            onClick={() => setRole('patient')}
            className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">I'm a Patient</p>
              <p className="text-sm text-muted-foreground">Access your cognitive training & progress</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/doctor')}
            className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-accent hover:bg-accent/5 transition-all duration-200 group"
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Stethoscope className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">I'm a Doctor</p>
              <p className="text-sm text-muted-foreground">Manage patients & training prescriptions</p>
            </div>
          </button>
        </div>
      </AuthLayout>
    );
  }

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
      <div className="text-center pt-2">
        <button
          onClick={() => setRole(null)}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back to role selection
        </button>
      </div>
    </AuthLayout>
  );
};

export default Auth;