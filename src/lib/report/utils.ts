import type jsPDF from 'jspdf';

export type RGB = [number, number, number];

export const BRAND = {
  primary: [59, 130, 246] as RGB,
  success: [34, 197, 94] as RGB,
  purple: [168, 85, 247] as RGB,
  amber: [245, 158, 11] as RGB,
  gray: [128, 128, 128] as RGB,
};

export class PDFContext {
  pdf: jsPDF;
  yPosition = 20;
  readonly left = 20;
  readonly right = 190;
  readonly contentWidth = 170; // right - left

  constructor(pdf: jsPDF) {
    this.pdf = pdf;
  }

  addPage() {
    this.pdf.addPage();
    this.yPosition = 20;
  }

  ensureSpace(requiredSpace = 30) {
    if (this.yPosition + requiredSpace > 280) {
      this.addPage();
    }
  }

  addTitle(title: string, fontSize = 16, color: RGB = BRAND.primary, bold = false) {
    this.pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(...color);
    this.pdf.text(title, this.left, this.yPosition);
    this.yPosition += fontSize * 0.7;
  }

  addText(text: string, fontSize = 10, indent = 0) {
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(0, 0, 0);
    const split = this.pdf.splitTextToSize(text, this.contentWidth - indent);
    this.pdf.text(split, this.left + indent, this.yPosition);
    this.yPosition += split.length * fontSize * 0.4;
  }

  addSeparator() {
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.left, this.yPosition, this.right, this.yPosition);
    this.yPosition += 10;
  }

  drawProgressBar(percent: number, options?: { x?: number; y?: number; width?: number; height?: number; color?: RGB }) {
    const x = options?.x ?? 30;
    const y = options?.y ?? this.yPosition + 5;
    const width = options?.width ?? 100;
    const height = options?.height ?? 8;
    const color = options?.color ?? BRAND.primary;

    // Background
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(x, y, width, height, 'F');

    // Progress
    const progressWidth = Math.max(0, Math.min(100, percent)) / 100 * width;
    this.pdf.setFillColor(...color);
    this.pdf.rect(x, y, progressWidth, height, 'F');

    // Label
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(`${percent}%`, x + width + 5, y + 6);

    this.yPosition = y + height + 12;
  }

  addFooter(textLeft: string, textRight?: string) {
    const y = 280;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...BRAND.gray);
    this.pdf.text(textLeft, this.left, y);
    if (textRight) {
      this.pdf.text(textRight, this.left, y + 8);
    }
  }
}
