import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/src/lib/storage/jsonStore';
import { Obligation } from '@/src/lib/types';

export async function GET() {
  const data = await readJsonFile<Obligation[]>('obligations.json', []);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Obligation;
    const data = await readJsonFile<Obligation[]>('obligations.json', []);
    if (data.some((o) => o.id === body.id)) {
      return NextResponse.json({ error: 'ID already exists' }, { status: 400 });
    }
    data.push(body);
    await writeJsonFile('obligations.json', data);
    return NextResponse.json(body, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as Obligation;
    const data = await readJsonFile<Obligation[]>('obligations.json', []);
    const idx = data.findIndex((o) => o.id === body.id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    data[idx] = body;
    await writeJsonFile('obligations.json', data);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const data = await readJsonFile<Obligation[]>('obligations.json', []);
  const next = data.filter((o) => o.id !== id);
  await writeJsonFile('obligations.json', next);
  return NextResponse.json({ ok: true });
}
