import { ReportData } from '../../report/types';
import { BRAND, PDFContext } from '../../report/utils';

export const renderCover = (ctx: PDFContext, data: ReportData) => {
  ctx.addTitle('COGNITIVE TRAINING', 28, BRAND.primary, true);
  ctx.addTitle('PERFORMANCE REPORT', 28, BRAND.primary, true);
  ctx.yPosition += 20;

  // Logo placeholder box
  ctx.pdf.setDrawColor(...BRAND.primary);
  ctx.pdf.rect(20, ctx.yPosition, 50, 30);
  ctx.pdf.setFontSize(8);
  ctx.pdf.setTextColor(...BRAND.primary);
  ctx.pdf.text('COGNITIVE', 22, ctx.yPosition + 15);
  ctx.pdf.text('TRAINING', 22, ctx.yPosition + 22);
  ctx.pdf.text('PLATFORM', 22, ctx.yPosition + 28);
  ctx.yPosition += 50;

  ctx.addText(`Prepared for: ${data.userName}`, 14);
  ctx.addText(`Report Period: ${data.reportDate}`, 12);
  ctx.addText(
    `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    12
  );
  ctx.yPosition += 20;

  ctx.addText(
    'This comprehensive report provides detailed insights into your cognitive training progress, performance metrics, and personalized recommendations for continued improvement.',
    10
  );
};
