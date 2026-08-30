import { useState } from 'react';
import {
  BookOpen, Brain, LayoutDashboard, Gamepad2, BarChart3, Sparkles, Target,
  Trophy, Settings2, LifeBuoy, PlayCircle, Volume2, VolumeX, Clock, Eye, Zap, Puzzle, Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { speakText, speechSupported, stopSpeaking } from '@/lib/gameGuides';

interface PatientGuideProps {
  onNavigate?: (page: string) => void;
}

const QUICK_TASKS = [
  { page: 'games', icon: Gamepad2, label: 'Start a Brain Game', hint: 'Choose an activity and play' },
  { page: 'dashboard', icon: LayoutDashboard, label: 'Open My Dashboard', hint: 'See your home page' },
  { page: 'daily-challenge', icon: Target, label: 'Today’s Activity', hint: 'One short daily practice' },
  { page: 'analytics', icon: BarChart3, label: 'See My Progress', hint: 'Charts of your practice' },
  { page: 'history', icon: Clock, label: 'My Past Sessions', hint: 'Everything you have played' },
  { page: 'achievements', icon: Trophy, label: 'My Trophies', hint: 'Badges you have earned' },
];

const SKILLS = [
  { icon: Brain, name: 'Memory', text: 'Holding on to what you have just seen or heard, like names, words or where things are.' },
  { icon: Target, name: 'Attention', text: 'Staying focused on one thing without being pulled away by other things around it.' },
  { icon: Zap, name: 'Processing Speed', text: 'How comfortably you take in something and respond to it.' },
  { icon: Puzzle, name: 'Executive Function', text: 'Planning, following rules, and switching between tasks.' },
  { icon: Navigation, name: 'Spatial Skills', text: 'Finding your way around and understanding where things are placed.' },
  { icon: Volume2, name: 'Audio Memory', text: 'Remembering sounds and the order they came in.' },
  { icon: Eye, name: 'Visual Processing', text: 'Noticing details and differences in what you see.' },
];

const SHOW_ME = [
  {
    q: 'How do I start a game?',
    steps: [
      'Select "Brain Games" in the menu at the top of the screen.',
      'Look through the cards and pick an activity you like.',
      'Select the game card to open it.',
      'Read the instructions, then press the start button.',
    ],
    page: 'games',
    cta: 'Go to Brain Games',
  },
  {
    q: 'How do I get help while playing a game?',
    steps: [
      'While a game is open, look at the bottom right of the screen.',
      'Select the blue "How to Play" button.',
      'Read the simple steps, or select "Hear Instructions" to listen.',
      'Select "Back to my game" — your game continues exactly where it was.',
    ],
  },
  {
    q: 'How do I see my progress?',
    steps: [
      'Select "Progress" in the menu to see your charts.',
      'Select "History" to see every session you have played.',
      'Your Dashboard also shows a short summary on the home page.',
    ],
    page: 'analytics',
    cta: 'Open Progress',
  },
  {
    q: 'How do I return to the dashboard?',
    steps: [
      'Select "Dashboard" in the menu at the top.',
      'If you are in a game, choose "Save & Exit" first — your level is saved.',
    ],
    page: 'dashboard',
    cta: 'Open Dashboard',
  },
  {
    q: 'How do I make things easier to see and hear?',
    steps: [
      'Use the speaker button in the top menu to turn sounds on or off.',
      'Use your browser or device zoom to make text larger (hold Ctrl and press + on a computer).',
      'Where you see "Hear Instructions", you can listen instead of reading.',
    ],
  },
  {
    q: 'How do I stop in the middle of a game?',
    steps: [
      'Finish the round you are on, or use the exit option shown on screen.',
      'Choose "Save & Exit" — the level you reached is kept for next time.',
      'When you come back, you continue from where you stopped.',
    ],
  },
];

const PatientGuide = ({ onNavigate }: PatientGuideProps) => {
  const [speaking, setSpeaking] = useState(false);

  const go = (page: string) => {
    if (onNavigate) onNavigate(page);
    else window.dispatchEvent(new CustomEvent('app-navigate', { detail: page }));
  };

  const welcomeText =
    'Welcome to MCI Cognitive Care. This app gives you short, friendly brain training activities you can practise at your own pace. ' +
    'Choose a game, play for a few minutes, and save your progress whenever you like. There is no pass or fail. ' +
    'You can always come back to this guide whenever you need help.';

  const toggleSpeech = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const ok = speakText(welcomeText);
    setSpeaking(ok);
    if (ok) {
      const poll = window.setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          window.clearInterval(poll);
          setSpeaking(false);
        }
      }, 500);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Start Here */}
      <section className="glass-card-strong rounded-3xl p-6 lg:p-8" aria-labelledby="guide-start-here">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shrink-0">
            <BookOpen className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <h1 id="guide-start-here" className="text-3xl lg:text-4xl font-bold text-foreground">
              Start Here — Your Guide
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              This page explains the app in simple steps. Everything here is practice and support —
              take your time, and you can always come back to this page whenever you need help.
            </p>
            {speechSupported() && (
              <Button
                variant="outline"
                onClick={toggleSpeech}
                className="min-h-12 text-base gap-2"
                aria-label={speaking ? 'Stop reading the welcome aloud' : 'Hear the welcome read aloud'}
              >
                {speaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                {speaking ? 'Stop' : 'Hear this'}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Quick access grid */}
      <section aria-labelledby="guide-quick">
        <h2 id="guide-quick" className="text-2xl font-bold text-foreground mb-4">Common things you might want to do</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_TASKS.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.page}
                type="button"
                onClick={() => go(task.page)}
                className="glass-card rounded-2xl p-5 text-left min-h-[88px] flex items-center gap-4 transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary-dark shrink-0">
                  <Icon className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-lg font-semibold text-foreground">{task.label}</span>
                  <span className="block text-sm text-muted-foreground">{task.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main sections */}
      <section aria-labelledby="guide-sections">
        <h2 id="guide-sections" className="text-2xl font-bold text-foreground mb-4">Learn about the app</h2>
        <Accordion type="single" collapsible className="space-y-3">

          <AccordionItem value="a" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><Brain className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> What is MCI Cognitive Care?</span>
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground space-y-3 pb-5">
              <p>It is a friendly app for brain training practice. You play short activities that give your memory, attention and thinking a gentle workout.</p>
              <p>The app is here to support your everyday practice. It does not diagnose or treat anything, and it does not replace your doctor or nurse.</p>
              <p>Everything you do is saved to your own private account. Only you and the doctor caring for you can see it.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="b" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><PlayCircle className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> Getting started</span>
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground pb-5">
              <ol className="list-decimal pl-6 space-y-2">
                <li>Sign in with your email and password.</li>
                <li>Your Dashboard opens. This is your home page.</li>
                <li>Use the menu at the top to move around the app.</li>
                <li>Pick "Brain Games" and choose an activity.</li>
                <li>Play for a few minutes, then choose "Save &amp; Exit".</li>
                <li>Come back tomorrow to keep your streak going.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="c" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><Gamepad2 className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> How to play the games</span>
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground space-y-3 pb-5">
              <ol className="list-decimal pl-6 space-y-2">
                <li>Open "Brain Games" and select a card.</li>
                <li>Read the short instructions on the screen.</li>
                <li>Press the start button when you feel ready.</li>
                <li>Play at your own pace — there is no rush.</li>
                <li>When a level ends you can choose <strong>Continue</strong>, <strong>Replay</strong> or <strong>Save &amp; Exit</strong>.</li>
              </ol>
              <p>Inside every game there is a blue <strong>How to Play</strong> button at the bottom right. Opening it does not stop or restart your game.</p>
              <Button onClick={() => go('games')} className="min-h-12 text-base">Go to Brain Games</Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="d" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><LayoutDashboard className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> Understanding my dashboard</span>
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground space-y-3 pb-5">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Overview</strong> — a summary of your recent practice and any training your doctor has suggested.</li>
                <li><strong>Progress</strong> — simple charts showing how your practice has gone over time.</li>
                <li><strong>Activity</strong> — a calendar-style view of the days you practised.</li>
                <li><strong>Insights</strong> — short, plain-language notes about your practice.</li>
              </ul>
              <p>These numbers describe your practice in this app only. They are not a medical result.</p>
              <Button onClick={() => go('dashboard')} className="min-h-12 text-base">Open Dashboard</Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="e" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><Sparkles className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> How the app adapts to me</span>
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground space-y-3 pb-5">
              <p>The app pays attention to how each activity goes for you. If something feels comfortable, it gently makes the next round a little more challenging. If something feels hard, it eases off.</p>
              <p>Changes are always small and step by step, so nothing suddenly becomes too difficult.</p>
              <p>This is only about choosing the right level of practice for you. It is not a judgement and it is not a medical assessment.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="f" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><Puzzle className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> The skills you practise</span>
            </AccordionTrigger>
            <AccordionContent className="pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SKILLS.map((skill) => {
                  const Icon = skill.icon;
                  return (
                    <div key={skill.name} className="flex gap-3 p-4 rounded-xl bg-muted/40">
                      <Icon className="h-6 w-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{skill.name}</h3>
                        <p className="text-base text-muted-foreground leading-relaxed">{skill.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="g" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><Target className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> Daily training</span>
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground space-y-3 pb-5">
              <p>Each day the app suggests one short activity. A few minutes is plenty — regular practice matters more than long sessions.</p>
              <p>Your doctor may also suggest particular games. You will find those on your Dashboard under Doctor-Assigned Training, with a "Play now" button.</p>
              <Button onClick={() => go('daily-challenge')} className="min-h-12 text-base">Open Today’s Activity</Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="h" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><Trophy className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> Trophies and streaks</span>
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground space-y-3 pb-5">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Trophies</strong> are small badges you collect as you practise.</li>
                <li><strong>Streaks</strong> count the days in a row you have practised.</li>
                <li>Missing a day is absolutely fine. You can start again any time.</li>
              </ul>
              <Button onClick={() => go('achievements')} className="min-h-12 text-base">See My Trophies</Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="i" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><Settings2 className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> Comfort and accessibility</span>
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground pb-5">
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the speaker button in the top menu to turn game sounds on or off.</li>
                <li>Select "Hear Instructions" anywhere you see it to listen instead of reading.</li>
                <li>Make text bigger with your device zoom (hold Ctrl and press + on a computer).</li>
                <li>You can move through the app with the Tab key and press Enter to select.</li>
                <li>Buttons are large and clearly labelled so they are easy to tap.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="j" className="glass-card rounded-2xl px-5 border-none">
            <AccordionTrigger className="text-xl font-semibold py-5 hover:no-underline">
              <span className="flex items-center gap-3 text-left"><LifeBuoy className="h-6 w-6 text-primary shrink-0" aria-hidden="true" /> If I need help</span>
            </AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed text-muted-foreground space-y-3 pb-5">
              <ul className="list-disc pl-6 space-y-2">
                <li>Lost in a game? Select "How to Play" at the bottom right.</li>
                <li>Lost in the app? Select "Dashboard" in the top menu to come home.</li>
                <li>Unsure what something means? Come back to this Guide page.</li>
                <li>Questions about your health or your training plan? Speak with your doctor.</li>
              </ul>
              <p className="font-medium text-foreground">You can always come back here. Nothing you do in this app can break anything.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Show me how */}
      <section aria-labelledby="guide-showme">
        <h2 id="guide-showme" className="text-2xl font-bold text-foreground mb-4">Show me how</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SHOW_ME.map((item) => (
            <article key={item.q} className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{item.q}</h3>
              <ol className="list-decimal pl-6 space-y-2 text-base text-muted-foreground leading-relaxed">
                {item.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
              {item.page && (
                <Button variant="outline" onClick={() => go(item.page!)} className="min-h-12 text-base">
                  {item.cta}
                </Button>
              )}
            </article>
          ))}
        </div>
      </section>

      <p className="text-center text-base text-muted-foreground pb-4">
        This app supports your practice and progress. It does not provide a diagnosis or medical advice —
        please talk to your doctor about anything health related.
      </p>
    </div>
  );
};

export default PatientGuide;
