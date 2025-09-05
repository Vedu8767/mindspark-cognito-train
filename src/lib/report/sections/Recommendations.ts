import { ReportData } from '../../report/types';
import { BRAND, PDFContext } from '../../report/utils';
import { generatePersonalizedRecommendations } from '../../report/analysis';

export const renderRecommendations = (ctx: PDFContext, data: ReportData) => {
  if (ctx.yPosition > 200) ctx.addPage();
  ctx.addTitle('PERSONALIZED RECOMMENDATIONS', 18, BRAND.success, true);
  ctx.addSeparator();

  const recs = generatePersonalizedRecommendations(data);
  recs.forEach((rec, index) => {
    ctx.ensureSpace(20);
    ctx.addTitle(`${index + 1}. ${rec.title}`, 12, [0, 0, 0]);
    ctx.addText(rec.description, 10, 10);
    if (rec.action) {
      ctx.addText(`Action: ${rec.action}`, 9, 15);
    }
    ctx.yPosition += 5;
  });
};
