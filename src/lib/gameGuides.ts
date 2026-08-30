// Plain-language "How to Play" content for each of the 12 games.
// Content is descriptive only — it does not change any game behaviour.

export interface GameGuide {
  title: string;
  what: string;
  goal: string;
  steps: string[];
  mistake: string;
  scoring: string;
}

export const GAME_GUIDES: Record<string, GameGuide> = {
  'memory-matching': {
    title: 'Memory Matching',
    what: 'A card game where matching pictures are hidden face down.',
    goal: 'Find every matching pair of cards.',
    steps: [
      'Tap a card to turn it over and see the picture.',
      'Tap a second card to look for the same picture.',
      'If the two pictures match, the cards stay open.',
      'If they do not match, they turn back over. Try to remember where they were.',
      'Keep going until all pairs are found.',
    ],
    mistake: 'Nothing bad happens. The cards simply turn back over and you can try again.',
    scoring: 'You earn points for each pair you find. Finding pairs with fewer tries earns more points.',
  },
  'attention-focus': {
    title: 'Attention Focus',
    what: 'A game where you look for one kind of shape among other shapes.',
    goal: 'Tap only the target items and leave the others alone.',
    steps: [
      'Read which item you need to look for.',
      'Look carefully at the items on the screen.',
      'Tap only the items that match the target.',
      'Ignore everything else.',
    ],
    mistake: 'Tapping the wrong item just lowers your accuracy a little. You can keep playing.',
    scoring: 'Points come from how many correct items you tap and how accurate you are.',
  },
  'reaction-speed': {
    title: 'Reaction Speed',
    what: 'A game that practises responding quickly when something appears.',
    goal: 'Respond as soon as you see the signal.',
    steps: [
      'Press Start when you are ready.',
      'Wait calmly and watch the screen.',
      'As soon as the signal appears, tap or press the key.',
      'Repeat for each round.',
    ],
    mistake: 'Responding too early or too late simply ends that round. The next round begins normally.',
    scoring: 'Faster, steadier responses earn more points.',
  },
  'pattern-recognition': {
    title: 'Pattern Recognition',
    what: 'A game where you work out what comes next in a pattern.',
    goal: 'Choose the answer that completes the pattern.',
    steps: [
      'Look at the sequence shown on the screen.',
      'Think about how it changes from one step to the next.',
      'Choose the option you believe comes next.',
      'Continue with the following pattern.',
    ],
    mistake: 'A wrong choice is fine. You simply move on to the next pattern.',
    scoring: 'Each correct answer adds points. More correct answers in a row helps your score.',
  },
  'word-memory': {
    title: 'Word Memory',
    what: 'A game where you see a list of words and recall them afterwards.',
    goal: 'Remember as many of the words as you can.',
    steps: [
      'Read the words shown on the screen.',
      'Wait for the words to disappear.',
      'Select or type the words you remember.',
      'Submit your answer when you are done.',
    ],
    mistake: 'Missing a word is completely normal. Nothing is lost — just continue.',
    scoring: 'You earn points for each word you correctly remember.',
  },
  'math-challenge': {
    title: 'Math Challenge',
    what: 'Short number problems to practise thinking and problem solving.',
    goal: 'Answer each number question.',
    steps: [
      'Read the number problem on the screen.',
      'Work out the answer in your head.',
      'Choose or type your answer.',
      'Move on to the next problem.',
    ],
    mistake: 'An incorrect answer is not a problem. The next question appears as usual.',
    scoring: 'Correct answers add points. Answering calmly and correctly matters more than rushing.',
  },
  'visual-processing': {
    title: 'Visual Processing',
    what: 'A game about noticing details and differences in what you see.',
    goal: 'Spot the item that is asked for on the screen.',
    steps: [
      'Look at the images shown.',
      'Read what you are asked to find.',
      'Tap the image that matches.',
      'Continue with the next round.',
    ],
    mistake: 'Choosing the wrong image only affects your accuracy slightly.',
    scoring: 'Points come from correct choices and how consistently you spot them.',
  },
  'executive-function': {
    title: 'Executive Function',
    what: 'A game about following rules and switching between tasks.',
    goal: 'Follow the rule shown for each task.',
    steps: [
      'Read the current rule carefully.',
      'Respond according to that rule.',
      'Watch for the rule changing.',
      'Complete all the tasks in the round.',
    ],
    mistake: 'If you follow the old rule by mistake, simply continue with the new one.',
    scoring: 'Points reflect how many tasks you complete correctly.',
  },
  'spatial-navigation': {
    title: 'Spatial Navigation',
    what: 'A game about finding your way around a small map or grid.',
    goal: 'Move to the goal position.',
    steps: [
      'Look at the layout and find where you need to go.',
      'Use the on-screen buttons or the arrow keys to move.',
      'Take one step at a time.',
      'Reach the goal to complete the round.',
    ],
    mistake: 'A wrong turn is fine — you can simply move in another direction.',
    scoring: 'Reaching the goal earns points. Shorter, more direct routes score higher.',
  },
  'processing-speed': {
    title: 'Processing Speed',
    what: 'A game about making quick, simple decisions.',
    goal: 'Answer each quick item as it appears.',
    steps: [
      'Press Start when you are ready.',
      'Look at the item shown.',
      'Choose your answer straight away.',
      'Keep going through the items.',
    ],
    mistake: 'Wrong answers only affect accuracy. Nothing is lost.',
    scoring: 'Points reflect how many items you answer correctly in the round.',
  },
  'audio-memory': {
    title: 'Audio Memory',
    what: 'A game where you listen to a sequence of sounds and repeat it.',
    goal: 'Repeat the sound sequence in the same order.',
    steps: [
      'Turn your sound on and press Start.',
      'Listen and watch the sequence carefully.',
      'Tap the buttons in the same order.',
      'The sequence gets a little longer as you go.',
    ],
    mistake: 'If the order is wrong, the round ends gently and you can try again.',
    scoring: 'The longer the sequence you repeat correctly, the more points you earn.',
  },
  'tower-of-hanoi': {
    title: 'Tower of Hanoi',
    what: 'A classic puzzle with discs stacked on pegs.',
    goal: 'Move the whole stack to another peg.',
    steps: [
      'Tap a peg to pick up its top disc.',
      'Tap another peg to place the disc there.',
      'A larger disc can never sit on a smaller one.',
      'Move all the discs to the target peg to finish.',
    ],
    mistake: 'Invalid moves are simply not allowed — nothing breaks and you can try another move.',
    scoring: 'Completing the puzzle earns points. Using fewer moves earns more.',
  },
};

/** Browser speech synthesis with graceful fallback. Returns false when unavailable. */
export const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export const speakText = (text: string): boolean => {
  if (!speechSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
};

export const stopSpeaking = () => {
  if (speechSupported()) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }
};

export const guideToSpeech = (guide: GameGuide) =>
  [
    `${guide.title}.`,
    guide.what,
    `Your goal: ${guide.goal}`,
    ...guide.steps.map((s, i) => `Step ${i + 1}. ${s}`),
    `If you make a mistake: ${guide.mistake}`,
    `Scoring: ${guide.scoring}`,
  ].join(' ');
