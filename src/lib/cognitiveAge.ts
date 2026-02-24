// Cognitive Age Estimation Engine
// Analyzes performance across all cognitive domains to estimate "brain age"

export interface CognitiveAgeResult {
  cognitiveAge: number;
  chronologicalAge: number;
  ageDifference: number;
  label: 'younger' | 'same' | 'older';
  domainAges: {
    memory: number;
    attention: number;
    executive: number;
    processing: number;
  };
  strengths: string[];
  weaknesses: string[];
  trend: 'improving' | 'stable' | 'declining';
  confidence: number; // 0-1
}

export interface DomainPerformance {
  memory: number;       // 0-100
  attention: number;    // 0-100
  executive: number;    // 0-100
  processing: number;   // 0-100
  reactionTime: number; // ms average
  consistency: number;  // 0-1
  sessionsCompleted: number;
}

// Age-performance baseline curves (normative data approximation)
// Maps performance score to equivalent age
const AGE_BASELINES: Record<string, { score: number; age: number }[]> = {
  memory: [
    { score: 95, age: 20 }, { score: 90, age: 25 }, { score: 85, age: 30 },
    { score: 80, age: 35 }, { score: 75, age: 40 }, { score: 70, age: 45 },
    { score: 65, age: 50 }, { score: 60, age: 55 }, { score: 55, age: 60 },
    { score: 50, age: 65 }, { score: 45, age: 70 }, { score: 40, age: 75 },
  ],
  attention: [
    { score: 93, age: 20 }, { score: 88, age: 25 }, { score: 84, age: 30 },
    { score: 80, age: 35 }, { score: 76, age: 40 }, { score: 72, age: 45 },
    { score: 67, age: 50 }, { score: 62, age: 55 }, { score: 57, age: 60 },
    { score: 52, age: 65 }, { score: 47, age: 70 }, { score: 42, age: 75 },
  ],
  executive: [
    { score: 92, age: 20 }, { score: 88, age: 25 }, { score: 85, age: 30 },
    { score: 82, age: 35 }, { score: 78, age: 40 }, { score: 74, age: 45 },
    { score: 69, age: 50 }, { score: 64, age: 55 }, { score: 58, age: 60 },
    { score: 52, age: 65 }, { score: 46, age: 70 }, { score: 40, age: 75 },
  ],
  processing: [
    { score: 96, age: 20 }, { score: 92, age: 25 }, { score: 87, age: 30 },
    { score: 82, age: 35 }, { score: 77, age: 40 }, { score: 71, age: 45 },
    { score: 65, age: 50 }, { score: 59, age: 55 }, { score: 53, age: 60 },
    { score: 48, age: 65 }, { score: 43, age: 70 }, { score: 38, age: 75 },
  ],
};

const interpolateAge = (score: number, domain: string): number => {
  const baseline = AGE_BASELINES[domain];
  if (!baseline) return 35;

  // Higher score = younger age
  if (score >= baseline[0].score) return baseline[0].age;
  if (score <= baseline[baseline.length - 1].score) return baseline[baseline.length - 1].age;

  for (let i = 0; i < baseline.length - 1; i++) {
    if (score <= baseline[i].score && score >= baseline[i + 1].score) {
      const ratio = (baseline[i].score - score) / (baseline[i].score - baseline[i + 1].score);
      return baseline[i].age + ratio * (baseline[i + 1].age - baseline[i].age);
    }
  }

  return 35;
};

export const calculateCognitiveAge = (
  performance: DomainPerformance,
  chronologicalAge: number = 35,
  previousScores?: number[]
): CognitiveAgeResult => {
  // Calculate domain-specific ages
  const memoryAge = interpolateAge(performance.memory, 'memory');
  const attentionAge = interpolateAge(performance.attention, 'attention');
  const executiveAge = interpolateAge(performance.executive, 'executive');
  const processingAge = interpolateAge(performance.processing, 'processing');

  // Weighted average (processing speed and memory are weighted more heavily)
  const weights = { memory: 0.3, attention: 0.2, executive: 0.25, processing: 0.25 };
  const weightedAge =
    memoryAge * weights.memory +
    attentionAge * weights.attention +
    executiveAge * weights.executive +
    processingAge * weights.processing;

  // Apply reaction time modifier (faster = younger)
  const reactionModifier = performance.reactionTime < 400 ? -2 :
    performance.reactionTime < 600 ? -1 :
    performance.reactionTime < 800 ? 0 :
    performance.reactionTime < 1000 ? 1 : 2;

  // Apply consistency bonus (more consistent = younger)
  const consistencyBonus = performance.consistency > 0.8 ? -2 :
    performance.consistency > 0.6 ? -1 : 0;

  const cognitiveAge = Math.round(weightedAge + reactionModifier + consistencyBonus);
  const ageDifference = cognitiveAge - chronologicalAge;

  // Determine strengths and weaknesses
  const domainScores = [
    { name: 'Memory', score: performance.memory, age: memoryAge },
    { name: 'Attention', score: performance.attention, age: attentionAge },
    { name: 'Executive Function', score: performance.executive, age: executiveAge },
    { name: 'Processing Speed', score: performance.processing, age: processingAge },
  ];

  domainScores.sort((a, b) => a.age - b.age);
  const strengths = domainScores.slice(0, 2).map(d => d.name);
  const weaknesses = domainScores.slice(-2).reverse().map(d => d.name);

  // Determine trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (previousScores && previousScores.length >= 3) {
    const recentAvg = previousScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = previousScores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    if (recentAvg < olderAvg - 1) trend = 'improving'; // Lower age = better
    else if (recentAvg > olderAvg + 1) trend = 'declining';
  }

  // Confidence based on sessions completed
  const confidence = Math.min(1, performance.sessionsCompleted / 50);

  return {
    cognitiveAge,
    chronologicalAge,
    ageDifference,
    label: ageDifference < -2 ? 'younger' : ageDifference > 2 ? 'older' : 'same',
    domainAges: {
      memory: Math.round(memoryAge),
      attention: Math.round(attentionAge),
      executive: Math.round(executiveAge),
      processing: Math.round(processingAge),
    },
    strengths,
    weaknesses,
    trend,
    confidence,
  };
};
