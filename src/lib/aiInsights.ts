export interface CognitiveData {
  memory: number[];
  attention: number[];
  executive: number[];
  processing: number[];
}

export interface AIInsight {
  type: 'strength' | 'improvement' | 'trend' | 'prediction';
  title: string;
  description: string;
  score: number;
  recommendation?: string;
}

export const generateAIInsights = (data: CognitiveData): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  // Calculate trends for each domain
  const domains = Object.keys(data) as (keyof CognitiveData)[];
  
  domains.forEach(domain => {
    const scores = data[domain];
    const trend = calculateTrend(scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const consistency = calculateConsistency(scores);
    
    // Identify strengths
    if (avgScore >= 80) {
      insights.push({
        type: 'strength',
        title: `Excellent ${domain.charAt(0).toUpperCase() + domain.slice(1)} Performance`,
        description: `Your ${domain} scores are consistently high with an average of ${avgScore.toFixed(1)}%.`,
        score: avgScore,
        recommendation: `Maintain this excellent performance by continuing regular practice.`
      });
    }
    
    // Identify improvement areas
    if (avgScore < 60) {
      insights.push({
        type: 'improvement',
        title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Needs Attention`,
        description: `Your ${domain} scores average ${avgScore.toFixed(1)}%, indicating room for improvement.`,
        score: avgScore,
        recommendation: `Focus on ${domain} training games and consider increasing practice frequency.`
      });
    }
    
    // Analyze trends
    if (trend > 5) {
      insights.push({
        type: 'trend',
        title: `Strong Upward Trend in ${domain.charAt(0).toUpperCase() + domain.slice(1)}`,
        description: `Your ${domain} performance has improved by ${trend.toFixed(1)}% over the past week.`,
        score: trend,
        recommendation: `Keep up the excellent progress! Your current training approach is working well.`
      });
    } else if (trend < -3) {
      insights.push({
        type: 'trend',
        title: `Declining Trend in ${domain.charAt(0).toUpperCase() + domain.slice(1)}`,
        description: `Your ${domain} performance has decreased by ${Math.abs(trend).toFixed(1)}% recently.`,
        score: Math.abs(trend),
        recommendation: `Consider taking a short break or trying different training exercises to regain momentum.`
      });
    }
    
    // Predict future performance
    const predictedScore = Math.min(100, Math.max(0, avgScore + trend));
    if (predictedScore > avgScore + 2) {
      insights.push({
        type: 'prediction',
        title: `Projected ${domain.charAt(0).toUpperCase() + domain.slice(1)} Growth`,
        description: `Based on current trends, your ${domain} score may reach ${predictedScore.toFixed(1)}% next week.`,
        score: predictedScore,
        recommendation: `Continue your current training regimen to achieve this projected improvement.`
      });
    }
  });
  
  // Overall performance insight
  const overallAvg = domains.reduce((sum, domain) => {
    return sum + (data[domain].reduce((a, b) => a + b, 0) / data[domain].length);
  }, 0) / domains.length;
  
  if (overallAvg >= 75) {
    insights.push({
      type: 'strength',
      title: 'Outstanding Overall Performance',
      description: `Your overall cognitive performance is excellent at ${overallAvg.toFixed(1)}%.`,
      score: overallAvg,
      recommendation: 'Consider challenging yourself with advanced difficulty levels.'
    });
  }
  
  return insights.slice(0, 6); // Return top 6 insights
};

const calculateTrend = (scores: number[]): number => {
  if (scores.length < 2) return 0;
  
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  return secondAvg - firstAvg;
};

const calculateConsistency = (scores: number[]): number => {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
  return Math.sqrt(variance);
};