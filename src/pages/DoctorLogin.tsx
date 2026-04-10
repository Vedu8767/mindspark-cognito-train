import { useState } from 'react';
import { Stethoscope, Mail, Lock, ArrowRight, Brain, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDoctorAuth } from '@/context/DoctorAuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const DoctorLogin = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('Neuropsychology');
  const [clinic, setClinic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useDoctorAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        const { error } = await signup(email, password, name, specialization, clinic);
        if (error) {
          toast({ title: 'Signup failed', description: error, variant: 'destructive' });
        } else {
          toast({ title: `Welcome, ${name}`, description: 'Doctor account created successfully.' });
        }
      } else {
        const { error } = await login(email, password);
        if (error) {
          toast({ title: 'Sign in failed', description: error, variant: 'destructive' });
        } else {
          toast({ title: 'Welcome back', description: 'Doctor dashboard is ready.' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(215,50%,97%)] to-[hsl(210,45%,95%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(215,70%,55%)] to-[hsl(215,75%,45%)] mb-4">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">MCI Cognitive Care</h1>
          <p className="text-muted-foreground text-sm">Doctor Portal</p>
        </div>

        <div className="glass-card-strong p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {isSignup ? 'Create Doctor Account' : 'Doctor Sign In'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSignup ? 'Register to manage your patients' : 'Access your patient management dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="Dr. Smith" value={name} onChange={e => setName(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input id="specialization" placeholder="Neuropsychology" value={specialization} onChange={e => setSpecialization(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic">Clinic</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="clinic" placeholder="MCI Cognitive Care Center" value={clinic} onChange={e => setClinic(e.target.value)} className="pl-10" required />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="doctor@clinic.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required minLength={6} />
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-dark text-primary-foreground" disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : (
                <>{isSignup ? 'Create Account' : 'Sign In'} <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <button onClick={() => setIsSignup(!isSignup)} className="text-sm text-primary hover:underline font-medium">
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
            <p className="text-xs text-muted-foreground">
              Are you a patient?{' '}
              <button onClick={() => navigate('/')} className="text-primary hover:underline font-medium">
                Go to Patient Portal
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Brain className="h-3 w-3" />
          <span>Secure healthcare portal • HIPAA aware</span>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
