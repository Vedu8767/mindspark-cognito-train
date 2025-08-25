import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import AppLayout from '@/components/Layout/AppLayout';

const Index = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default Index;
