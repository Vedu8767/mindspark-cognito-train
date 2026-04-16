import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface ProgressHeatmapProps {
  activityData?: Map<string, number>;
}

const ProgressHeatmap = ({ activityData }: ProgressHeatmapProps) => {
  const weeks = 52;
  const daysPerWeek = 7;

  const { cells, monthLabels } = useMemo(() => {
    const today = new Date();
    const cells: { date: string; count: number; dayOfWeek: number; weekIndex: number }[] = [];
    const monthLabels: { label: string; weekIndex: number }[] = [];

    const totalDays = weeks * daysPerWeek;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let lastMonth = -1;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const weekIndex = Math.floor(i / 7);

      const count = activityData?.get(dateStr) || 0;
      cells.push({ date: dateStr, count: d > today ? -1 : count, dayOfWeek, weekIndex });

      const month = d.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: d.toLocaleString('default', { month: 'short' }), weekIndex });
        lastMonth = month;
      }
    }

    return { cells, monthLabels };
  }, [activityData]);

  const getColor = (count: number): string => {
    if (count === -1) return 'bg-transparent';
    if (count === 0) return 'bg-muted/40';
    if (count === 1) return 'bg-success/20';
    if (count === 2) return 'bg-success/40';
    if (count <= 4) return 'bg-success/60';
    return 'bg-success/90';
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  const weekColumns = useMemo(() => {
    const columns: typeof cells[] = [];
    for (let w = 0; w < weeks; w++) {
      columns.push(cells.filter(c => c.weekIndex === w));
    }
    return columns;
  }, [cells]);

  const totalSessions = cells.filter(c => c.count > 0).reduce((s, c) => s + c.count, 0);
  const activeDays = cells.filter(c => c.count > 0).length;
  const maxStreak = useMemo(() => {
    let max = 0, current = 0;
    const sorted = cells.filter(c => c.count >= 0).sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach(c => {
      if (c.count > 0) { current++; max = Math.max(max, current); }
      else current = 0;
    });
    return max;
  }, [cells]);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Training Activity
          </CardTitle>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{totalSessions}</strong> sessions</span>
            <span><strong className="text-foreground">{activeDays}</strong> active days</span>
            <span><strong className="text-foreground">{maxStreak}</strong> max streak</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex ml-8 mb-1">
            {monthLabels.map((m, i) => (
              <div key={`${m.label}-${i}`} className="text-xs text-muted-foreground" style={{ position: 'relative', left: `${m.weekIndex * 14}px`, width: 0, whiteSpace: 'nowrap' }}>
                {m.label}
              </div>
            ))}
          </div>
          <div className="flex">
            <div className="flex flex-col mr-2 mt-0">
              {dayLabels.map((label, i) => (
                <div key={i} className="h-[12px] text-xs text-muted-foreground flex items-center" style={{ marginBottom: '2px' }}>{label}</div>
              ))}
            </div>
            <div className="flex gap-[2px]">
              {weekColumns.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((cell) => (
                    <div key={cell.date} className={`w-[12px] h-[12px] rounded-sm ${getColor(cell.count)} transition-colors hover:ring-1 hover:ring-foreground/20`}
                      title={cell.count >= 0 ? `${cell.date}: ${cell.count} session${cell.count !== 1 ? 's' : ''}` : ''} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end mt-3 space-x-1 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="w-[12px] h-[12px] rounded-sm bg-muted/40" />
            <div className="w-[12px] h-[12px] rounded-sm bg-success/20" />
            <div className="w-[12px] h-[12px] rounded-sm bg-success/40" />
            <div className="w-[12px] h-[12px] rounded-sm bg-success/60" />
            <div className="w-[12px] h-[12px] rounded-sm bg-success/90" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressHeatmap;
