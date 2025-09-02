import { Obligation, BusinessProfile, TriggerPredicate, TriggerMatchExplanation, ObligationEvaluation, EvaluationResult } from '../types';
import { readJsonFile, writeJsonFile } from '../storage/jsonStore';
import crypto from 'crypto';

function getValueByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function compareValues(actual: unknown, operator: TriggerPredicate['operator'], expected?: unknown): boolean {
  switch (operator) {
    case 'exists':
      return actual !== undefined && actual !== null;
    case 'not_exists':
      return actual === undefined || actual === null;
    case 'equals':
      return actual === expected;
    case 'not_equals':
      return actual !== expected;
    case 'in':
      return Array.isArray(expected) ? expected.includes(actual as never) : false;
    case 'not_in':
      return Array.isArray(expected) ? !expected.includes(actual as never) : true;
    case 'gte':
      return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
    case 'lte':
      return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
    case 'gt':
      return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
    case 'lt':
      return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
    default:
      return false;
  }
}

export function evaluateObligation(obligation: Obligation, business: BusinessProfile): ObligationEvaluation {
  const matchedPredicates: TriggerMatchExplanation[] = obligation.triggers.map((pred) => {
    const actual = getValueByPath(business, pred.fact);
    const matched = compareValues(actual, pred.operator, pred.value);
    return {
      factPath: pred.fact,
      operator: pred.operator,
      expected: pred.value,
      actual,
      matched,
    };
  });

  const applied = matchedPredicates.every((m) => m.matched);

  return {
    obligationId: obligation.id,
    applied,
    explanation: {
      title: obligation.title,
      jurisdiction: obligation.jurisdiction,
      matchedPredicates,
    },
  };
}

export async function evaluateBusinessAgainstObligations(business: BusinessProfile): Promise<EvaluationResult> {
  const obligations = await readJsonFile<Obligation[]>('obligations.json', []);
  const appliedObligations = obligations.map((rule) => evaluateObligation(rule, business));

  const evaluation: EvaluationResult = {
    id: crypto.randomUUID(),
    businessId: business.id,
    evaluatedAt: new Date().toISOString(),
    appliedObligations,
  };

  const results = await readJsonFile<EvaluationResult[]>('evaluations.json', []);
  results.push(evaluation);
  await writeJsonFile('evaluations.json', results);

  return evaluation;
}
