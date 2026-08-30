import { useEffect, useState } from 'react';
import { Brain, LayoutDashboard, Target, Gamepad2, BarChart3, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';

const STORAGE_PREFIX = 'patient-tour-complete:';

const STEPS = [
  {
    icon: Brain,
    title: 'Welcome to MCI Cognitive Care',
    body: 'This app gives you short, friendly brain training activities. There is no test and no pass or fail — it is simply practice.',
  },
  {
    icon: LayoutDashboard,
    title: 'Your Home Dashboard',
    body: 'The Dashboard is your home page. It shows your recent practice, your streak, and how you are doing over time.',
  },
  {
    icon: Target,
    title: "Today's Training",
    body: 'On the Dashboard you will see training your doctor has suggested, and a Daily activity you can try each day.',
  },
  {
    icon: Gamepad2,
    title: 'Brain Games',
    body: 'Open Brain Games to choose an activity. Each game has a “How to Play” button, so help is always one tap away.',
  },
  {
    icon: BarChart3,
    title: 'Your Results and Progress',
    body: 'After playing you can save and exit at any time. Progress and History show how your practice is going.',
  },
  {
    icon: BookOpen,
    title: 'The Guide is always here',
    body: 'The Guide page explains everything in simple steps. You can always come back to it whenever you need help.',
  },
  {
    icon: CheckCircle2,
    title: "You're ready",
    body: 'That is everything. Start whenever you feel ready, and take as much time as you like.',
  },
];

interface WelcomeTourProps {
  onOpenGuide?: () => void;
}

const WelcomeTour = ({ onOpenGuide }: WelcomeTourProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const storageKey = user ? `${STORAGE_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (localStorage.getItem(storageKey) !== 'true') setOpen(true);
    } catch {
      /* storage unavailable — skip the tour rather than blocking the app */
    }
  }, [storageKey]);

  const finish = () => {
    if (storageKey) {
      try { localStorage.setItem(storageKey, 'true'); } catch { /* ignore */ }
    }
    setOpen(false);
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary-dark">
              <Icon className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <DialogTitle className="text-2xl">{current.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed pt-3 text-muted-foreground">
            {current.body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`h-2.5 rounded-full transition-all ${i === step ? 'w-8 bg-primary' : 'w-2.5 bg-muted'}`}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={finish}
            className="min-h-12 text-base"
          >
            Skip
          </Button>
          <div className="flex-1 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="min-h-12 text-base flex-1"
            >
              Back
            </Button>
            {isLast ? (
              <Button
                onClick={() => { finish(); onOpenGuide?.(); }}
                className="min-h-12 text-base flex-1"
              >
                Finish
              </Button>
            ) : (
              <Button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="min-h-12 text-base flex-1"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeTour;
