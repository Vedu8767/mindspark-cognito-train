import { ReportData } from '../../report/types';
import { BRAND, PDFContext } from '../../report/utils';

export const renderGameStats = (ctx: PDFContext, data: ReportData) => {
  if (ctx.yPosition > 200) ctx.addPage();
  ctx.addTitle('GAME-SPECIFIC PERFORMANCE', 18, BRAND.amber, true);
  ctx.addSeparator();

  data.gameStats.forEach((game) => {
    ctx.ensureSpace(25);
    ctx.addTitle(game.name, 12, [0, 0, 0]);
    ctx.addText(`Sessions Played: ${game.sessionsPlayed}`, 9, 10);
    ctx.addText(`Average Score: ${game.averageScore}% | Best Score: ${game.bestScore}%`, 9, 10);
    ctx.addText(`Time Invested: ${game.timeSpent}`, 9, 10);
    ctx.yPosition += 5;
  });
};
