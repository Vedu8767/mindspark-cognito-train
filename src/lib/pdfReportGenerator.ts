import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportData {
  userName: string;
  reportDate: string;
  overallImprovement: string;
  trainingDays: number;
  achievements: number;
  bestScore: string;
  totalSessions: number;
  avgSessionDuration: string;
  longestStreak: number;
  currentStreak: number;
  weeklyProgress: {
    memory: string;
    attention: string;
    executive: string;
    processing: string;
  };
  detailedScores: {
    memory: { current: number; previous: number; best: number };
    attention: { current: number; previous: number; best: number };
    executive: { current: number; previous: number; best: number };
    processing: { current: number; previous: number; best: number };
  };
  gameStats: Array<{
    name: string;
    sessionsPlayed: number;
    averageScore: number;
    bestScore: number;
    timeSpent: string;
  }>;
}

export const generatePDFReport = async (data: ReportData) => {
  const pdf = new jsPDF();
  let yPosition = 20;
  
  // Helper functions
  const addPage = () => {
    pdf.addPage();
    yPosition = 20;
  };
  
  const addTitle = (title: string, fontSize: number = 16, color: [number, number, number] = [59, 130, 246]) => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);
    pdf.text(title, 20, yPosition);
    yPosition += fontSize * 0.7;
  };
  
  const addText = (text: string, fontSize: number = 10, indent: number = 0) => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);
    const splitText = pdf.splitTextToSize(text, 170 - indent);
    pdf.text(splitText, 20 + indent, yPosition);
    yPosition += splitText.length * fontSize * 0.4;
  };
  
  const addSeparator = () => {
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 10;
  };
  
  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > 280) {
      addPage();
    }
  };
  
  // Cover Page
  addTitle('COGNITIVE TRAINING', 28, [59, 130, 246]);
  addTitle('PERFORMANCE REPORT', 28, [59, 130, 246]);
  yPosition += 20;
  
  // Company logo area (placeholder)
  pdf.setDrawColor(59, 130, 246);
  pdf.rect(20, yPosition, 50, 30);
  pdf.setFontSize(8);
  pdf.setTextColor(59, 130, 246);
  pdf.text('COGNITIVE', 22, yPosition + 15);
  pdf.text('TRAINING', 22, yPosition + 22);
  pdf.text('PLATFORM', 22, yPosition + 28);
  yPosition += 50;
  
  addText(`Prepared for: ${data.userName}`, 14);
  addText(`Report Period: ${data.reportDate}`, 12);
  addText(`Generated on: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 12);
  yPosition += 20;
  
  addText('This comprehensive report provides detailed insights into your cognitive training progress, performance metrics, and personalized recommendations for continued improvement.', 10);
  
  // Page 2 - Executive Summary
  addPage();
  addTitle('EXECUTIVE SUMMARY', 18, [34, 197, 94]);
  addSeparator();
  
  addTitle('Key Achievements', 14, [0, 0, 0]);
  addText(`• Overall cognitive improvement of ${data.overallImprovement} this reporting period`, 11, 10);
  addText(`• Completed ${data.trainingDays} training days with ${data.totalSessions} total sessions`, 11, 10);
  addText(`• Earned ${data.achievements} new achievements and badges`, 11, 10);
  addText(`• Maintained ${data.currentStreak}-day current streak (longest: ${data.longestStreak} days)`, 11, 10);
  addText(`• Average session duration: ${data.avgSessionDuration}`, 11, 10);
  yPosition += 10;
  
  addTitle('Performance Highlights', 14, [0, 0, 0]);
  addText(`Best Overall Score: ${data.bestScore}`, 11, 10);
  addText(`Most Improved Area: ${getMostImprovedArea(data.weeklyProgress)}`, 11, 10);
  addText(`Consistency Rating: ${getConsistencyRating(data.detailedScores)}`, 11, 10);
  yPosition += 15;
  
  // Detailed Performance Analysis
  checkPageBreak(80);
  addTitle('DETAILED PERFORMANCE ANALYSIS', 18, [168, 85, 247]);
  addSeparator();
  
  const domains = ['memory', 'attention', 'executive', 'processing'] as const;
  const domainNames = {
    memory: 'Memory & Learning',
    attention: 'Attention & Focus',
    executive: 'Executive Function',
    processing: 'Processing Speed'
  };
  
  domains.forEach((domain) => {
    checkPageBreak(40);
    addTitle(domainNames[domain], 14, [0, 0, 0]);
    
    const scores = data.detailedScores[domain];
    const improvement = scores.current - scores.previous;
    const improvementText = improvement >= 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`;
    const improvementColor = improvement >= 0 ? 'improvement' : 'decline';
    
    addText(`Current Score: ${scores.current}% (${improvementText} from last period)`, 10, 10);
    addText(`Personal Best: ${scores.best}%`, 10, 10);
    addText(`Weekly Progress: ${data.weeklyProgress[domain]}`, 10, 10);
    
    // Performance bar visualization
    const barWidth = 100;
    const barHeight = 8;
    const barY = yPosition + 5;
    
    // Background bar
    pdf.setFillColor(240, 240, 240);
    pdf.rect(30, barY, barWidth, barHeight, 'F');
    
    // Progress bar
    const progressWidth = (scores.current / 100) * barWidth;
    pdf.setFillColor(59, 130, 246);
    pdf.rect(30, barY, progressWidth, barHeight, 'F');
    
    // Score text
    pdf.setFontSize(8);
    pdf.text(`${scores.current}%`, 135, barY + 6);
    
    yPosition += 25;
  });
  
  // Game-Specific Statistics
  if (yPosition > 200) addPage();
  addTitle('GAME-SPECIFIC PERFORMANCE', 18, [245, 158, 11]);
  addSeparator();
  
  data.gameStats.forEach((game, index) => {
    checkPageBreak(25);
    addTitle(game.name, 12, [0, 0, 0]);
    addText(`Sessions Played: ${game.sessionsPlayed}`, 9, 10);
    addText(`Average Score: ${game.averageScore}% | Best Score: ${game.bestScore}%`, 9, 10);
    addText(`Time Invested: ${game.timeSpent}`, 9, 10);
    yPosition += 5;
  });
  
  // Recommendations
  if (yPosition > 200) addPage();
  addTitle('PERSONALIZED RECOMMENDATIONS', 18, [34, 197, 94]);
  addSeparator();
  
  const recommendations = generatePersonalizedRecommendations(data);
  recommendations.forEach((rec, index) => {
    checkPageBreak(20);
    addTitle(`${index + 1}. ${rec.title}`, 12, [0, 0, 0]);
    addText(rec.description, 10, 10);
    if (rec.action) {
      addText(`Action: ${rec.action}`, 9, 15);
    }
    yPosition += 5;
  });
  
  // Next Steps
  checkPageBreak(50);
  addTitle('NEXT STEPS & GOALS', 16, [168, 85, 247]);
  addSeparator();
  
  addText('Based on your current performance, we recommend focusing on:', 11);
  const nextSteps = getNextSteps(data);
  nextSteps.forEach(step => {
    addText(`• ${step}`, 10, 10);
  });
  
  // Footer on last page
  yPosition = 280;
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text('Generated by Cognitive Training Platform | Confidential Report', 20, yPosition);
  pdf.text(`Report ID: CTR-${Date.now().toString(36).toUpperCase()}`, 20, yPosition + 8);
  
  // Save the PDF
  pdf.save(`cognitive-training-detailed-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Helper functions
const getMostImprovedArea = (progress: ReportData['weeklyProgress']): string => {
  const improvements = Object.entries(progress).map(([domain, value]) => ({
    domain,
    improvement: parseFloat(value.replace(/[^\d.-]/g, ''))
  }));
  
  const best = improvements.reduce((max, current) => 
    current.improvement > max.improvement ? current : max
  );
  
  return `${best.domain.charAt(0).toUpperCase() + best.domain.slice(1)} (${best.improvement}%)`;
};

const getConsistencyRating = (scores: ReportData['detailedScores']): string => {
  const avgConsistency = Object.values(scores).reduce((sum, score) => {
    const variation = Math.abs(score.current - score.previous);
    return sum + (variation <= 5 ? 100 : Math.max(0, 100 - variation * 2));
  }, 0) / 4;
  
  if (avgConsistency >= 85) return 'Excellent';
  if (avgConsistency >= 70) return 'Good';
  if (avgConsistency >= 50) return 'Fair';
  return 'Needs Improvement';
};

const generatePersonalizedRecommendations = (data: ReportData) => {
  const recommendations = [];
  
  Object.entries(data.detailedScores).forEach(([domain, scores]) => {
    if (scores.current < 70) {
      recommendations.push({
        title: `Strengthen ${domain.charAt(0).toUpperCase() + domain.slice(1)} Skills`,
        description: `Your ${domain} score of ${scores.current}% indicates room for improvement. Focus on specific exercises targeting this cognitive domain.`,
        action: `Increase ${domain}-based training sessions to 3-4 times per week.`
      });
    }
    
    if (scores.current - scores.previous < 0) {
      recommendations.push({
        title: `Address ${domain.charAt(0).toUpperCase() + domain.slice(1)} Decline`,
        description: `Recent decline in ${domain} performance requires attention to prevent further regression.`,
        action: `Review training techniques and consider consulting with a cognitive specialist.`
      });
    }
  });
  
  if (data.currentStreak < 7) {
    recommendations.push({
      title: 'Improve Training Consistency',
      description: 'Regular daily practice is crucial for cognitive improvement. Your current streak could be extended.',
      action: 'Set daily reminders and establish a consistent training schedule.'
    });
  }
  
  return recommendations.slice(0, 5);
};

const getNextSteps = (data: ReportData): string[] => {
  const steps = [];
  
  const lowestDomain = Object.entries(data.detailedScores).reduce((min, [domain, scores]) => 
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