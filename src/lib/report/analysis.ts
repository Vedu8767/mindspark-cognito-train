import { ReportData } from './types';

export const getMostImprovedArea = (progress: ReportData['weeklyProgress']): string => {
  const improvements = Object.entries(progress).map(([domain, value]) => ({
    domain,
    improvement: parseFloat(value.replace(/[^\d.-]/g, '')),
  }));

  const best = improvements.reduce((max, current) =>
    current.improvement > max.improvement ? current : max
  );

  return `${best.domain.charAt(0).toUpperCase() + best.domain.slice(1)} (${best.improvement}%)`;
};

export const getConsistencyRating = (
  scores: ReportData['detailedScores']
): string => {
  const avgConsistency =
    Object.values(scores).reduce((sum, score) => {
      const variation = Math.abs(score.current - score.previous);
      return sum + (variation <= 5 ? 100 : Math.max(0, 100 - variation * 2));
    }, 0) / 4;

  if (avgConsistency >= 85) return 'Excellent';
  if (avgConsistency >= 70) return 'Good';
  if (avgConsistency >= 50) return 'Fair';
  return 'Needs Improvement';
};

export const generatePersonalizedRecommendations = (data: ReportData) => {
  const recommendations: Array<{ title: string; description: string; action?: string }> = [];

  Object.entries(data.detailedScores).forEach(([domain, scores]) => {
    if (scores.current < 70) {
      recommendations.push({
        title: `Strengthen ${domain.charAt(0).toUpperCase() + domain.slice(1)} Skills`,
        description: `Your ${domain} score of ${scores.current}% indicates room for improvement. Focus on specific exercises targeting this cognitive domain.`,
        action: `Increase ${domain}-based training sessions to 3-4 times per week.`,
      });
    }

    if (scores.current - scores.previous < 0) {
      recommendations.push({
        title: `Address ${domain.charAt(0).toUpperCase() + domain.slice(1)} Decline`,
        description: `Recent decline in ${domain} performance requires attention to prevent further regression.`,
        action: `Review training techniques and consider consulting with a cognitive specialist.`,
      });
    }
  });

  if (data.currentStreak < 7) {
    recommendations.push({
      title: 'Improve Training Consistency',
      description:
        'Regular daily practice is crucial for cognitive improvement. Your current streak could be extended.',
      action: 'Set daily reminders and establish a consistent training schedule.',
    });
  }

  return recommendations.slice(0, 5);
};

export const getNextSteps = (data: ReportData): string[] => {
  const steps: string[] = [];

  const lowestDomain = Object.entries(data.detailedScores).reduce(
    (min, [domain, scores]) =>
      scores.current < min.score ? { domain, score: scores.current } : min,
    { domain: '', score: 100 }
  );

  steps.push(`Prioritize ${lowestDomain.domain} training exercises`);
  steps.push('Maintain current streak and aim for 30+ consecutive days');
  steps.push('Challenge yourself with higher difficulty levels in strong areas');
  steps.push('Track daily performance metrics for better insights');
  steps.push('Schedule follow-up assessment in 2 weeks');

  return steps;
};
