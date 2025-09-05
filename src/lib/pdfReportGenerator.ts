import jsPDF from 'jspdf';
import { PDFContext } from './report/utils';
import type { ReportData } from './report/types';
import {
  renderCover,
  renderExecutiveSummary,
  renderDomainAnalysis,
  renderGameStats,
  renderRecommendations,
  renderNextSteps,
} from './report/sections';

export type { ReportData } from './report/types';

export const generatePDFReport = async (data: ReportData) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const ctx = new PDFContext(pdf);

  // Cover Page
  renderCover(ctx, data);

  // Executive Summary
  ctx.addPage();
  renderExecutiveSummary(ctx, data);

  // Detailed Domain Analysis
  renderDomainAnalysis(ctx, data);

  // Game-Specific Statistics
  renderGameStats(ctx, data);

  // Personalized Recommendations
  renderRecommendations(ctx, data);

  // Next Steps & Footer
  renderNextSteps(ctx, data);

  // Save the PDF
  pdf.save(`cognitive-training-detailed-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
