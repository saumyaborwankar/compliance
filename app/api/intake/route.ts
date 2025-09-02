import { NextRequest, NextResponse } from 'next/server';
import { BusinessProfile, Obligation } from '@/src/lib/types';
import { evaluateBusinessAgainstObligations } from '@/src/lib/rules/evaluator';
import crypto from 'crypto';
import { readJsonFile } from '@/src/lib/storage/jsonStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const business: BusinessProfile = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      name: body.name?.toString(),
      location: {
        state: String(body.location?.state || ''),
        city: body.location?.city ? String(body.location.city) : undefined,
        zip: body.location?.zip ? String(body.location.zip) : undefined,
      },
      industry: {
        naicsCode: body.industry?.naicsCode ? String(body.industry.naicsCode) : undefined,
        description: body.industry?.description ? String(body.industry.description) : undefined,
      },
      employeeCount: Number(body.employeeCount || 0),
      entityType: body.entityType,
      activities: {
        servesFood: Boolean(body.activities?.servesFood),
        sellsAlcohol: Boolean(body.activities?.sellsAlcohol),
        handlesPersonalData: Boolean(body.activities?.handlesPersonalData),
        employsMinors: Boolean(body.activities?.employsMinors),
        providesHealthcare: Boolean(body.activities?.providesHealthcare),
        operatesVehicles: Boolean(body.activities?.operatesVehicles),
        handlesHazardousMaterials: Boolean(body.activities?.handlesHazardousMaterials),
        eCommerce: Boolean(body.activities?.eCommerce),
      },
    };

    // Evaluate without persisting to disk
    const evaluation = await evaluateBusinessAgainstObligations(business);
    const obligations = await readJsonFile<Obligation[]>('obligations.json', []);

    return NextResponse.json({ business, evaluation, obligations }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to process intake' }, { status: 500 });
  }
}
