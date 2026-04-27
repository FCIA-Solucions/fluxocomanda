import jsPDF from "jspdf";
import autoTable, { type RowInput, type UserOptions } from "jspdf-autotable";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export interface PdfSection {
  title: string;
  head: string[];
  rows: RowInput[];
  emptyMessage?: string;
}

export interface PdfSummary {
  label: string;
  value: string;
}

export interface BuildPdfOptions {
  businessName: string;
  reportTitle: string;
  reportPeriod: string;
  summary: PdfSummary[];
  sections: PdfSection[];
  fileName: string;
}

const FCIA_GREEN: [number, number, number] = [34, 197, 94]; // #22c55e
const TEXT_DARK: [number, number, number] = [15, 23, 42];
const TEXT_MUTED: [number, number, number] = [100, 116, 139];
const BORDER: [number, number, number] = [226, 232, 240];

function drawHeader(doc: jsPDF, businessName: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const top = 14;

  // Esquerda — nome do negócio
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text(businessName || "Meu Negócio", marginX, top + 4);

  // Direita — FluxoComanda + by FCIA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_DARK);
  const brand = "FluxoComanda";
  const brandWidth = doc.getTextWidth(brand);
  doc.text(brand, pageWidth - marginX - brandWidth, top);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FCIA_GREEN);
  const sub = "by FCIA - Soluções em Tecnologia";
  const subWidth = doc.getTextWidth(sub);
  doc.text(sub, pageWidth - marginX - subWidth, top + 5);

  // Linha separadora
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(marginX, top + 9, pageWidth - marginX, top + 9);
}

function drawFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const generatedAt = `Gerado em ${dateTimeFmt.format(new Date())}`;
  const credit = "FluxoComanda · by FCIA - Soluções em Tecnologia";

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(generatedAt, marginX, pageHeight - 8);
    const creditWidth = doc.getTextWidth(credit);
    doc.text(credit, pageWidth - marginX - creditWidth, pageHeight - 8);

    const pageLabel = `${i}/${pageCount}`;
    doc.text(pageLabel, pageWidth / 2 - doc.getTextWidth(pageLabel) / 2, pageHeight - 8);
  }
}

export function buildReportPdf(opts: BuildPdfOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  drawHeader(doc, opts.businessName);

  // Título e período
  let cursorY = 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_DARK);
  doc.text(opts.reportTitle, marginX, cursorY);
  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(opts.reportPeriod, marginX, cursorY);
  cursorY += 6;

  // Cards de resumo (grade 2 colunas)
  if (opts.summary.length) {
    const colCount = 2;
    const gap = 4;
    const cardWidth = (pageWidth - marginX * 2 - gap * (colCount - 1)) / colCount;
    const cardHeight = 18;
    opts.summary.forEach((item, idx) => {
      const col = idx % colCount;
      const row = Math.floor(idx / colCount);
      const x = marginX + col * (cardWidth + gap);
      const y = cursorY + row * (cardHeight + gap);
      doc.setDrawColor(...BORDER);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(item.label.toUpperCase(), x + 3, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...TEXT_DARK);
      doc.text(item.value, x + 3, y + 13);
    });
    const rows = Math.ceil(opts.summary.length / colCount);
    cursorY += rows * (cardHeight + gap) + 4;
  }

  // Seções (tabelas)
  opts.sections.forEach((section) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...TEXT_DARK);
    if (cursorY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      drawHeader(doc, opts.businessName);
      cursorY = 32;
    }
    doc.text(section.title, marginX, cursorY);
    cursorY += 3;

    if (!section.rows.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(section.emptyMessage ?? "Sem dados.", marginX, cursorY + 5);
      cursorY += 12;
      return;
    }

    const tableOpts: UserOptions = {
      head: [section.head],
      body: section.rows,
      startY: cursorY + 2,
      margin: { left: marginX, right: marginX },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5, textColor: TEXT_DARK },
      headStyles: { fillColor: FCIA_GREEN, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: () => {
        drawHeader(doc, opts.businessName);
      },
    };
    autoTable(doc, tableOpts);
    // @ts-expect-error lastAutoTable é injetado pelo plugin
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 8;
  });

  drawFooter(doc);
  doc.save(opts.fileName);
}

export const fmtBRL = (n: number) => brl.format(n || 0);
