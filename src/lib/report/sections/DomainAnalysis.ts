import { ReportData } from '../../report/types';
import { BRAND, PDFContext } from '../../report/utils';

const domainNames: Record<'memory' | 'attention' | 'executive' | 'processing', string> = {
  memory: 'Memory & Learning',
  attention: 'Attention & Focus',
  executive: 'Executive Function',
  processing: 'Processing Speed',
};

export const renderDomainAnalysis = (ctx: PDFContext, data: ReportData) => {
  ctx.ensureSpace(80);
  ctx.addTitle('DETAILED PERFORMANCE ANALYSIS', 18, BRAND.purple, true);
  ctx.addSeparator();

  (['memory', 'attention', 'executive', 'processing'] as const).forEach((domain) => {
    ctx.ensureSpace(40);
    ctx.addTitle(domainNames[domain], 14, [0, 0, 0]);

    const scores = data.detailedScores[domain];
    const improvement = scores.current - scores.previous;
    const improvementText = improvement >= 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`;

    ctx.addText(`Current Score: ${scores.current}% (${improvementText} from last period)`, 10, 10);
    ctx.addText(`Personal Best: ${scores.best}%`, 10, 10);
    ctx.addText(`Weekly Progress: ${data.weeklyProgress[domain]}`, 10, 10);

    ctx.drawProgressBar(scores.current, { x: 30, width: 100, height: 8, color: BRAND.primary });
  });
};
