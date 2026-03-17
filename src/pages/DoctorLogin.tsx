import { useState } from 'react';
import { Stethoscope, Mail, Lock, ArrowRight, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDoctorAuth } from '@/context/DoctorAuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const DoctorLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useDoctorAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    const mockDoctor = {
      id: 'doc-001',
      email: email || 'dr.mehta@mci-clinic.com',
      name: 'Dr. Mehta',
      specialization: 'Neuropsychology',
      clinic: 'MCI Cognitive Care Center',
    };

    login(mockDoctor);
    toast({ title: 'Welcome, Dr. Mehta', description: 'Doctor dashboard is ready.' });
    navigate('/doctor');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(215,50%,97%)] to-[hsl(210,45%,95%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(215,70%,55%)] to-[hsl(215,75%,45%)] mb-4">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">MCI Cognitive Care</h1>
          <p className="text-muted-foreground text-sm">Doctor Portal</p>
        </div>

        {/* Login Card */}
        <div className="glass-card-strong p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Doctor Sign In</h2>
            <p className="text-sm text-muted-foreground">Access your patient management dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="dr.mehta@mci-clinic.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-dark text-primary-foreground" disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : (
                <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="text-center">
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
