import { useState, useEffect } from 'react';
import { useDoctorAuth } from '@/context/DoctorAuthContext';
import { Button } from '@/components/ui/button';
import {
  Stethoscope, Users, ClipboardList, BarChart3, Bell, LayoutDashboard,
  LogOut, Menu, X, User,
} from 'lucide-react';
import DoctorOverview from '@/pages/Doctor/DoctorOverview';
import PatientList from '@/pages/Doctor/PatientList';
import PatientProfile from '@/pages/Doctor/PatientProfile';
import TrainingPrescriptions from '@/pages/Doctor/TrainingPrescriptions';
import DoctorReports from '@/pages/Doctor/DoctorReports';
import DoctorAlerts from '@/pages/Doctor/DoctorAlerts';
import { getDoctorProfileId, fetchUnreadAlertCount } from '@/lib/doctorDataService';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'prescriptions', label: 'Training Plans', icon: ClipboardList },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

const DoctorLayout = () => {
  const { doctor, logout } = useDoctorAuth();
  const [currentPage, setCurrentPage] = useState('overview');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    (async () => {
      const docId = await getDoctorProfileId();
      if (docId) {
        const count = await fetchUnreadAlertCount(docId);
        setUnreadAlerts(count);
      }
    })();
  }, [currentPage]);

  const handleViewPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('patient-profile');
  };

  const handleBackToPatients = () => {
    setSelectedPatientId(null);
    setCurrentPage('patients');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <DoctorOverview onViewPatient={handleViewPatient} onNavigate={setCurrentPage} />;
      case 'patients': return <PatientList onViewPatient={handleViewPatient} />;
      case 'patient-profile': return selectedPatientId ? <PatientProfile patientId={selectedPatientId} onBack={handleBackToPatients} /> : <PatientList onViewPatient={handleViewPatient} />;
      case 'prescriptions': return <TrainingPrescriptions />;
      case 'reports': return <DoctorReports />;
      case 'alerts': return <DoctorAlerts onViewPatient={handleViewPatient} />;
      default: return <DoctorOverview onViewPatient={handleViewPatient} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r border-border transition-all duration-300 flex flex-col shrink-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border gap-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary-dark shrink-0">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate">Doctor Portal</p>
              <p className="text-[10px] text-muted-foreground truncate">MCI Cognitive Care</p>
            </div>
          )}
          <Button variant="ghost" size="sm" className="ml-auto shrink-0 h-8 w-8 p-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'patients' && currentPage === 'patient-profile');
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); if (item.id !== 'patients') setSelectedPatientId(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive ? 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-hover hover:text-foreground'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
                {item.id === 'alerts' && unreadAlerts > 0 && sidebarOpen && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadAlerts}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Doctor profile */}
        {sidebarOpen && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-accent-foreground" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium text-foreground truncate">{doctor?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{doctor?.specialization}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default DoctorLayout;
