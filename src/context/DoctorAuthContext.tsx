import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Doctor {
  id: string;
  email: string;
  name: string;
  specialization: string;
  clinic: string;
  avatar?: string | null;
}

interface DoctorAuthContextType {
  doctor: Doctor | null;
  isLoading: boolean;
  login: (doctor: Doctor) => void;
  logout: () => void;
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
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mci_doctor');
      if (saved) setDoctor(JSON.parse(saved));
    } catch {
      localStorage.removeItem('mci_doctor');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (d: Doctor) => {
    setDoctor(d);
    localStorage.setItem('mci_doctor', JSON.stringify(d));
  };

  const logout = () => {
    setDoctor(null);
    localStorage.removeItem('mci_doctor');
  };

  return (
    <DoctorAuthContext.Provider value={{ doctor, isLoading, login, logout, isAuthenticated: !!doctor }}>
      {children}
    </DoctorAuthContext.Provider>
  );
};
