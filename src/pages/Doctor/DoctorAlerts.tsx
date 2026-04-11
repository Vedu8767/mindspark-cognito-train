import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Activity, Trash2, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDoctorProfileId, fetchAlerts, markAlertRead, markAllAlertsRead, deleteAlert, type AlertRow } from '@/lib/doctorDataService';

interface Props {
  onViewPatient?: (id: string) => void;
}

const iconMap: Record<string, any> = {
  decline: AlertTriangle,
  inactivity: Clock,
  missed_session: Activity,
  milestone: CheckCircle,
};

const DoctorAlerts = ({ onViewPatient }: Props) => {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [docId, setDocId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getDoctorProfileId();
      setDocId(id);
      if (id) {
        const data = await fetchAlerts(id);
        setAlerts(data);
      }
      setLoading(false);
    })();
  }, []);

  const handleMarkRead = async (id: string) => {
    await markAlertRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleMarkAllRead = async () => {
    if (docId) {
      await markAllAlertsRead(docId);
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const displayed = filter === 'unread' ? alerts.filter(a => !a.read) : alerts;
  const unreadCount = alerts.filter(a => !a.read).length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground mt-1">{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')}>Unread ({unreadCount})</Button>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>}
        </div>
      </div>

      <div className="space-y-3">
        {displayed.map(alert => {
          const Icon = iconMap[alert.type] || Bell;
          return (
            <Card key={alert.id} className={`border-border transition-colors ${!alert.read ? 'bg-muted/40 border-l-4 border-l-primary' : ''}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${
                  alert.severity === 'high' ? 'bg-destructive/10' : alert.severity === 'medium' ? 'bg-[hsl(var(--warning))]/10' : 'bg-[hsl(var(--success))]/10'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-foreground text-sm">{alert.patientName}</span>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{alert.type.replace('_', ' ')}</Badge>
                    {!alert.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onViewPatient && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={() => onViewPatient(alert.patientId)} title="View patient">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!alert.read && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => handleMarkRead(alert.id)} title="Mark read">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(alert.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {displayed.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No alerts to show.</div>
        )}
      </div>
    </div>
  );
};

export default DoctorAlerts;
