import { NextRequest, NextResponse } from 'next/server';
import { appendToJsonArray } from '@/src/lib/storage/jsonStore';
import { BusinessProfile } from '@/src/lib/types';
import { evaluateBusinessAgainstObligations } from '@/src/lib/rules/evaluator';
import crypto from 'crypto';

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

    // Persist business
    await appendToJsonArray<BusinessProfile>('businesses.json', business);

    // Evaluate
    const evaluation = await evaluateBusinessAgainstObligations(business);

    return NextResponse.json({ businessId: business.id, evaluationId: evaluation.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to process intake' }, { status: 500 });
  }
}
