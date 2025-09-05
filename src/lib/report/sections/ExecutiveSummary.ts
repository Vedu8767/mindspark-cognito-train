import { ReportData } from '../../report/types';
import { BRAND, PDFContext } from '../../report/utils';
import { getConsistencyRating, getMostImprovedArea } from '../../report/analysis';

export const renderExecutiveSummary = (ctx: PDFContext, data: ReportData) => {
  ctx.addTitle('EXECUTIVE SUMMARY', 18, BRAND.success, true);
  ctx.addSeparator();

  ctx.addTitle('Key Achievements', 14, [0, 0, 0]);
  ctx.addText(`• Overall cognitive improvement of ${data.overallImprovement} this reporting period`, 11, 10);
  ctx.addText(`• Completed ${data.trainingDays} training days with ${data.totalSessions} total sessions`, 11, 10);
  ctx.addText(`• Earned ${data.achievements} new achievements and badges`, 11, 10);
  ctx.addText(`• Maintained ${data.currentStreak}-day current streak (longest: ${data.longestStreak} days)`, 11, 10);
  ctx.addText(`• Average session duration: ${data.avgSessionDuration}`, 11, 10);
  ctx.yPosition += 10;

  ctx.addTitle('Performance Highlights', 14, [0, 0, 0]);
  ctx.addText(`Best Overall Score: ${data.bestScore}`, 11, 10);
  ctx.addText(`Most Improved Area: ${getMostImprovedArea(data.weeklyProgress)}`, 11, 10);
  ctx.addText(`Consistency Rating: ${getConsistencyRating(data.detailedScores)}`, 11, 10);
  ctx.yPosition += 15;
};
