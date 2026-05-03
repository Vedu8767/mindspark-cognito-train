import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { bindBanditsToUser, unbindBandits } from '@/lib/bandit';
import { setAchievementUser, loadAchievementsForCurrentUser } from '@/lib/achievements';

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  cognitive_age: number | null;
  created_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data as UserProfile);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Bind bandit storage to this user so AI Lab data is per-user.
          bindBanditsToUser(currentSession.user.id);
          setAchievementUser(currentSession.user.id);
          // Load this user's achievements from the database (defer to avoid auth deadlock).
          setTimeout(() => { void loadAchievementsForCurrentUser(); }, 0);
          // Defer profile fetch to avoid deadlock
          setTimeout(() => fetchProfile(currentSession.user.id), 0);
        } else {
          unbindBandits();
          setAchievementUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        bindBanditsToUser(existingSession.user.id);
        setAchievementUser(existingSession.user.id);
        void loadAchievementsForCurrentUser();
        fetchProfile(existingSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signup = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    unbindBandits();
    setAchievementUser(null);
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isLoading,
      login,
      signup,
      logout,
      isAuthenticated: !!session,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
