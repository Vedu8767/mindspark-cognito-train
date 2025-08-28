import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Target, Brain, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExecutiveFunctionGameProps {
  onComplete: (score: number) => void;
  onExit: () => void;
}

interface Task {
  id: number;
  type: 'stroop' | 'switching' | 'inhibition' | 'updating';
  stimulus: string;
  correctResponse: string;
  options: string[];
  color?: string;
  completed?: boolean;
  correct?: boolean;
  responseTime?: number;
}

const LEVELS = [
  { level: 1, tasks: 15, taskTypes: ['stroop'], timeLimit: 90 },
  { level: 2, tasks: 18, taskTypes: ['stroop', 'switching'], timeLimit: 100 },
  { level: 3, tasks: 20, taskTypes: ['stroop', 'switching', 'inhibition'], timeLimit: 110 },
  { level: 4, tasks: 24, taskTypes: ['stroop', 'switching', 'inhibition', 'updating'], timeLimit: 120 },
  { level: 5, tasks: 30, taskTypes: ['stroop', 'switching', 'inhibition', 'updating'], timeLimit: 150 },
];

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
const COLOR_WORDS = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];

const ExecutiveFunctionGame = ({ onComplete, onExit }: ExecutiveFunctionGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentTask, setCurrentTask] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [taskStartTime, setTaskStartTime] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('');

  const level = LEVELS[currentLevel];

  useEffect(() => {
    if (currentLevel < LEVELS.length) {
      generateTasks();
    }
  }, [currentLevel]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameComplete) {
      completeLevel();
    }
  }, [timeLeft, gameStarted, gameComplete, levelComplete]);

  const generateStroopTask = (id: number): Task => {
    const word = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    return {
      id,
      type: 'stroop',
      stimulus: word,
      color,
      correctResponse: color,
      options: COLORS
    };
  };

  const generateSwitchingTask = (id: number): Task => {
    const isNumberTask = Math.random() > 0.5;
    
    if (isNumberTask) {
      const number = Math.floor(Math.random() * 9) + 1;
      return {
        id,
        type: 'switching',
        stimulus: `${number}`,
        correctResponse: number % 2 === 0 ? 'even' : 'odd',
        options: ['even', 'odd']
      };
    } else {
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const vowels = ['A', 'E', 'I', 'O', 'U'];
      return {
        id,
        type: 'switching',
        stimulus: letter,
        correctResponse: vowels.includes(letter) ? 'vowel' : 'consonant',
        options: ['vowel', 'consonant']
      };
    }
  };

  const generateInhibitionTask = (id: number): Task => {
    const directions = ['left', 'right', 'up', 'down'];
    const arrows = ['←', '→', '↑', '↓'];
    const targetDirection = directions[Math.floor(Math.random() * directions.length)];
    const arrowDirection = Math.random() > 0.3 ? targetDirection : 
      directions[Math.floor(Math.random() * directions.length)];
    
    const arrowIndex = directions.indexOf(arrowDirection);
    
    return {
      id,
      type: 'inhibition',
      stimulus: arrows[arrowIndex],
      correctResponse: targetDirection,
      options: directions
    };
  };

  const generateUpdatingTask = (id: number): Task => {
    const sequences = [
      ['A', 'B', 'C'], ['1', '2', '3'], ['X', 'Y', 'Z']
    ];
    const sequence = sequences[Math.floor(Math.random() * sequences.length)];
    const missing = Math.floor(Math.random() * sequence.length);
    const stimulus = sequence.map((item, index) => index === missing ? '?' : item).join(' ');
    
    return {
      id,
      type: 'updating',
      stimulus,
      correctResponse: sequence[missing],
      options: sequence
    };
  };

  const generateTasks = () => {
    const taskGenerators = {
      stroop: generateStroopTask,
      switching: generateSwitchingTask,
      inhibition: generateInhibitionTask,
      updating: generateUpdatingTask
    };

    const newTasks: Task[] = [];
    for (let i = 0; i < level.tasks; i++) {
      const taskType = level.taskTypes[Math.floor(Math.random() * level.taskTypes.length)] as keyof typeof taskGenerators;
      newTasks.push(taskGenerators[taskType](i));
    }

    setTasks(newTasks);
    setCurrentTask(0);
    setTimeLeft(level.timeLimit);
    setLevelComplete(false);
    setCorrect(0);
    updateInstruction(newTasks[0]);
  };

  const updateInstruction = (task: Task) => {
    switch (task.type) {
      case 'stroop':
        setCurrentInstruction('Select the COLOR of the word (ignore what it says)');
        break;
      case 'switching':
        if (task.options.includes('even')) {
          setCurrentInstruction('Is this number even or odd?');
        } else {
          setCurrentInstruction('Is this letter a vowel or consonant?');
        }
        break;
      case 'inhibition':
        setCurrentInstruction('What direction does the arrow point?');
        break;
      case 'updating':
        setCurrentInstruction('What letter/number is missing from the sequence?');
        break;
    }
  };

  const handleAnswer = (selectedAnswer: string) => {
    const responseTime = Date.now() - taskStartTime;
    const task = tasks[currentTask];
    const isCorrect = selectedAnswer === task.correctResponse;

    const updatedTask = {
      ...task,
      completed: true,
      correct: isCorrect,
      responseTime
    };

    setTasks(prev => {
      const updated = [...prev];
      updated[currentTask] = updatedTask;
      return updated;
    });

    if (isCorrect) {
      const timeBonus = Math.max(0, 20 - Math.floor(responseTime / 1000));
      const difficultyBonus = task.type === 'stroop' ? 5 : task.type === 'updating' ? 15 : 10;
      const points = difficultyBonus + timeBonus;
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentTask + 1 >= level.tasks) {
        completeLevel();
      } else {
        const nextTask = currentTask + 1;
        setCurrentTask(nextTask);
        updateInstruction(tasks[nextTask]);
        setTaskStartTime(Date.now());
      }
    }, 1000);
  };

  const completeLevel = () => {
    setLevelComplete(true);
    
    // Calculate level completion bonus
    const accuracyBonus = Math.floor((correct / level.tasks) * 60);
    const timeBonus = Math.floor(timeLeft * 2);
    setScore(prev => prev + accuracyBonus + timeBonus);
    
    setTimeout(() => {
      if (currentLevel < LEVELS.length - 1) {
        setCurrentLevel(prev => prev + 1);
      } else {
        endGame();
      }
    }, 3000);
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = Math.min(100, Math.floor((score / 500) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    setTaskStartTime(Date.now());
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-success to-success-light rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Executive Master!</h2>
            <p className="text-muted-foreground mb-4">
              You completed all {LEVELS.length} levels with {correct} correct responses!
            </p>
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-lg font-bold text-primary">Final Score: {score}</p>
            </div>
          </div>
          <div className="space-y-4">
            <Button onClick={restartGame} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Again
            </Button>
            <Button onClick={onExit} className="w-full btn-primary">
              <Home className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (levelComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel + 1} Complete!</h2>
            <p className="text-muted-foreground">
              Excellent cognitive control! Moving to the next challenge.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-xl font-bold text-success">{correct}/{level.tasks}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary p-4">
      <div className="container mx-auto max-w-3xl">
        {/* Game Header */}
        <div className="glass-card-strong p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Executive Function - Level {currentLevel + 1}</h1>
              <p className="text-muted-foreground">Test your cognitive control and flexibility!</p>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit Game
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Time</p>
            <p className="text-lg font-bold text-foreground">{timeLeft}s</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Task</p>
            <p className="text-lg font-bold text-foreground">{currentTask + 1}/{level.tasks}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-lg font-bold text-foreground">{score}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Correct</p>
            <p className="text-lg font-bold text-success">{correct}</p>
          </div>
        </div>

        {/* Game Area */}
        <div className="glass-card p-8">
          <div className="text-center space-y-8">
            {!gameStarted ? (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Executive Function Training</h2>
                  <div className="text-left max-w-lg mx-auto space-y-2 mb-6">
                    <p className="text-sm text-muted-foreground">🎯 Stroop Test: Name the color, not the word</p>
                    <p className="text-sm text-muted-foreground">🔄 Task Switching: Adapt to changing rules</p>
                    <p className="text-sm text-muted-foreground">🚫 Inhibition: Resist automatic responses</p>
                    <p className="text-sm text-muted-foreground">🧠 Working Memory: Update and maintain information</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-foreground">Level {currentLevel + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {level.tasks} tasks in {level.timeLimit} seconds
                    </p>
                  </div>
                </div>
                <Button onClick={startGame} className="btn-primary">
                  <Brain className="h-4 w-4 mr-2" />
                  Start Training
                </Button>
              </div>
            ) : tasks.length > 0 && currentTask < tasks.length ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-lg font-medium text-muted-foreground">{currentInstruction}</p>
                  
                  <div className="text-6xl font-bold text-foreground" 
                       style={{ color: tasks[currentTask].color || 'inherit' }}>
                    {tasks[currentTask].stimulus}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
                    {tasks[currentTask].options.map((option, index) => (
                      <Button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className="h-16 text-lg font-medium bg-gradient-to-br from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary text-secondary-foreground capitalize"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveFunctionGame;