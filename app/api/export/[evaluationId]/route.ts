import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile } from '@/src/lib/storage/jsonStore';
import { EvaluationResult, Obligation } from '@/src/lib/types';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(_req: NextRequest, { params }: { params: { evaluationId: string } }) {
  const evaluations = await readJsonFile<EvaluationResult[]>('evaluations.json', []);
  const obligations = await readJsonFile<Obligation[]>('obligations.json', []);
  const ev = evaluations.find((e) => e.id === params.evaluationId);
  if (!ev) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const byId = new Map(obligations.map((o) => [o.id, o] as const));
  const applied = ev.appliedObligations.filter((a) => a.applied);

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = 742;
  const lineHeight = 16;

  function drawText(text: string, bold = false, size = 12) {
    const wrapped = wrapText(text, 612 - margin * 2, size, bold ? fontBold : font);
    for (const line of wrapped) {
      if (y < margin + lineHeight) {
        page = pdf.addPage([612, 792]);
        y = 742;
      }
      page.drawText(line, { x: margin, y, size, font: bold ? fontBold : font, color: rgb(0,0,0) });
      y -= lineHeight;
    }
  }

  function wrapText(text: string, maxWidth: number, size: number, f: any) {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const test = current ? current + ' ' + w : w;
      const width = f.widthOfTextAtSize(test, size);
      if (width > maxWidth && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  drawText('Compliance Checklist', true, 18);
  y -= 8;
  drawText(`Evaluation ID: ${ev.id}`);
  drawText(`Evaluated: ${new Date(ev.evaluatedAt).toLocaleString()}`);
  y -= 8;

  for (const a of applied) {
    const ob = byId.get(a.obligationId);
    if (!ob) continue;
    y -= 8;
    drawText(ob.title, true, 14);
    if (ob.summary) drawText(ob.summary);
    if (ob.actions?.length) drawText('Actions:', true);
    for (const act of ob.actions) drawText('• ' + act.summary);
    if (ob.frequency) drawText('Frequency: ' + ob.frequency);
    if (ob.penalties) drawText('Penalties: ' + ob.penalties);
    if (ob.citations?.length) drawText('Citations:', true);
    for (const c of ob.citations) drawText(`- ${c.text} (${c.url})`);
    drawText('Why this applies:', true);
    for (const m of a.explanation.matchedPredicates) {
      drawText(`- ${m.factPath} ${m.operator} ${m.expected !== undefined ? JSON.stringify(m.expected) : ''} -> actual ${JSON.stringify(m.actual)} ${m.matched ? '✓' : '✕'}`);
    }
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="compliance-${ev.id}.pdf"` } });
}
