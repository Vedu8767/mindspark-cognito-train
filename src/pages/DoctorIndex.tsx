import { DoctorAuthProvider, useDoctorAuth } from '@/context/DoctorAuthContext';
import DoctorLayout from '@/components/Doctor/DoctorLayout';
import DoctorLogin from '@/pages/DoctorLogin';

const DoctorInner = () => {
  const { isAuthenticated, isLoading } = useDoctorAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading doctor portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <DoctorLogin />;
  return <DoctorLayout />;
};

const DoctorIndex = () => (
  <DoctorAuthProvider>
    <DoctorInner />
  </DoctorAuthProvider>
);

export default DoctorIndex;
