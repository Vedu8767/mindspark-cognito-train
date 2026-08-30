import { useEffect, useState } from 'react';
import { HelpCircle, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GAME_GUIDES, guideToSpeech, speakText, speechSupported, stopSpeaking } from '@/lib/gameGuides';

interface GameHelpButtonProps {
  gameId: string;
}

/**
 * Floating "How to Play" helper rendered alongside an active game.
 * It is purely presentational — opening or closing it never touches game state.
 */
const GameHelpButton = ({ gameId }: GameHelpButtonProps) => {
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const guide = GAME_GUIDES[gameId];

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (!open) {
      stopSpeaking();
      setSpeaking(false);
    }
  }, [open]);

  if (!guide) return null;

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const ok = speakText(guideToSpeech(guide));
    setSpeaking(ok);
    if (ok) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {}, { once: true });
      const poll = window.setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          window.clearInterval(poll);
          setSpeaking(false);
        }
      }, 500);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How to play this game"
        className="fixed bottom-6 right-6 z-40 min-h-14 min-w-14 h-14 rounded-full px-5 gap-2 shadow-lg bg-gradient-to-r from-primary to-primary-dark text-primary-foreground"
      >
        <HelpCircle className="h-6 w-6" aria-hidden="true" />
        <span className="hidden sm:inline text-base font-semibold">How to Play</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{guide.title} — How to Play</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {guide.what}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-base leading-relaxed">
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-1">Your goal</h3>
              <p className="text-muted-foreground">{guide.goal}</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">Simple steps</h3>
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                {guide.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-1">If I make a mistake</h3>
              <p className="text-muted-foreground">{guide.mistake}</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-1">How scoring works</h3>
              <p className="text-muted-foreground">{guide.scoring}</p>
            </section>

            <p className="text-sm text-muted-foreground">
              Take your time. This is practice — there is no pass or fail.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {speechSupported() && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSpeak}
                className="min-h-12 text-base gap-2"
                aria-label={speaking ? 'Stop reading instructions aloud' : 'Hear these instructions read aloud'}
              >
                {speaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                {speaking ? 'Stop' : 'Hear Instructions'}
              </Button>
            )}
            <Button type="button" onClick={() => setOpen(false)} className="min-h-12 text-base gap-2 flex-1">
              <X className="h-5 w-5" aria-hidden="true" />
              Back to my game
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GameHelpButton;
