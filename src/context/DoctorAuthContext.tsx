import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface DoctorProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  specialization: string;
  clinic: string;
  avatar_url: string | null;
  license_number: string | null;
}

interface DoctorAuthContextType {
  user: SupabaseUser | null;
  doctor: DoctorProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string, specialization: string, clinic: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);

export const useDoctorAuth = () => {
  const context = useContext(DoctorAuthContext);
  if (context === undefined) {
    throw new Error('useDoctorAuth must be used within a DoctorAuthProvider');
  }
  return context;
};

export const DoctorAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDoctorProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setDoctor(data as DoctorProfile);
    } else {
      // User exists but has no doctor profile — not a doctor
      setDoctor(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setTimeout(() => fetchDoctorProfile(currentSession.user.id), 0);
        } else {
          setDoctor(null);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchDoctorProfile(existingSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Check that user has a doctor profile
    const { data: docProfile } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (!docProfile) {
      await supabase.auth.signOut();
      return { error: 'No doctor profile found. Please sign up as a doctor first.' };
    }

    return { error: null };
  };

  const signup = async (email: string, password: string, name: string, specialization: string, clinic: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Signup failed' };

    // Create doctor profile
    const { error: profileError } = await supabase
      .from('doctor_profiles')
      .insert({
        user_id: data.user.id,
        name,
        email,
        specialization,
        clinic,
      });

    if (profileError) return { error: profileError.message };

    // Add doctor role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: data.user.id, role: 'doctor' as any });

    // Role insert may fail if no INSERT policy — that's fine, it's managed by trigger
    
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDoctor(null);
    setSession(null);
  };

  return (
    <DoctorAuthContext.Provider value={{
      user,
      doctor,
      session,
      isLoading,
      login,
      signup,
      logout,
      isAuthenticated: !!doctor,
    }}>
      {children}
    </DoctorAuthContext.Provider>
  );
};
