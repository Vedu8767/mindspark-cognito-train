import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Trophy, Brain, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { executiveFunctionBandit, type ExecutiveContext, type ExecutiveAction } from '@/lib/bandit/executiveFunctionBandit';

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

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
const COLOR_WORDS = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];

const ExecutiveFunctionGame = ({ onComplete, onExit }: ExecutiveFunctionGameProps) => {
  const [currentLevel, setCurrentLevel] = useState(1);
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
  const [currentAction, setCurrentAction] = useState<ExecutiveAction | null>(null);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [taskTypeStats, setTaskTypeStats] = useState<Record<string, { correct: number; total: number }>>({});
  const [levelStartTime, setLevelStartTime] = useState(0);

  const getContext = useCallback((): ExecutiveContext => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 1500;
    
    const getTypeAccuracy = (type: string) => {
      const stats = taskTypeStats[type];
      return stats ? stats.correct / Math.max(1, stats.total) : 0.5;
    };
    
    return {
      currentLevel,
      recentAccuracy: tasks.length > 0 ? correct / Math.max(1, currentTask) : 0.5,
      recentSpeed: Math.min(1, 2000 / Math.max(300, avgResponseTime)),
      sessionLength: Math.floor((Date.now() - levelStartTime) / 60000),
      timeOfDay,
      streakCount: 0,
      stroopAccuracy: getTypeAccuracy('stroop'),
      switchingAccuracy: getTypeAccuracy('switching'),
      inhibitionAccuracy: getTypeAccuracy('inhibition'),
      updatingAccuracy: getTypeAccuracy('updating'),
      taskSwitchCost: 0.3,
    };
  }, [currentLevel, correct, currentTask, responseTimes, tasks.length, taskTypeStats, levelStartTime]);

  useEffect(() => {
    if (gameStarted && !levelComplete && !gameComplete) {
      const context = getContext();
      const action = executiveFunctionBandit.selectAction(context);
      setCurrentAction(action);
      generateTasks(action);
    }
  }, [currentLevel, gameStarted]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameComplete && !levelComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !gameComplete && !levelComplete && currentAction) {
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

  const generateTasks = (action: ExecutiveAction) => {
    const taskGenerators: Record<string, (id: number) => Task> = {
      stroop: generateStroopTask,
      switching: generateSwitchingTask,
      inhibition: generateInhibitionTask,
      updating: generateUpdatingTask
    };

    const newTasks: Task[] = [];
    for (let i = 0; i < action.taskCount; i++) {
      const taskType = action.taskTypes[Math.floor(Math.random() * action.taskTypes.length)];
      newTasks.push(taskGenerators[taskType](i));
    }

    setTasks(newTasks);
    setCurrentTask(0);
    setTimeLeft(action.timeLimit);
    setLevelComplete(false);
    setCorrect(0);
    setResponseTimes([]);
    setTaskTypeStats({});
    setLevelStartTime(Date.now());
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
    if (!currentAction) return;
    
    const responseTime = Date.now() - taskStartTime;
    setResponseTimes(prev => [...prev, responseTime]);
    
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

    // Update task type stats
    setTaskTypeStats(prev => {
      const typeStats = prev[task.type] || { correct: 0, total: 0 };
      return {
        ...prev,
        [task.type]: {
          correct: typeStats.correct + (isCorrect ? 1 : 0),
          total: typeStats.total + 1
        }
      };
    });

    if (isCorrect) {
      const timeBonus = Math.max(0, 20 - Math.floor(responseTime / 1000));
      const difficultyBonus = task.type === 'stroop' ? 5 : task.type === 'updating' ? 15 : 10;
      const levelBonus = Math.floor(currentLevel * 0.5);
      const points = difficultyBonus + timeBonus + levelBonus;
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentTask + 1 >= currentAction.taskCount) {
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
    if (!currentAction) return;
    
    setLevelComplete(true);
    
    const context = getContext();
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 1500;
    
    const taskTypeAccuracy: Record<string, number> = {};
    Object.entries(taskTypeStats).forEach(([type, stats]) => {
      taskTypeAccuracy[type] = stats.correct / Math.max(1, stats.total);
    });
    
    executiveFunctionBandit.updateModel(context, currentAction, {
      accuracy: correct / currentAction.taskCount,
      avgResponseTime,
      completed: true,
      timeRemaining: timeLeft,
      taskTypeAccuracy,
    });
    
    const accuracyBonus = Math.floor((correct / currentAction.taskCount) * 60);
    const timeBonus = Math.floor(timeLeft * 2);
    setScore(prev => prev + accuracyBonus + timeBonus);
  };

  const proceedToNextLevel = () => {
    const context = getContext();
    const nextLevel = executiveFunctionBandit.getOptimalLevel(context);
    
    if (nextLevel > currentLevel && currentLevel >= 25) {
      endGame();
    } else {
      setCurrentLevel(nextLevel);
      setLevelComplete(false);
    }
  };

  const endGame = () => {
    setGameComplete(true);
    const finalScore = Math.min(100, Math.floor((score / 600) * 100));
    setTimeout(() => onComplete(finalScore), 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    setTaskStartTime(Date.now());
    setLevelStartTime(Date.now());
  };

  const restartGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setGameComplete(false);
    setGameStarted(false);
    setCurrentAction(null);
    setResponseTimes([]);
    setTaskTypeStats({});
  };

  const banditStats = executiveFunctionBandit.getStats();
  const context = getContext();
  const nextDifficulty = executiveFunctionBandit.predictNextLevelDifficulty(context);
  const insight = executiveFunctionBandit.getPerformanceInsight(context);

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
              You reached level {currentLevel} with {correct} correct responses!
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

  if (levelComplete && currentAction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center p-4">
        <div className="glass-card-strong p-8 max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div className="p-4 bg-gradient-to-br from-primary to-primary-dark rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Level {currentLevel} Complete!</h2>
            
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">{insight}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-xl font-bold text-success">{correct}/{currentAction.taskCount}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold text-primary">{score}</p>
              </div>
            </div>
            
            {/* Task Type Breakdown */}
            {Object.keys(taskTypeStats).length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {Object.entries(taskTypeStats).map(([type, stats]) => (
                  <div key={type} className="bg-muted/30 p-2 rounded">
                    <span className="capitalize">{type}</span>: {stats.correct}/{stats.total}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 p-3 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">Next Level Prediction</p>
              <div className="flex items-center justify-center gap-2">
                {nextDifficulty === 'harder' && (
                  <>
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span className="text-success font-medium">Moving Up!</span>
                  </>
                )}
                {nextDifficulty === 'easier' && (
                  <>
                    <TrendingDown className="h-5 w-5 text-warning" />
                    <span className="text-warning font-medium">Adjusting Down</span>
                  </>
                )}
                {nextDifficulty === 'same' && (
                  <>
                    <Minus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground font-medium">Same Level</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <Button onClick={proceedToNextLevel} className="w-full btn-primary">
            Continue
          </Button>
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
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">Executive Function - Level {currentLevel}</h1>
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Adaptive
                </span>
              </div>
              <p className="text-muted-foreground">Test your cognitive control and flexibility!</p>
            </div>
            <Button onClick={onExit} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Exit Game
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Time</p>
            <p className="text-lg font-bold text-foreground">{timeLeft}s</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Task</p>
            <p className="text-lg font-bold text-foreground">{currentTask + 1}/{currentAction?.taskCount || 0}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-lg font-bold text-foreground">{score}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Correct</p>
            <p className="text-lg font-bold text-success">{correct}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">AI Explore</p>
            <p className="text-lg font-bold text-primary">{Math.round(banditStats.epsilon * 100)}%</p>
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
                    <p className="text-sm text-muted-foreground">🤖 AI adapts difficulty to your performance</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-foreground">Starting Level {currentLevel}</p>
                    <p className="text-xs text-muted-foreground">
                      AI Skill: {Math.round(banditStats.skillLevel * 100)}%
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
